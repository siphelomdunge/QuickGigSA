-- In-app notifications, created by database triggers so they cannot be forged or skipped by a client.
--
--   * new_application   → the gig owner, when a worker applies
--   * application_accepted / application_rejected → the worker, when the client decides
--   * new_message       → the recipient of a message
--
-- Users can read their own notifications and mark them read. Nobody can insert, edit or delete them
-- from a client (triggers run as security definer). Email delivery is handled outside Postgres by the
-- `notify-email` Edge Function, which a Database Webhook calls on every insert into this table
-- (see supabase/functions/notify-email). It records emailed_at here so sends are idempotent.

create type public.notification_type as enum ('new_application', 'application_accepted', 'application_rejected', 'new_message');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text not null,
  link text not null,
  -- Which record caused it, so the UI can group and the mailer can throttle per thread.
  application_id uuid references public.applications(id) on delete cascade,
  read_at timestamptz,
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index notifications_user_unread_idx on public.notifications (user_id) where read_at is null;

alter table public.notifications enable row level security;

create policy "Users can read their own notifications"
on public.notifications for select
to authenticated
using (user_id = auth.uid());

-- Only read_at may change, and only by the owner (trigger below enforces the column restriction).
create policy "Users can mark their own notifications read"
on public.notifications for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- No insert / delete policies for clients. Triggers and the service role write.

create or replace function public.protect_notification_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new; -- service role / SQL editor / Edge Function setting emailed_at
  end if;
  if new.user_id is distinct from old.user_id
     or new.type is distinct from old.type
     or new.title is distinct from old.title
     or new.body is distinct from old.body
     or new.link is distinct from old.link
     or new.application_id is distinct from old.application_id
     or new.emailed_at is distinct from old.emailed_at
     or new.created_at is distinct from old.created_at then
    raise exception 'Notifications cannot be edited';
  end if;
  return new;
end;
$$;

create trigger protect_notifications_columns
before update on public.notifications
for each row execute function public.protect_notification_columns();

-- ---------------------------------------------------------------------------
-- Email preference (users can switch emails off; in-app notifications always work)
-- ---------------------------------------------------------------------------
alter table public.users add column if not exists email_notifications boolean not null default true;

-- ---------------------------------------------------------------------------
-- Triggers that create notifications
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_application_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  gig_record public.gigs%rowtype;
  worker_name text;
begin
  select * into gig_record from public.gigs where id = new.gig_id;
  select full_name into worker_name from public.users where id = new.worker_id;

  insert into public.notifications (user_id, type, title, body, link, application_id)
  values (
    gig_record.client_id,
    'new_application',
    'New applicant: ' || coalesce(worker_name, 'A worker'),
    coalesce(worker_name, 'A worker') || ' applied to "' || gig_record.title || '".',
    '/client/gigs/' || gig_record.id || '/applications',
    new.id
  );
  return new;
end;
$$;

create trigger notify_application_insert
after insert on public.applications
for each row execute function public.notify_on_application_insert();

-- gigs has no client name column; cache one so triggers can name the client without extra joins.
alter table public.gigs add column if not exists client_name_cache text;
create or replace function public.cache_gig_client_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select coalesce(cp.business_name, u.full_name) into new.client_name_cache
  from public.users u
  left join public.client_profiles cp on cp.user_id = u.id
  where u.id = new.client_id;
  return new;
end;
$$;
create trigger gigs_cache_client_name
before insert or update of client_id on public.gigs
for each row execute function public.cache_gig_client_name();
update public.gigs g set client_name_cache = coalesce(cp.business_name, u.full_name)
from public.users u left join public.client_profiles cp on cp.user_id = u.id
where u.id = g.client_id;

create or replace function public.notify_on_application_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  gig_record public.gigs%rowtype;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;
  select * into gig_record from public.gigs where id = new.gig_id;

  if new.status = 'accepted' then
    insert into public.notifications (user_id, type, title, body, link, application_id)
    values (
      new.worker_id,
      'application_accepted',
      'You got the gig: ' || gig_record.title,
      coalesce(gig_record.client_name_cache, 'The client') || ' accepted your application. Say hello and confirm the details.',
      '/messages/' || new.id,
      new.id
    );
  elsif new.status = 'rejected' then
    insert into public.notifications (user_id, type, title, body, link, application_id)
    values (
      new.worker_id,
      'application_rejected',
      'Update on ' || gig_record.title,
      'The client went with someone else this time. More gigs are posted every week.',
      '/browse',
      new.id
    );
  end if;
  return new;
end;
$$;

create trigger notify_application_status
after update of status on public.applications
for each row execute function public.notify_on_application_status();

create or replace function public.notify_on_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  app_record public.applications%rowtype;
  gig_record public.gigs%rowtype;
  recipient uuid;
  sender_name text;
begin
  select * into app_record from public.applications where id = new.application_id;
  select * into gig_record from public.gigs where id = app_record.gig_id;
  recipient := case when new.sender_id = app_record.worker_id then gig_record.client_id else app_record.worker_id end;
  select coalesce(cp.business_name, u.full_name) into sender_name
  from public.users u left join public.client_profiles cp on cp.user_id = u.id and new.sender_id = gig_record.client_id
  where u.id = new.sender_id;

  insert into public.notifications (user_id, type, title, body, link, application_id)
  values (
    recipient,
    'new_message',
    'Message from ' || coalesce(sender_name, 'QuickGig user'),
    left(new.body, 140) || case when char_length(new.body) > 140 then '…' else '' end,
    '/messages/' || new.application_id,
    new.application_id
  );
  return new;
end;
$$;

create trigger notify_message_insert
after insert on public.messages
for each row execute function public.notify_on_message_insert();

-- Realtime (optional) so the bell updates live.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;
