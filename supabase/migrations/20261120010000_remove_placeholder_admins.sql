-- Remove two placeholder board accounts that were never real people: their register rows,
-- logins and profiles. Selected by id, never by email, because the repository is public.
-- The `status = 'disabled'` guard means the rows are only deleted once the board has already
-- disabled them, so this can never take away an active admin (protect_last_admin agrees).

delete from public.members
where id in ('132c8374-34be-4801-bf8b-7ea4d30bcf96', '89975570-ebd1-4d47-88be-497ec00be7e1')
  and status = 'disabled';

delete from auth.users u
where u.id in ('a14bf33e-e2fe-4233-bc38-2adea436b74c', '66d2c71a-c929-44a4-aba0-ed39e24fc60c')
  and not exists (select 1 from public.members m where m.supabase_id = u.id);
