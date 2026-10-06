create extension if not exists pgcrypto;

create type public.user_role as enum ('worker', 'client', 'admin');
create type public.verification_status as enum ('unverified', 'pending', 'verified');
create type public.gig_status as enum ('open', 'closed', 'completed', 'cancelled');
create type public.application_status as enum ('pending', 'accepted', 'rejected', 'completed');
create type public.report_status as enum ('open', 'investigating', 'resolved');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  role public.user_role not null default 'worker',
  location text,
  profile_photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.worker_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  bio text,
  skills text[] not null default '{}',
  experience text,
  transport_available boolean not null default false,
  preferred_categories text[] not null default '{}',
  rating numeric(3,2) not null default 0,
  verification_status public.verification_status not null default 'unverified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.client_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  business_name text,
  business_type text,
  description text,
  rating numeric(3,2) not null default 0,
  verification_status public.verification_status not null default 'unverified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gigs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  location_area text not null,
  address_private text,
  date date not null,
  start_time time not null,
  end_time time not null,
  pay_amount numeric(10,2) not null check (pay_amount > 0),
  workers_needed integer not null default 1 check (workers_needed > 0),
  requirements text,
  status public.gig_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs(id) on delete cascade,
  worker_id uuid not null references public.users(id) on delete cascade,
  message text not null,
  status public.application_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gig_id, worker_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs(id) on delete cascade,
  reviewer_id uuid not null references public.users(id) on delete cascade,
  reviewed_user_id uuid not null references public.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reported_by uuid not null references public.users(id) on delete cascade,
  reported_user_id uuid references public.users(id) on delete set null,
  gig_id uuid references public.gigs(id) on delete set null,
  reason text not null,
  description text,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at before update on public.users
for each row execute function public.set_updated_at();

create trigger worker_profiles_set_updated_at before update on public.worker_profiles
for each row execute function public.set_updated_at();

create trigger client_profiles_set_updated_at before update on public.client_profiles
for each row execute function public.set_updated_at();

create trigger gigs_set_updated_at before update on public.gigs
for each row execute function public.set_updated_at();

create trigger applications_set_updated_at before update on public.applications
for each row execute function public.set_updated_at();

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.user_role;
begin
  requested_role := coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'worker');

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
        role = excluded.role,
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

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.users enable row level security;
alter table public.worker_profiles enable row level security;
alter table public.client_profiles enable row level security;
alter table public.gigs enable row level security;
alter table public.applications enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;

create policy "Authenticated users can read user summaries"
on public.users for select
using (auth.role() = 'authenticated' or id = auth.uid());

create policy "Users can update their own summary"
on public.users for update
using (id = auth.uid() or public.current_user_role() = 'admin')
with check (id = auth.uid() or public.current_user_role() = 'admin');

create policy "Authenticated users can read worker profiles"
on public.worker_profiles for select
using (auth.role() = 'authenticated');

create policy "Workers can update their profile"
on public.worker_profiles for update
using (user_id = auth.uid() or public.current_user_role() = 'admin')
with check (user_id = auth.uid() or public.current_user_role() = 'admin');

create policy "Authenticated users can read client profiles"
on public.client_profiles for select
using (auth.role() = 'authenticated');

create policy "Clients can update their profile"
on public.client_profiles for update
using (user_id = auth.uid() or public.current_user_role() = 'admin')
with check (user_id = auth.uid() or public.current_user_role() = 'admin');

create policy "Anyone can read open gigs"
on public.gigs for select
using (status = 'open' or client_id = auth.uid() or public.current_user_role() = 'admin');

create policy "Clients can create gigs"
on public.gigs for insert
with check ((public.current_user_role() in ('client', 'admin')) and client_id = auth.uid());

create policy "Clients can update their gigs"
on public.gigs for update
using (client_id = auth.uid() or public.current_user_role() = 'admin')
with check (client_id = auth.uid() or public.current_user_role() = 'admin');

create policy "Workers clients and admins can read relevant applications"
on public.applications for select
using (
  worker_id = auth.uid()
  or public.current_user_role() = 'admin'
  or exists (
    select 1 from public.gigs
    where gigs.id = applications.gig_id
      and gigs.client_id = auth.uid()
  )
);

create policy "Workers can apply to open gigs"
on public.applications for insert
with check (
  worker_id = auth.uid()
  and public.current_user_role() = 'worker'
  and exists (
    select 1 from public.gigs
    where gigs.id = applications.gig_id
      and gigs.status = 'open'
  )
);

create policy "Clients can update application status for their gigs"
on public.applications for update
using (
  public.current_user_role() = 'admin'
  or exists (
    select 1 from public.gigs
    where gigs.id = applications.gig_id
      and gigs.client_id = auth.uid()
  )
)
with check (
  public.current_user_role() = 'admin'
  or exists (
    select 1 from public.gigs
    where gigs.id = applications.gig_id
      and gigs.client_id = auth.uid()
  )
);

create policy "Users can read reviews"
on public.reviews for select
using (true);

create policy "Authenticated users can create reviews"
on public.reviews for insert
with check (reviewer_id = auth.uid());

create policy "Admins can manage reviews"
on public.reviews for all
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "Users can create reports"
on public.reports for insert
with check (reported_by = auth.uid());

create policy "Users can read their reports and admins can read all"
on public.reports for select
using (reported_by = auth.uid() or public.current_user_role() = 'admin');

create policy "Admins can update reports"
on public.reports for update
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');
