-- The original "Authenticated users can read user summaries" policy let ANY signed-in
-- user select every column of every row in public.users -- including email and phone.
-- That's more than the app needs: gig/worker listings only ever display full_name,
-- location, profile_photo_url, and role. This migration tightens direct table access
-- to the owning user (and admins), and adds a public-safe view for everything else.

drop policy if exists "Authenticated users can read user summaries" on public.users;

create policy "Users can read their own record, admins can read all"
on public.users for select
using (id = auth.uid() or public.current_user_role() = 'admin');

-- Public-safe view: no email, no phone. Owned by the migration role (which has
-- BYPASSRLS on Supabase), so it can surface every row's non-sensitive columns
-- regardless of the restricted policy above, without ever exposing contact info.
create or replace view public.public_profiles as
select
  id,
  full_name,
  location,
  profile_photo_url,
  role,
  created_at
from public.users;

grant select on public.public_profiles to authenticated, anon;
