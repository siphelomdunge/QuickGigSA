-- Notification abuse limits (found in review).
--
-- 1. A client could flip an application between accepted and rejected as often as they liked, and each
--    flip created a notification (and so an email) for the worker. Each decision type is now notified at
--    most once per application.
-- 2. Names and gig titles flowed into notification text (and from there into emails) with no length limit,
--    so a long, scammy name could be delivered from the platform's own address. They are now truncated.

-- Remove any duplicate decision notifications that already exist so the unique index can be created.
delete from public.notifications
where id in (
  select id from (
    select id, row_number() over (partition by application_id, type order by created_at, id) as rn
    from public.notifications
    where type in ('application_accepted', 'application_rejected')
  ) ranked
  where rn > 1
);

create unique index if not exists notifications_one_decision_per_application
on public.notifications (application_id, type)
where type in ('application_accepted', 'application_rejected');

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
  select left(full_name, 60) into worker_name from public.users where id = new.worker_id;

  insert into public.notifications (user_id, type, title, body, link, application_id)
  values (
    gig_record.client_id,
    'new_application',
    'New applicant: ' || coalesce(worker_name, 'A worker'),
    coalesce(worker_name, 'A worker') || ' applied to "' || left(gig_record.title, 80) || '".',
    '/client/gigs/' || gig_record.id || '/applications',
    new.id
  );
  return new;
end;
$$;

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
      'You got the gig: ' || left(gig_record.title, 80),
      coalesce(left(gig_record.client_name_cache, 60), 'The client') || ' accepted your application. Say hello and confirm the details.',
      '/messages/' || new.id,
      new.id
    )
    on conflict (application_id, type) where type in ('application_accepted', 'application_rejected') do nothing;
  elsif new.status = 'rejected' then
    insert into public.notifications (user_id, type, title, body, link, application_id)
    values (
      new.worker_id,
      'application_rejected',
      'Update on ' || left(gig_record.title, 80),
      'The client went with someone else this time. More gigs are posted every week.',
      '/browse',
      new.id
    )
    on conflict (application_id, type) where type in ('application_accepted', 'application_rejected') do nothing;
  end if;
  return new;
end;
$$;

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
  select left(coalesce(cp.business_name, u.full_name), 60) into sender_name
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
