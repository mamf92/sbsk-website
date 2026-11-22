-- Phase 3 step 1–2: members accept the privacy policy and terms during first-time setup
-- (docs/plans/phase-3-members.md, docs/plans/gdpr.md step 1).
--
-- The member writes `profiles.terms_accepted_version` themself (the "Active members edit their
-- own profile" policy already allows it). The time is the database's, never the client's: when
-- the version changes, `terms_accepted_at` is stamped with now(); any other write keeps the old
-- value, so a member cannot back-date or forge an acceptance time.

create or replace function public.profiles_stamp_terms()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if tg_op = 'INSERT' then
    new.terms_accepted_at := case when new.terms_accepted_version is null then null else now() end;
  elsif new.terms_accepted_version is distinct from old.terms_accepted_version then
    new.terms_accepted_at := case when new.terms_accepted_version is null then null else now() end;
  else
    new.terms_accepted_at := old.terms_accepted_at;
  end if;
  return new;
end;
$$;

revoke execute on function public.profiles_stamp_terms() from public, anon, authenticated;

create trigger profiles_stamp_terms
  before insert or update on public.profiles
  for each row execute function public.profiles_stamp_terms();
