-- Remove a test member, fully (not disabled): the register row, the login, the profile and
-- anything that hangs off the login. Selected by id, never by email, because the repository is
-- public. The `not is_admin` guard makes this a no-op if the row was ever promoted.
--
-- Deleting the auth user cascades to profiles and event_participants; membership_payments keeps
-- its row with member_id nulled. Attendance and notes go with the member row.

delete from public.members
where id = '93ea2492-0a6e-4f3f-9bf4-00002852fa55'
  and not is_admin;

delete from auth.users
where id = '67b3c821-2600-4f44-a862-c4c2de789b0c'
  and not exists (
    select 1 from public.members where supabase_id = '67b3c821-2600-4f44-a862-c4c2de789b0c'
  );
