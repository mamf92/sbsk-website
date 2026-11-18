-- Two fixes to 20261118180100_member_register.sql, found in review of #318 before that migration
-- reached production.
--
-- 1. Board-only notes move out of `members` into their own table. An active member may read
--    their own `members` row, and RLS filters rows, not columns: with `notes` on that row a
--    member could read what the board wrote about them through the REST API. A table only an
--    admin session can read keeps that boundary in one place, and `select *` on `members`
--    keeps working.
--
-- 2. `protect_last_admin()` takes a lock before it counts the remaining admins. Without it, two
--    transactions demoting or disabling two different admins each saw the other still active,
--    both passed, and the club was left with no admin.

-- ---------------------------------------------------------------------------------------------
-- 1. member_notes
-- ---------------------------------------------------------------------------------------------
create table public.member_notes (
  member_id uuid primary key references public.members (id) on delete cascade,
  notes text not null check (char_length(notes) between 1 and 2000),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);

insert into public.member_notes (member_id, notes)
select id, notes from public.members where nullif(trim(notes), '') is not null;

alter table public.members drop column notes;

alter table public.member_notes enable row level security;

revoke all on public.member_notes from public, anon, authenticated;
grant select, insert, update, delete on public.member_notes to authenticated;
grant all on public.member_notes to service_role;

create policy "Admins manage member notes"
  on public.member_notes for all to authenticated
  using (public.admin_session())
  with check (public.admin_session());

create or replace function public.member_notes_touch()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

revoke execute on function public.member_notes_touch() from public, anon, authenticated;

create trigger member_notes_touch
  before update on public.member_notes
  for each row execute function public.member_notes_touch();

-- The audit log keys a row by `id` or `event_id`; this table's key is `member_id`.
create or replace function public.log_admin_change()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  old_row jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  new_row jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  old_diff jsonb := '{}'::jsonb;
  new_diff jsonb := '{}'::jsonb;
  k text;
begin
  if tg_op = 'UPDATE' then
    for k in select jsonb_object_keys(new_row) loop
      if (old_row -> k) is distinct from (new_row -> k) then
        old_diff := old_diff || jsonb_build_object(k, old_row -> k);
        new_diff := new_diff || jsonb_build_object(k, new_row -> k);
      end if;
    end loop;
    if new_diff = '{}'::jsonb then
      return null;
    end if;
  else
    old_diff := old_row;
    new_diff := new_row;
  end if;

  foreach k in array public.audit_redacted_keys() loop
    if old_diff ? k and old_diff -> k <> 'null'::jsonb then
      old_diff := jsonb_set(old_diff, array[k], '"[endret]"');
    end if;
    if new_diff ? k and new_diff -> k <> 'null'::jsonb then
      new_diff := jsonb_set(new_diff, array[k], '"[endret]"');
    end if;
  end loop;

  insert into public.admin_audit_log (table_name, row_id, action, old, new)
  values (
    tg_table_name,
    coalesce(
      new_row ->> 'id', old_row ->> 'id',
      new_row ->> 'event_id', old_row ->> 'event_id',
      new_row ->> 'member_id', old_row ->> 'member_id'
    ),
    tg_op,
    old_diff,
    new_diff
  );
  return null;
end;
$$;

revoke execute on function public.log_admin_change() from public, anon, authenticated;

create trigger audit_member_notes
  after insert or update or delete on public.member_notes
  for each row execute function public.log_admin_change();

-- ---------------------------------------------------------------------------------------------
-- 2. protect_last_admin, serialised
-- ---------------------------------------------------------------------------------------------
-- The advisory lock is held to the end of the transaction, so a second change that could remove
-- an admin waits for the first to commit. In READ COMMITTED each statement in this function
-- takes a fresh snapshot, so the count after the wait sees the first change.
create or replace function public.protect_last_admin()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if old.is_admin and old.status = 'active'
     and (tg_op = 'DELETE' or not new.is_admin or new.status <> 'active') then
    perform pg_advisory_xact_lock(hashtext('public.members:last_admin'));
    if not exists (
      select 1 from public.members
      where id <> old.id and is_admin and status = 'active'
    ) then
      raise exception 'last_admin' using
        errcode = 'P0001',
        hint = 'The last active board member cannot be removed, disabled or demoted.';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke execute on function public.protect_last_admin() from public, anon, authenticated;
