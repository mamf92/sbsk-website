-- Fully remove the three test members from the register (not a deactivation).
--
-- Selected by id, because the repository is public and docs/DATABASE_MIGRATIONS.md keeps personal
-- data out of migrations. The ids are the register rows and the auth users they are linked to.
-- The remaining board member stays, so the last-admin lock is not tripped.
--
-- Order matters:
--   1. the register rows (attendance and notes cascade; payments set null, none exist),
--   2. the auth users (cascades profiles and event_participants, MFA factors and sessions),
--   3. the audit trail rows those deletes wrote, because the snapshots hold names and emails.

do $$
declare
  member_ids uuid[] := array[
    '132c8374-34be-4801-bf8b-7ea4d30bcf96',
    '93ea2492-0a6e-4f3f-9bf4-00002852fa55',
    '89975570-ebd1-4d47-88be-497ec00be7e1'
  ]::uuid[];
  auth_ids uuid[] := array[
    'a14bf33e-e2fe-4233-bc38-2adea436b74c',
    '67b3c821-2600-4f44-a862-c4c2de789b0c',
    '66d2c71a-c929-44a4-aba0-ed39e24fc60c'
  ]::uuid[];
begin
  delete from public.members where id = any (member_ids);
  delete from auth.users where id = any (auth_ids);

  delete from public.admin_audit_log
  where (table_name = 'members' and row_id = any (select unnest(member_ids)::text))
     or (table_name <> 'members' and (
          old ->> 'member_id' = any (select unnest(member_ids)::text)
       or new ->> 'member_id' = any (select unnest(member_ids)::text)
       or old ->> 'supabase_id' = any (select unnest(auth_ids)::text)
       or new ->> 'supabase_id' = any (select unnest(auth_ids)::text)));
end
$$;
