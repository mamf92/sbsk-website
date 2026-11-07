-- Stop anonymous callers from executing member_is_admin() (Supabase advisor 0028).
--
-- The function was created without an explicit grant, so it kept Postgres' default
-- EXECUTE for PUBLIC, which made it reachable signed-out via /rest/v1/rpc/member_is_admin.
-- Every RLS policy that calls it is scoped `to authenticated`, and the client only calls
-- it after sign-in (isBoardAdmin), so anon never needs it.
--
-- authenticated keeps EXECUTE on purpose: RLS policies are evaluated as the calling role,
-- and the client asks it directly. That leaves advisor 0029 (signed-in users can execute a
-- SECURITY DEFINER function) as an accepted warning: the function only reveals whether
-- the caller is an admin. search_path is already pinned to 'public' (see
-- 20260809200650_harden_rls_admin_boundary.sql).

revoke execute on function public.member_is_admin() from public, anon;
grant execute on function public.member_is_admin() to authenticated, service_role;
