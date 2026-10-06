create policy "Users can insert their own summary"
on public.users for insert
with check (id = auth.uid());

create policy "Workers can insert their own profile"
on public.worker_profiles for insert
with check (
  user_id = auth.uid()
  and public.current_user_role() = 'worker'
);

create policy "Clients can insert their own profile"
on public.client_profiles for insert
with check (
  user_id = auth.uid()
  and public.current_user_role() = 'client'
);
