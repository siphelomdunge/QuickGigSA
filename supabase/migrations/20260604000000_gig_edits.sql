-- Editing a gig after posting.
--
-- Clients could already update their own gigs (policy "Clients can update their gigs") but the app had no
-- way to do it. Now that it does:
--   1. completed or cancelled gigs are frozen (only admins may still change them);
--   2. the owner and the posting date cannot be rewritten;
--   3. when the date, time, area, pay or title changes, every pending/accepted applicant is told
--      ('gig_updated' notification), and accepted workers are told when the private address changes.

alter type public.notification_type add value if not exists 'gig_updated';

create or replace function public.guard_gig_edits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.current_user_role() = 'admin' then
    return new;
  end if;
  if new.client_id is distinct from old.client_id or new.created_at is distinct from old.created_at then
    raise exception 'A gig cannot be moved to another client';
  end if;
  if old.status in ('completed', 'cancelled') and (
       new.title is distinct from old.title or new.description is distinct from old.description
    or new.category is distinct from old.category or new.location_area is distinct from old.location_area
    or new.date is distinct from old.date or new.start_time is distinct from old.start_time
    or new.end_time is distinct from old.end_time or new.pay_amount is distinct from old.pay_amount
    or new.workers_needed is distinct from old.workers_needed or new.requirements is distinct from old.requirements
    or new.status is distinct from old.status) then
    raise exception 'Completed or cancelled gigs cannot be edited';
  end if;
  return new;
end;
$$;

drop trigger if exists gigs_guard_edits on public.gigs;
create trigger gigs_guard_edits
before update on public.gigs
for each row execute function public.guard_gig_edits();

create or replace function public.notify_on_gig_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  changes text[] := '{}';
  summary text;
  applicant record;
begin
  if new.date is distinct from old.date then changes := changes || ('date is now ' || to_char(new.date, 'YYYY-MM-DD')); end if;
  if new.start_time is distinct from old.start_time or new.end_time is distinct from old.end_time then
    changes := changes || ('time is now ' || to_char(new.start_time, 'HH24:MI') || '–' || to_char(new.end_time, 'HH24:MI'));
  end if;
  if new.location_area is distinct from old.location_area then changes := changes || ('area is now ' || left(new.location_area, 60)); end if;
  if new.pay_amount is distinct from old.pay_amount then changes := changes || ('pay is now R' || new.pay_amount); end if;
  if new.title is distinct from old.title then changes := changes || ('title is now "' || left(new.title, 80) || '"'); end if;

  if cardinality(changes) = 0 then
    return new;
  end if;
  summary := 'The ' || array_to_string(changes, '; the ') || '.';

  for applicant in
    select id, worker_id from public.applications where gig_id = new.id and status in ('pending', 'accepted')
  loop
    insert into public.notifications (user_id, type, title, body, link, application_id)
    values (applicant.worker_id, 'gig_updated', 'Gig updated: ' || left(new.title, 80), left(summary, 300), '/gigs/' || new.id, applicant.id);
  end loop;
  return new;
end;
$$;

drop trigger if exists gigs_notify_update on public.gigs;
create trigger gigs_notify_update
after update on public.gigs
for each row execute function public.notify_on_gig_update();

create or replace function public.notify_on_address_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  gig_record public.gigs%rowtype;
  applicant record;
begin
  if new.address is not distinct from old.address then
    return new;
  end if;
  select * into gig_record from public.gigs where id = new.gig_id;
  for applicant in
    select id, worker_id from public.applications where gig_id = new.gig_id and status = 'accepted'
  loop
    insert into public.notifications (user_id, type, title, body, link, application_id)
    values (applicant.worker_id, 'gig_updated', 'Address changed: ' || left(gig_record.title, 80), 'The client updated the private address. Open the gig to see the new one.', '/gigs/' || new.gig_id, applicant.id);
  end loop;
  return new;
end;
$$;

drop trigger if exists gig_private_details_notify_update on public.gig_private_details;
create trigger gig_private_details_notify_update
after update on public.gig_private_details
for each row execute function public.notify_on_address_update();
