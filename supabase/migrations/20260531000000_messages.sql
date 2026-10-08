-- Messaging between a client and a worker, scoped to one application.
--
-- Rules (enforced here, not just in the UI):
--   * A thread exists per application. Only the gig owner and the applicant are participants.
--   * Participants may read and send messages only once the application is accepted (or completed).
--     This keeps the "no contact before acceptance" rule and prevents spam / off-platform pre-screening.
--   * Admins can read every thread for moderation, but cannot write into them.
--   * Messages are immutable. The only column anyone may change is read_at, and only the recipient may set it.

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index messages_application_created_idx on public.messages (application_id, created_at);
create index messages_unread_idx on public.messages (application_id) where read_at is null;

alter table public.messages enable row level security;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- True when the current user is a party to the application AND the thread is open for messaging.
create or replace function public.can_message_application(target_application uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.applications a
    join public.gigs g on g.id = a.gig_id
    where a.id = target_application
      and a.status in ('accepted', 'completed')
      and (a.worker_id = auth.uid() or g.client_id = auth.uid())
  )
$$;

-- True when the current user is a party to the application, regardless of status (used for reads of history).
create or replace function public.is_application_party(target_application uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.applications a
    join public.gigs g on g.id = a.gig_id
    where a.id = target_application
      and (a.worker_id = auth.uid() or g.client_id = auth.uid())
  )
$$;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------

create policy "Participants and admins can read messages"
on public.messages for select
to authenticated
using (public.is_application_party(application_id) or public.current_user_role() = 'admin');

create policy "Participants can send messages after acceptance"
on public.messages for insert
to authenticated
with check (sender_id = auth.uid() and public.can_message_application(application_id));

-- Only the recipient may update, and the trigger below limits the update to read_at.
create policy "Recipients can mark messages read"
on public.messages for update
to authenticated
using (sender_id <> auth.uid() and public.is_application_party(application_id))
with check (sender_id <> auth.uid() and public.is_application_party(application_id));

-- No delete policy: messages are kept for dispute resolution. Admins use the SQL editor if needed.

-- ---------------------------------------------------------------------------
-- Immutability: the only column that may change is read_at (and only from null to a time).
-- ---------------------------------------------------------------------------
create or replace function public.protect_message_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if new.application_id is distinct from old.application_id
     or new.sender_id is distinct from old.sender_id
     or new.body is distinct from old.body
     or new.created_at is distinct from old.created_at then
    raise exception 'Messages cannot be edited';
  end if;
  if old.read_at is not null and new.read_at is distinct from old.read_at then
    raise exception 'A read receipt cannot be changed once set';
  end if;
  return new;
end;
$$;

create trigger protect_messages_columns
before update on public.messages
for each row execute function public.protect_message_columns();

-- Realtime (optional): lets clients subscribe to new messages. Harmless if realtime is not enabled.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;
