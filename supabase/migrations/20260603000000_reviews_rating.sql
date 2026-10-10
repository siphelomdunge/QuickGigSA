-- Reviews: keep the stored ratings in sync and tell people when they are reviewed.
--
-- The insert policy (security_fixes) already limits reviews to the two people on an accepted or completed
-- application, once per pair per gig. This migration adds:
--   1. a length limit on comments;
--   2. a trigger that recomputes worker_profiles.rating / client_profiles.rating from the
--      reviews table (users still cannot edit ratings directly: the trigger sets a session flag that the
--      protect_sensitive_columns trigger honours);
--   3. a 'new_review' notification for the reviewed person.

alter table public.reviews
  drop constraint if exists reviews_comment_length,
  add constraint reviews_comment_length check (comment is null or char_length(comment) <= 600);

alter type public.notification_type add value if not exists 'new_review';

-- Let the rating recomputation through the sensitive-column guard without opening it to users.
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
    elsif new.verification_status is distinct from old.verification_status then
      raise exception 'Only admins can change verification or rating';
    elsif new.rating is distinct from old.rating
       and coalesce(current_setting('quickgig.recomputing_rating', true), '') <> '1' then
      raise exception 'Only admins can change verification or rating';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.recompute_rating_after_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.reviewed_user_id, old.reviewed_user_id);
  avg_rating numeric(3,2);
  reviewer_name text;
  gig_title text;
begin
  select coalesce(round(avg(rating)::numeric, 2), 0) into avg_rating from public.reviews where reviewed_user_id = target;

  perform set_config('quickgig.recomputing_rating', '1', true);
  update public.worker_profiles set rating = avg_rating where user_id = target;
  update public.client_profiles set rating = avg_rating where user_id = target;
  perform set_config('quickgig.recomputing_rating', '', true);

  if tg_op = 'INSERT' then
    select left(coalesce(cp.business_name, u.full_name), 60) into reviewer_name
    from public.users u
    left join public.client_profiles cp on cp.user_id = u.id and exists (select 1 from public.gigs g where g.id = new.gig_id and g.client_id = u.id)
    where u.id = new.reviewer_id;
    select left(title, 80) into gig_title from public.gigs where id = new.gig_id;

    insert into public.notifications (user_id, type, title, body, link, application_id)
    values (
      target,
      'new_review',
      'New ' || new.rating || '-star review from ' || coalesce(reviewer_name, 'a QuickGig user'),
      coalesce(nullif(left(new.comment, 140), ''), 'They rated you ' || new.rating || ' out of 5 for "' || coalesce(gig_title, 'a gig') || '".'),
      case when exists (select 1 from public.worker_profiles where user_id = target) then '/worker/profile' else '/client/profile' end,
      null
    );
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists reviews_recompute_rating on public.reviews;
create trigger reviews_recompute_rating
after insert or update or delete on public.reviews
for each row execute function public.recompute_rating_after_review();
