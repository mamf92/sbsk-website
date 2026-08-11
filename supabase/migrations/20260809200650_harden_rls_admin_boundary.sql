-- Harden Supabase RLS and stop trusting client-supplied is_admin (issue #100).
--
-- Consolidates the split admin model onto a single source of truth:
--   admin (board) status lives in public.members.is_admin, read via member_is_admin().
-- The parallel profiles.is_admin / is_admin() path is removed. profiles.is_admin is
-- frozen against non-admin writes so it can never be used to escalate again.

-- 1. Canonical admin check. SECURITY DEFINER + fixed search_path (advisor 0011).
create or replace function public.member_is_admin()
returns boolean
language sql
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.members
    where supabase_id = auth.uid()
      and is_admin = true
  );
$$;

-- 2. Freeze profiles.is_admin. The old trigger only guarded UPDATE; a non-admin could
--    INSERT a second profiles row for their own uid with is_admin = true (supabase_id has
--    no unique constraint) and escalate. Guard INSERT and UPDATE, gated on member_is_admin().
create or replace function public.prevent_admin_escalation()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if tg_op = 'INSERT' then
    if new.is_admin is true and not public.member_is_admin() then
      raise exception 'Not allowed to set admin status';
    end if;
  elsif tg_op = 'UPDATE' then
    if new.is_admin is distinct from old.is_admin and not public.member_is_admin() then
      raise exception 'Not allowed to change admin status';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_admin_escalation_trigger on public.profiles;
create trigger prevent_admin_escalation_trigger
  before insert or update on public.profiles
  for each row execute function public.prevent_admin_escalation();

-- 3. Repoint every profiles policy from is_admin() (profiles) to member_is_admin() (members),
--    and collapse the redundant duplicate SELECT/INSERT policies into one each.
drop policy if exists "Admins can view all, members can view own" on public.profiles;
drop policy if exists "Admins can view members" on public.profiles;
create policy "Admins can view all, members can view own"
  on public.profiles for select to authenticated
  using ((auth.uid() = supabase_id) or public.member_is_admin());

drop policy if exists "Admins can create new profiles, members cannot" on public.profiles;
drop policy if exists "Admins can create members" on public.profiles;
create policy "Users create own profile, admins create any"
  on public.profiles for insert to authenticated
  with check ((auth.uid() = supabase_id) or public.member_is_admin());

drop policy if exists "Amins can update all, members can update own" on public.profiles;
create policy "Admins update all, members update own"
  on public.profiles for update to authenticated
  using ((auth.uid() = supabase_id) or public.member_is_admin())
  with check ((auth.uid() = supabase_id) or public.member_is_admin());

drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles"
  on public.profiles for delete to authenticated
  using (public.member_is_admin());

-- 4. is_admin() (profiles-based) is now unreferenced. Drop the dead authority so the frozen
--    profiles.is_admin column can never gate access again.
drop function if exists public.is_admin();

-- 5. Advisor 0011: pin search_path on the remaining SECURITY DEFINER trigger functions.
alter function public.hook_restrict_signup_by_email_list() set search_path to 'public';
alter function public.sync_profile_email_on_auth_update() set search_path to 'public';

-- 6. Advisor 0028/0029: trigger and event-trigger functions are invoked by the system, never
--    as RPCs. Revoke EXECUTE (including the default PUBLIC grant) so they are not reachable
--    via /rest/v1/rpc. member_is_admin() intentionally keeps its grant — it is the sanctioned
--    client probe.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.hook_restrict_signup_by_email_list() from public, anon, authenticated;
revoke execute on function public.sync_profile_email_on_auth_update() from public, anon, authenticated;
revoke execute on function public.prevent_admin_escalation() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
