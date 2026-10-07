-- Records that a user confirmed they are 18+ and accepted the Terms and Privacy Policy.
-- The time is set by the database (not the browser) when the account is created.
-- The browser only says which version of the documents was shown.

alter table public.users
  add column accepted_terms_at timestamptz,
  add column terms_version text;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.user_role;
  consented boolean;
begin
  requested_role := case
    when new.raw_user_meta_data->>'role' = 'client' then 'client'::public.user_role
    else 'worker'::public.user_role
  end;
  consented := coalesce(new.raw_user_meta_data->>'accepted_terms', '') = 'true';

  insert into public.users (id, full_name, email, phone, role, location, profile_photo_url, accepted_terms_at, terms_version)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    requested_role,
    new.raw_user_meta_data->>'location',
    new.raw_user_meta_data->>'profile_photo_url',
    case when consented then now() end,
    case when consented then left(new.raw_user_meta_data->>'terms_version', 80) end
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

-- Users cannot edit or fake their own consent record (admins and server-side code still can).
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
      new.accepted_terms_at := null;
      new.terms_version := null;
    elsif new.role is distinct from old.role then
      raise exception 'Only admins can change a role';
    elsif new.accepted_terms_at is distinct from old.accepted_terms_at
       or new.terms_version is distinct from old.terms_version then
      raise exception 'Consent records cannot be edited';
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
