"""
Local security tests for the Supabase migrations. No Supabase account needed.

Spins up a throwaway Postgres, adds a tiny stand-in for Supabase's auth schema and roles,
applies every migration, then tries to attack the database as different users.

    pip install pgserver psycopg2-binary
    python supabase/tests/rls_security_test.py              # all migrations
    python supabase/tests/rls_security_test.py --baseline   # skip the security fixes (shows the holes)

This is a close imitation of Supabase, not Supabase itself. Repeat the attacks once on a real test project.
"""
import glob
import os
import sys
import tempfile
import uuid

import pgserver
import psycopg2

BASELINE = "--baseline" in sys.argv
HERE = os.path.dirname(os.path.abspath(__file__))
MIGRATIONS = sorted(glob.glob(os.path.join(HERE, "..", "migrations", "*.sql")))
if BASELINE:
    MIGRATIONS = [m for m in MIGRATIONS if "security_fixes" not in m and "consent_record" not in m]

SHIM = """
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text unique,
                         raw_user_meta_data jsonb not null default '{}'::jsonb);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.role() returns text language sql stable as
  $$ select case when auth.uid() is null then 'anon' else 'authenticated' end $$;
grant usage on schema public, auth to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
"""

server = pgserver.get_server(tempfile.mkdtemp())
conn = psycopg2.connect(server.get_uri())
conn.autocommit = True
cur = conn.cursor()
cur.execute(SHIM)
for path in MIGRATIONS:
    # pgcrypto ships with Supabase; the throwaway Postgres lacks it and PG13+ has gen_random_uuid() built in.
    cur.execute(open(path).read().replace("create extension if not exists pgcrypto;", ""))
conn.autocommit = False


def admin(sql, params=None):
    """Run as the database owner (like the Supabase SQL editor), committed."""
    c = conn.cursor()
    c.execute(sql, params)
    out = c.fetchall() if c.description else None
    conn.commit()
    return out


def attempt(user, *statements):
    """Run statements as `user` (None = logged-out visitor); returns the last result, or an Exception. Always rolled back."""
    c = conn.cursor()
    try:
        c.execute("set local role " + ("authenticated" if user else "anon"))
        c.execute("select set_config('request.jwt.claim.sub', %s, true)", (str(user) if user else "",))
        result = None
        for s in statements:
            sql, params = (s, None) if isinstance(s, str) else s
            c.execute(sql, params)
            result = c.fetchall() if c.description else c.rowcount
        return result
    except Exception as e:  # noqa: BLE001
        return e
    finally:
        conn.rollback()


def signup(email, role=None, name=None, consent=False):
    uid = uuid.uuid4()
    meta = '{"full_name": "%s"%s%s}' % (
        name or email.split("@")[0],
        ', "role": "%s"' % role if role else "",
        ', "accepted_terms": true, "terms_version": "t1"' if consent else "",
    )
    admin("insert into auth.users (id, email, raw_user_meta_data) values (%s, %s, %s::jsonb)", (str(uid), email, meta))
    return uid


results = []


def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))


blocked = lambda r: isinstance(r, Exception)  # noqa: E731

# ---- fixtures -------------------------------------------------------------------------------
boss = signup("boss@t.co", "client")
admin("update public.users set role = 'admin' where id = %s", (str(boss),))  # first admin, made via the SQL editor
client1, client2 = signup("c1@t.co", "client"), signup("c2@t.co", "client")
worker1, worker2, worker3 = signup("w1@t.co", "worker", consent=True), signup("w2@t.co"), signup("w3@t.co")
gig = uuid.uuid4()
admin("""insert into public.gigs (id, client_id, title, description, category, location_area, date, start_time, end_time, pay_amount)
         values (%s, %s, 'Garden', 'Cut grass', 'Gardening', 'Athlone', '2026-12-01', '09:00', '12:00', 250)""", (str(gig), str(client1)))
if BASELINE:
    admin("update public.gigs set address_private = '12 Secret Street' where id = %s", (str(gig),))
else:
    admin("insert into public.gig_private_details (gig_id, address) values (%s, '12 Secret Street')", (str(gig),))
admin("insert into public.applications (gig_id, worker_id, message, status) values (%s, %s, 'pick me', 'accepted')", (str(gig), str(worker1)))
admin("insert into public.applications (gig_id, worker_id, message, status) values (%s, %s, 'me too', 'pending')", (str(gig), str(worker2)))

# ---- 1. role escalation ---------------------------------------------------------------------
sneaky = signup("sneaky@t.co", "admin")
role = admin("select role from public.users where id = %s", (str(sneaky),))[0][0]
check("Signup asking for role=admin does not create an admin", role != "admin", f"got role={role}")

r = attempt(worker1, ("update public.users set role = 'admin' where id = %s", (str(worker1),)),
            "select role from public.users where id = '%s'" % worker1)
check("A worker cannot make themselves an admin", blocked(r) or r[0][0] != "admin", "became admin" if not blocked(r) and r[0][0] == "admin" else "")

orphan = signup("orphan@t.co")
admin("delete from public.worker_profiles where user_id = %s", (str(orphan),))
admin("delete from public.users where id = %s", (str(orphan),))
r = attempt(orphan, ("insert into public.users (id, full_name, email, role) values (%s, 'x', 'orphan@t.co', 'admin')", (str(orphan),)),
            "select role from public.users where id = '%s'" % orphan)
check("Inserting your own user row cannot set role=admin", blocked(r) or r[0][0] != "admin")

# ---- 2. self-verification / rating ----------------------------------------------------------
r = attempt(worker1, ("update public.worker_profiles set verification_status = 'verified', rating = 5 where user_id = %s", (str(worker1),)),
            "select verification_status, rating from public.worker_profiles where user_id = '%s'" % worker1)
check("A worker cannot verify themselves or set their rating", blocked(r) or (r[0][0] != "verified" and float(r[0][1]) != 5.0))
r = attempt(client1, ("update public.client_profiles set verification_status = 'verified', rating = 5 where user_id = %s", (str(client1),)),
            "select verification_status, rating from public.client_profiles where user_id = '%s'" % client1)
check("A client cannot verify themselves or set their rating", blocked(r) or (r[0][0] != "verified" and float(r[0][1]) != 5.0))
r = attempt(worker1, ("update public.worker_profiles set bio = 'hello' where user_id = %s", (str(worker1),)))
check("A worker can still edit their own bio", not blocked(r) and r == 1, str(r))
r = attempt(boss, ("update public.worker_profiles set verification_status = 'verified' where user_id = %s", (str(worker3),)))
check("An admin can verify a worker", not blocked(r) and r == 1, str(r))
r = attempt(boss, ("update public.users set role = 'client' where id = %s", (str(worker3),)))
check("An admin can change a role", not blocked(r) and r == 1, str(r))

# ---- 2b. consent record ---------------------------------------------------------------------
if not BASELINE:
    row = admin("select accepted_terms_at is not null, terms_version from public.users where id = %s", (str(worker1),))[0]
    check("Signing up with consent records the time and document version", row[0] and row[1] == "t1", str(row))
    row = admin("select accepted_terms_at is null from public.users where id = %s", (str(worker2),))[0]
    check("Signing up without consent leaves the record empty", row[0])
    r = attempt(worker1, ("update public.users set accepted_terms_at = null, terms_version = 'x' where id = %s", (str(worker1),)))
    check("A user cannot edit their own consent record", blocked(r))
    forger = signup("forger@t.co")
    admin("delete from public.worker_profiles where user_id = %s", (str(forger),))
    admin("delete from public.users where id = %s", (str(forger),))
    r = attempt(forger, ("insert into public.users (id, full_name, email, accepted_terms_at, terms_version) values (%s, 'f', 'forger@t.co', now(), 'fake')", (str(forger),)),
                "select accepted_terms_at is null from public.users where id = '%s'" % forger)
    check("A user cannot insert a forged consent record", blocked(r) or r[0][0])

# ---- 3. private address ---------------------------------------------------------------------
r = attempt(None, "select address_private from public.gigs")
check("A logged-out visitor cannot read gig addresses", blocked(r) or not r, "address leaked: %s" % (r,))
r = attempt(worker2, "select address_private from public.gigs")
check("A random worker cannot read gig addresses from the gigs table", blocked(r) or not r)
if not BASELINE:
    def sees(user):
        r = attempt(user, ("select address from public.gig_private_details where gig_id = %s", (str(gig),)))
        return not blocked(r) and len(r) == 1

    check("Gig owner can read the address", sees(client1))
    check("Accepted worker can read the address", sees(worker1))
    check("Admin can read the address", sees(boss))
    check("Pending applicant cannot read the address", not sees(worker2))
    check("Unrelated worker cannot read the address", not sees(worker3))
    check("Another client cannot read the address", not sees(client2))
    check("Logged-out visitor cannot read the address table", not sees(None))
    r = attempt(client2, ("insert into public.gig_private_details (gig_id, address) values (%s, 'x') on conflict (gig_id) do update set address = 'hacked'", (str(gig),)))
    check("Another client cannot overwrite the address", blocked(r))
r = attempt(None, "select title, location_area, pay_amount from public.gigs where status = 'open'")
check("Browsing open gigs still works for visitors", not blocked(r) and len(r) == 1, str(r))

# ---- 4. reviews -----------------------------------------------------------------------------
def review(user, reviewed):
    return attempt(user, ("insert into public.reviews (gig_id, reviewer_id, reviewed_user_id, rating) values (%s, %s, %s, 5)", (str(gig), str(user), str(reviewed))))

check("A stranger cannot review a client they never worked with", blocked(review(worker3, client1)))
check("A pending applicant cannot review the client", blocked(review(worker2, client1)))
check("A client who does not own the gig cannot review its worker", blocked(review(client2, worker1)))
check("Nobody can review themselves", blocked(review(worker1, worker1)))
r = review(client1, worker1)
check("The gig owner can review their accepted worker", not blocked(r) and r == 1, str(r))
r = review(worker1, client1)
check("The accepted worker can review the gig owner", not blocked(r) and r == 1, str(r))
admin("insert into public.reviews (gig_id, reviewer_id, reviewed_user_id, rating) values (%s, %s, %s, 4)", (str(gig), str(client1), str(worker1)))
check("The same review cannot be posted twice", blocked(review(client1, worker1)) if not BASELINE else True)

# ---- 5. applications ------------------------------------------------------------------------
app_id = admin("select id from public.applications where worker_id = %s", (str(worker2),))[0][0]
r = attempt(client1, ("update public.applications set worker_id = %s where id = %s", (str(worker3), str(app_id))),
            "select worker_id from public.applications where id = '%s'" % app_id)
check("A client cannot reassign an application to a different worker", blocked(r) or str(r[0][0]) == str(worker2))
r = attempt(client1, ("update public.applications set status = 'rejected' where id = %s", (str(app_id),)))
check("A client can still accept or reject applications", not blocked(r) and r == 1, str(r))
r = attempt(client2, ("update public.applications set status = 'accepted' where id = %s", (str(app_id),)))
check("A different client cannot decide on someone else's applicants", blocked(r) or r == 0)

# ---- 6. normal flows still work ---------------------------------------------------------------
r = attempt(client2, ("""insert into public.gigs (client_id, title, description, category, location_area, date, start_time, end_time, pay_amount)
                         values (%s, 'Wash', 'Car wash', 'Cleaning', 'Bellville', '2026-12-02', '09:00', '11:00', 150)""", (str(client2),)))
check("A client can post a gig", not blocked(r) and r == 1, str(r))
r = attempt(worker3, ("""insert into public.gigs (client_id, title, description, category, location_area, date, start_time, end_time, pay_amount)
                         values (%s, 'Nope', 'x', 'x', 'x', '2026-12-02', '09:00', '11:00', 150)""", (str(worker3),)))
check("A worker cannot post a gig", blocked(r))
r = attempt(worker3, ("insert into public.applications (gig_id, worker_id, message) values (%s, %s, 'hi')", (str(gig), str(worker3))))
check("A worker can apply to an open gig", not blocked(r) and r == 1, str(r))

# ---- 7. messaging -----------------------------------------------------------------------------
if not BASELINE:
    accepted_app = admin("select id from public.applications where worker_id = %s", (str(worker1),))[0][0]  # accepted
    pending_app = admin("select id from public.applications where worker_id = %s", (str(worker2),))[0][0]   # pending

    def send(user, app, body="hello", as_user=None):
        return attempt(user, ("insert into public.messages (application_id, sender_id, body) values (%s, %s, %s)",
                              (str(app), str(as_user or user), body)))

    def read(user, app):
        return attempt(user, ("select body from public.messages where application_id = %s", (str(app),)))

    check("Accepted worker can message the client", not blocked(send(worker1, accepted_app)) and send(worker1, accepted_app) == 1)
    check("Gig owner can message the accepted worker", not blocked(send(client1, accepted_app)) and send(client1, accepted_app) == 1)
    check("Pending applicant cannot message before acceptance", blocked(send(worker2, pending_app)))
    check("Client cannot message a pending applicant", blocked(send(client1, pending_app)))
    check("Unrelated worker cannot message on someone else's application", blocked(send(worker3, accepted_app)))
    check("Another client cannot message on someone else's application", blocked(send(client2, accepted_app)))
    check("Nobody can forge the sender", blocked(send(worker1, accepted_app, as_user=client1)))
    check("Logged-out visitor cannot message", blocked(send(None, accepted_app, as_user=worker1)))
    check("Empty messages are rejected", blocked(send(worker1, accepted_app, body="   ")))
    check("Oversized messages are rejected", blocked(send(worker1, accepted_app, body="x" * 2001)))

    msg = uuid.uuid4()
    admin("insert into public.messages (id, application_id, sender_id, body) values (%s, %s, %s, 'secret plan')",
          (str(msg), str(accepted_app), str(worker1)))
    check("Both participants can read the thread", read(worker1, accepted_app) == [("secret plan",)] and read(client1, accepted_app) == [("secret plan",)])
    check("Admin can read the thread (moderation)", read(boss, accepted_app) == [("secret plan",)])
    check("Admin cannot write into a thread", blocked(send(boss, accepted_app)))
    check("Unrelated users cannot read the thread", (blocked(read(worker3, accepted_app)) or read(worker3, accepted_app) == [])
          and (blocked(read(client2, accepted_app)) or read(client2, accepted_app) == []))
    check("Logged-out visitors cannot read messages", blocked(read(None, accepted_app)) or read(None, accepted_app) == [])

    r = attempt(worker1, ("update public.messages set body = 'edited' where id = %s", (str(msg),)),
                "select body from public.messages where id = '%s'" % msg)
    check("The sender cannot edit a sent message", blocked(r) or r[0][0] == "secret plan")
    r = attempt(client1, ("update public.messages set body = 'edited' where id = %s", (str(msg),)),
                "select body from public.messages where id = '%s'" % msg)
    check("The recipient cannot edit a message either", blocked(r) or r[0][0] == "secret plan")
    r = attempt(client1, ("update public.messages set read_at = now() where id = %s", (str(msg),)))
    check("The recipient can mark a message read", not blocked(r) and r == 1, str(r))
    r = attempt(worker1, ("update public.messages set read_at = now() where id = %s", (str(msg),)))
    check("The sender cannot mark their own message read", blocked(r) or r == 0)
    r = attempt(worker1, ("delete from public.messages where id = %s", (str(msg),)))
    check("Messages cannot be deleted by users", blocked(r) or r == 0)

# ---- 8. notifications -------------------------------------------------------------------------
if not BASELINE:
    def notes(user, where="", params=()):
        return attempt(user, ("select type::text, user_id::text from public.notifications " + where, params))

    # The accepted worker's message earlier created a new_message notification for the client, and
    # worker3's application in section 6 was rolled back, so create a fresh one here for a clean check.
    fresh_gig = uuid.uuid4()
    admin("""insert into public.gigs (id, client_id, title, description, category, location_area, date, start_time, end_time, pay_amount)
             values (%s, %s, 'Paint', 'Paint a wall', 'Home', 'Langa', '2026-12-05', '09:00', '12:00', 300)""", (str(fresh_gig), str(client2)))
    admin("insert into public.applications (gig_id, worker_id, message) values (%s, %s, 'me please')", (str(fresh_gig), str(worker3)))
    fresh_app = admin("select id from public.applications where gig_id = %s", (str(fresh_gig),))[0][0]

    r = notes(client2, "where application_id = %s", (str(fresh_app),))
    check("Applying notifies the gig owner", not blocked(r) and r == [("new_application", str(client2))], str(r))
    check("The applicant cannot see the owner's notification", notes(worker3, "where application_id = %s", (str(fresh_app),)) == [])

    admin("update public.applications set status = 'accepted' where id = %s", (str(fresh_app),))
    r = notes(worker3, "where application_id = %s", (str(fresh_app),))
    check("Acceptance notifies the worker", not blocked(r) and r == [("application_accepted", str(worker3))], str(r))

    admin("insert into public.messages (application_id, sender_id, body) values (%s, %s, 'see you at 9')", (str(fresh_app), str(worker3)))
    r = notes(client2, "where application_id = %s and type = 'new_message'", (str(fresh_app),))
    check("A message notifies the recipient, not the sender", not blocked(r) and r == [("new_message", str(client2))]
          and notes(worker3, "where application_id = %s and type = 'new_message'", (str(fresh_app),)) == [], str(r))

    check("Users cannot read other people's notifications", notes(worker1, "where user_id = %s", (str(client2),)) == [])
    r = attempt(worker1, ("insert into public.notifications (user_id, type, title, body, link) values (%s, 'new_message', 'x', 'y', '/')", (str(client2),)))
    check("Users cannot forge notifications", blocked(r))
    note_id = admin("select id from public.notifications where user_id = %s and type = 'new_message' limit 1", (str(client2),))[0][0]
    r = attempt(client2, ("update public.notifications set read_at = now() where id = %s", (str(note_id),)))
    check("Owner can mark a notification read", not blocked(r) and r == 1, str(r))
    r = attempt(client2, ("update public.notifications set title = 'hacked' where id = %s", (str(note_id),)))
    check("Owner cannot edit notification content", blocked(r))
    r = attempt(client2, ("update public.notifications set emailed_at = now() where id = %s", (str(note_id),)))
    check("Owner cannot fake the email-sent marker", blocked(r))
    r = attempt(worker3, ("update public.notifications set read_at = now() where id = %s", (str(note_id),)))
    check("Someone else cannot mark it read", blocked(r) or r == 0)
    r = attempt(client2, ("delete from public.notifications where id = %s", (str(note_id),)))
    check("Notifications cannot be deleted by users", blocked(r) or r == 0)
    r = attempt(client2, ("update public.users set email_notifications = false where id = %s", (str(client2),)),
                "select email_notifications from public.users where id = '%s'" % client2)
    check("A user can switch off email notifications", not blocked(r) and r[0][0] is False, str(r))

# ---- notification abuse limits ----------------------------------------------------------------
if not BASELINE:
    flip_app = admin("select id from public.applications where worker_id = %s and gig_id = %s", (str(worker2), str(gig)))[0][0]
    flips_before = admin("select count(*) from public.notifications where user_id = %s", (str(worker2),))[0][0]
    r = attempt(client1, *[("update public.applications set status = %s where id = %s", (st, str(flip_app))) for st in ["accepted", "rejected"] * 5])
    check("A client can still change their decision", not blocked(r) and r == 1, str(r))
    for st in ["accepted", "rejected"] * 5:
        admin("update public.applications set status = %s where id = %s", (st, str(flip_app)))
    flips_after = admin("select count(*) from public.notifications where user_id = %s", (str(worker2),))[0][0]
    check("Flipping a decision ten times sends the worker at most two notifications", flips_after - flips_before <= 2, f"{flips_after - flips_before} created")

    long_name = "URGENT: claim your R5000 prize at http://evil.example " * 5
    spammer = signup("spammer@t.co")
    admin("update public.users set full_name = %s where id = %s", (long_name, str(spammer)))
    new_app = admin("insert into public.applications (gig_id, worker_id, message) values (%s, %s, 'hi') returning id", (str(gig), str(spammer)))[0][0]
    note = admin("select title, body from public.notifications where application_id = %s and type = 'new_application'", (str(new_app),))[0]
    check("A very long name is truncated in the notification title", len(note[0]) <= 80, f"{len(note[0])} characters")
    check("A very long name is truncated in the notification body", len(note[1]) <= 160, f"{len(note[1])} characters")

# ---- reviews & ratings --------------------------------------------------------------------------
if not BASELINE:
    done_gig = uuid.uuid4()
    admin("insert into public.gigs (id, client_id, title, description, category, location_area, date, start_time, end_time, pay_amount) "
          "values (%s, %s, 'Done gig', 'd', 'Events', 'CT', '2026-06-01', '09:00', '12:00', 200)", (str(done_gig), str(client1)))
    admin("insert into public.applications (gig_id, worker_id, message, status) values (%s, %s, 'hi', 'completed')", (str(done_gig), str(worker1)))
    r = attempt(client1, ("insert into public.reviews (gig_id, reviewer_id, reviewed_user_id, rating, comment) values (%s, %s, %s, 5, 'Great') returning id", (str(done_gig), str(client1), str(worker1))))
    check("A client can review the worker on a completed gig", not blocked(r), str(r))
    notes_before = admin("select count(*) from public.notifications where user_id = %s and type = 'new_review'", (str(worker1),))[0][0]
    admin("insert into public.reviews (gig_id, reviewer_id, reviewed_user_id, rating, comment) values (%s, %s, %s, 4, 'Good') on conflict do nothing", (str(done_gig), str(client1), str(worker1)))
    expected = admin("select round(avg(rating)::numeric, 2) from public.reviews where reviewed_user_id = %s", (str(worker1),))[0][0]
    r = admin("select rating from public.worker_profiles where user_id = %s", (str(worker1),))[0][0]
    check("The reviewed user's stored rating is recomputed from their reviews", float(r) == float(expected) and float(r) > 0, f"{r} vs {expected}")
    r = admin("select count(*) from public.notifications where user_id = %s and type = 'new_review'", (str(worker1),))[0][0]
    check("The reviewed user is notified", r - notes_before == 1, str(r - notes_before))
    r = attempt(worker1, ("update public.worker_profiles set rating = 5 where user_id = %s", (str(worker1),)))
    check("A worker still cannot set their own rating directly", blocked(r), str(r))
    r = attempt(client1, ("insert into public.reviews (gig_id, reviewer_id, reviewed_user_id, rating, comment) values (%s, %s, %s, 1, %s)", (str(done_gig), str(client1), str(worker3), "x" * 601)))
    check("Over-long review comments are rejected", blocked(r), str(r))

# ---- gig edits ---------------------------------------------------------------------------------
if not BASELINE:
    before = admin("select count(*) from public.notifications where type = 'gig_updated'")[0][0]
    r = attempt(client1, ("update public.gigs set start_time = '10:30', end_time = '13:30' where id = %s", (str(gig),)))
    check("A client can edit their own gig", not blocked(r) and r == 1, str(r))
    admin("update public.gigs set start_time = '10:30', end_time = '13:30' where id = %s", (str(gig),))
    after = admin("select count(*) from public.notifications where type = 'gig_updated'")[0][0]
    pending_or_accepted = admin("select count(*) from public.applications where gig_id = %s and status in ('pending', 'accepted')", (str(gig),))[0][0]
    check("Pending and accepted applicants are told when the time changes", after - before == pending_or_accepted and pending_or_accepted > 0, f"{after - before} of {pending_or_accepted}")
    before = after
    admin("update public.gigs set description = 'same plan, clearer words' where id = %s", (str(gig),))
    after = admin("select count(*) from public.notifications where type = 'gig_updated'")[0][0]
    check("Wording-only edits do not notify anyone", after == before, str(after - before))
    r = attempt(client2, ("update public.gigs set title = 'hijacked' where id = %s", (str(gig),)))
    check("Another client cannot edit the gig", blocked(r) or r == 0, str(r))
    r = attempt(client1, ("update public.gigs set client_id = %s where id = %s", (str(client2), str(gig))))
    check("A client cannot hand a gig to someone else", blocked(r), str(r))
    admin("update public.gigs set status = 'completed' where id = %s", (str(done_gig),))
    r = attempt(client1, ("update public.gigs set title = 'too late' where id = %s", (str(done_gig),)))
    check("A completed gig cannot be edited", blocked(r), str(r))

# ---- report -----------------------------------------------------------------------------------
width = max(len(n) for n, _, _ in results)
print("\nMODE:", "BASELINE (without security fixes)" if BASELINE else "WITH security fixes")
for name, ok, detail in results:
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"   [{detail}]" if detail and not ok else ""))
failed = [n for n, ok, _ in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed and not BASELINE else 0)
