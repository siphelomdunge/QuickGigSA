-- Security fixes found in the pre-launch review.
-- 1. Signups could ask for role = 'admin'.
-- 2. Users could change their own role, verification_status and rating.
-- 3. address_private was readable by anyone (RLS is row-level, not column-level).
-- 4. Anyone could review anyone for any gig.
-- 5. Clients could rewrite who an application belongs to.
--
-- To make the first admin, run this in the Supabase SQL editor (no user JWT, so it is allowed):
--   update public.users set role = 'admin' where email = 'you@example.com';

-- ---------------------------------------------------------------------------
-- 1. Signup trigger: only 'worker' or 'client' can be requested
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.user_role;
begin
  requested_role := case
    when new.raw_user_meta_data->>'role' = 'client' then 'client'::public.user_role
    else 'worker'::public.user_role
  end;

  insert into public.users (id, full_name, email, phone, role, location, profile_photo_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    requested_role,
    new.raw_user_meta_data->>'location',
    new.raw_user_meta_data->>'profile_photo_url'
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        email = excluded.email,
        phone = excluded.phone,
        location = excluded.location,
        profile_photo_url = excluded.profile_photo_url;

  if requested_role = 'worker' then
    insert into public.worker_profiles (user_id, verification_status)
    values (new.id, 'pending')
    on conflict (user_id) do nothing;
  elsif requested_role = 'client' then
    insert into public.client_profiles (user_id, business_name, verification_status)
    values (new.id, coalesce(new.raw_user_meta_data->>'business_name', new.raw_user_meta_data->>'full_name'), 'pending')
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Sensitive columns can only be changed by admins or trusted server-side code
--    (auth.uid() is null for the SQL editor, the service-role key and signup triggers)
-- ---------------------------------------------------------------------------
create or replace function public.protect_sensitive_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.current_user_role() = 'admin' then
    return new;
  end if;

  if tg_table_name = 'users' then
    if tg_op = 'INSERT' then
      new.role := case when new.role = 'client' then 'client'::public.user_role else 'worker'::public.user_role end;
    elsif new.role is distinct from old.role then
      raise exception 'Only admins can change a role';
    end if;
  elsif tg_table_name in ('worker_profiles', 'client_profiles') then
    if tg_op = 'INSERT' then
      new.verification_status := 'unverified';
      new.rating := 0;
    elsif new.verification_status is distinct from old.verification_status
       or new.rating is distinct from old.rating then
      raise exception 'Only admins can change verification or rating';
    end if;
  end if;

  return new;
end;
$$;

create trigger protect_users_sensitive
before insert or update on public.users
for each row execute function public.protect_sensitive_columns();

create trigger protect_worker_profiles_sensitive
before insert or update on public.worker_profiles
for each row execute function public.protect_sensitive_columns();

create trigger protect_client_profiles_sensitive
before insert or update on public.client_profiles
for each row execute function public.protect_sensitive_columns();

-- ---------------------------------------------------------------------------
-- 3. Applications: only the status may change (not the gig, the worker or the message)
-- ---------------------------------------------------------------------------
create or replace function public.protect_application_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.current_user_role() = 'admin' then
    return new;
  end if;
  if new.gig_id is distinct from old.gig_id
     or new.worker_id is distinct from old.worker_id
     or new.message is distinct from old.message then
    raise exception 'Only the application status can be changed';
  end if;
  return new;
end;
$$;

create trigger protect_application_columns
before update on public.applications
for each row execute function public.protect_application_columns();

-- ---------------------------------------------------------------------------
-- 4. Private address moves to its own table with its own access rules
-- ---------------------------------------------------------------------------
create table public.gig_private_details (
  gig_id uuid primary key references public.gigs(id) on delete cascade,
  address text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_gig_private_details_updated_at
before update on public.gig_private_details
for each row execute function public.set_updated_at();

insert into public.gig_private_details (gig_id, address)
select id, coalesce(address_private, '') from public.gigs
on conflict (gig_id) do nothing;

alter table public.gigs drop column address_private;

alter table public.gig_private_details enable row level security;

-- Readable only by the gig owner, an admin, or a worker whose application was accepted.
create policy "Owner, admin or accepted worker can read the address"
on public.gig_private_details for select
using (
  public.current_user_role() = 'admin'
  or exists (
    select 1 from public.gigs g
    where g.id = gig_private_details.gig_id and g.client_id = auth.uid()
  )
  or exists (
    select 1 from public.applications a
    where a.gig_id = gig_private_details.gig_id
      and a.worker_id = auth.uid()
      and a.status in ('accepted', 'completed')
  )
);

create policy "Gig owner can add the address"
on public.gig_private_details for insert
with check (
  public.current_user_role() = 'admin'
  or exists (
    select 1 from public.gigs g
    where g.id = gig_private_details.gig_id and g.client_id = auth.uid()
  )
);

create policy "Gig owner can change the address"
on public.gig_private_details for update
using (
  public.current_user_role() = 'admin'
  or exists (
    select 1 from public.gigs g
    where g.id = gig_private_details.gig_id and g.client_id = auth.uid()
  )
)
with check (
  public.current_user_role() = 'admin'
  or exists (
    select 1 from public.gigs g
    where g.id = gig_private_details.gig_id and g.client_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- 5. Reviews: only the two people on an accepted application, once each
-- ---------------------------------------------------------------------------
drop policy if exists "Authenticated users can create reviews" on public.reviews;

create policy "Participants can review each other once accepted"
on public.reviews for insert
with check (
  reviewer_id = auth.uid()
  and reviewer_id <> reviewed_user_id
  and (
    exists (
      select 1 from public.gigs g
      join public.applications a on a.gig_id = g.id
      where g.id = reviews.gig_id
        and g.client_id = auth.uid()
        and a.worker_id = reviews.reviewed_user_id
        and a.status in ('accepted', 'completed')
    )
    or exists (
      select 1 from public.gigs g
      join public.applications a on a.gig_id = g.id
      where g.id = reviews.gig_id
        and g.client_id = reviews.reviewed_user_id
        and a.worker_id = auth.uid()
        and a.status in ('accepted', 'completed')
    )
  )
);

create unique index if not exists reviews_one_per_pair
on public.reviews (gig_id, reviewer_id, reviewed_user_id);
