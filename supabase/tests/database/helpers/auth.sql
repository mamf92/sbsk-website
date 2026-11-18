-- Shared helpers for the pgTAP suites. Included with `\ir helpers/auth.sql` inside each test's
-- transaction, so everything here (the tests schema, the fixtures) is rolled back afterwards.
--
-- Pattern after basejump's supabase_test_helpers, vendored rather than installed: the caller's
-- identity is the `request.jwt.claims` setting plus the database role, exactly what PostgREST
-- sets for a real request.

create schema if not exists tests;

-- Run the following statements as a signed-in user, at the given assurance level.
create or replace function tests.authenticate_as(p_email text, p_aal text default 'aal1')
returns void
language plpgsql
as $$
declare
  uid uuid;
begin
  perform set_config('role', 'postgres', true);
  select id into uid from auth.users where email = lower(p_email);
  if uid is null then
    raise exception 'tests.authenticate_as: no auth user %', p_email;
  end if;
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', uid, 'role', 'authenticated', 'aal', p_aal, 'email', lower(p_email))::text,
    true
  );
  perform set_config('role', 'authenticated', true);
end;
$$;

create or replace function tests.as_anon()
returns void
language plpgsql
as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  perform set_config('role', 'anon', true);
end;
$$;

-- Back to the migration owner, which bypasses RLS: for fixtures and for checking side effects.
create or replace function tests.as_owner()
returns void
language plpgsql
as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end;
$$;

create or replace function tests.user_id(p_email text)
returns uuid
language sql
stable
security definer
set search_path to 'public'
as $$
  select id from auth.users where email = lower(p_email)
$$;

create or replace function tests.member_id(p_email text)
returns uuid
language sql
stable
security definer
set search_path to 'public'
as $$
  select id from public.members where email = lower(p_email)
$$;

-- A register row, and (with_account) the auth user that signs up for it, which fires the real
-- signup hook and handle_new_user().
create or replace function tests.add_member(
  p_email text,
  p_name text,
  p_is_admin boolean default false,
  p_with_account boolean default true
)
returns uuid
language plpgsql
as $$
declare
  mid uuid;
begin
  insert into public.members (name, surname, email, is_admin)
  values (p_name, 'Testesen', p_email, p_is_admin)
  returning id into mid;
  if p_with_account then
    insert into auth.users (id, email) values (gen_random_uuid(), lower(p_email));
  end if;
  return mid;
end;
$$;

-- The standard cast: one admin, two members, one disabled member (who had an account), one
-- register row nobody has signed up for yet.
create or replace function tests.seed()
returns void
language plpgsql
as $$
begin
  perform tests.as_owner();
  perform tests.add_member('admin@example.no', 'Ada', true);
  perform tests.add_member('a@example.no', 'Anna');
  perform tests.add_member('b@example.no', 'Bjørn');
  perform tests.add_member('disabled@example.no', 'Dina');
  update public.members
  set status = 'disabled', disabled_at = now(), disabled_reason = 'Flyttet'
  where email = 'disabled@example.no';
  perform tests.add_member('pending@example.no', 'Per', false, false);
end;
$$;

-- The helpers switch role mid-test, so the API roles must be able to call them.
grant usage on schema tests to anon, authenticated;
grant execute on all functions in schema tests to anon, authenticated;
