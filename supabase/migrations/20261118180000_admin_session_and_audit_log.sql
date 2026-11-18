-- The admin boundary and the admin audit log (security plan S2b function + S3,
-- docs/plans/SECURITY_AND_RELIABILITY.md; prerequisite of phase 2, docs/plans/phase-2-admin-page.md).
--
-- admin_session() is "an active admin who has passed a second factor in this session". Every
-- admin branch in RLS, RPCs and edge functions uses it from here on. member_is_admin() stays the
-- aal1 identity probe the client uses to decide whether to ask for a code.
--
-- Until admins have enrolled an authenticator (S2a, the /to-faktor pages), nobody has an aal2
-- session, so admin features fail closed rather than open. That is intended.

create or replace function public.admin_session()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select public.member_is_admin()
     and coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2';
$$;

revoke execute on function public.admin_session() from public, anon;
grant execute on function public.admin_session() to authenticated, service_role;

-- One row per admin-managed write, written only by log_admin_change(). Nobody writes it
-- directly; aal2 admins read it.
create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid default auth.uid(),
  table_name text not null,
  row_id text,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old jsonb,
  new jsonb
);

create index admin_audit_log_row_idx on public.admin_audit_log (table_name, row_id);
create index admin_audit_log_at_idx on public.admin_audit_log (at desc);

alter table public.admin_audit_log enable row level security;

revoke all on public.admin_audit_log from public, anon, authenticated;
grant select on public.admin_audit_log to authenticated;
grant all on public.admin_audit_log to service_role;

create policy "Admins read the audit log"
  on public.admin_audit_log for select to authenticated
  using (public.admin_session());

-- Keys that hold personal data, in any table the audit trigger is attached to. GDPR erasure
-- (gdpr.md) rewrites these to '[slettet]' in both snapshots; defined once so the trigger and
-- the erasure function cannot drift.
create or replace function public.audit_personal_keys()
returns text[]
language sql
immutable
set search_path to 'public'
as $$
  select array[
    'name', 'surname', 'email', 'phone', 'address', 'postcode', 'city', 'photo_url', 'bio',
    'birth_year', 'notes', 'disabled_reason', 'payer_name', 'note'
  ]::text[];
$$;

-- Free-text admin notes are logged as changed, never with their content.
create or replace function public.audit_redacted_keys()
returns text[]
language sql
immutable
set search_path to 'public'
as $$
  select array['notes', 'note', 'disabled_reason']::text[];
$$;

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
    coalesce(new_row ->> 'id', old_row ->> 'id', new_row ->> 'event_id', old_row ->> 'event_id'),
    tg_op,
    old_diff,
    new_diff
  );
  return null;
end;
$$;

revoke execute on function public.log_admin_change() from public, anon, authenticated;
revoke execute on function public.audit_personal_keys() from public, anon;
revoke execute on function public.audit_redacted_keys() from public, anon;

-- Retention (two years) needs pg_cron, which is not enabled on the project yet. Until it is,
-- the purge is a manual statement in the monthly check (security plan S5.3):
--   delete from public.admin_audit_log where at < now() - interval '2 years';
