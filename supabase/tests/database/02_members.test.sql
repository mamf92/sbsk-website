-- The register: RLS matrix, last-admin protection, normalisation, the signup hooks
-- (phase 2 step 1).
begin;
\ir helpers/auth.sql
select plan(25);
select tests.seed();

-- anon
select tests.as_anon();
select throws_ok('select * from public.members', '42501', null, 'anon cannot read the register');

-- active member: own row only, no writes
select tests.authenticate_as('a@example.no');
select results_eq('select email from public.members', array['a@example.no'], 'a member reads only their own row');
select throws_ok(
  $$insert into public.members (name, surname, email) values ('X', 'Y', 'x@example.no')$$,
  '42501', null, 'a member cannot add to the register'
);
update public.members set is_admin = true where email = 'a@example.no';
select tests.as_owner();
select is((select is_admin from public.members where email = 'a@example.no'), false, 'a member cannot make themselves admin');

-- disabled member: nothing
select tests.authenticate_as('disabled@example.no');
select is_empty('select * from public.members', 'a disabled member reads nothing, not even their own row');

-- admin at aal1: treated as a member
select tests.authenticate_as('admin@example.no', 'aal1');
select results_eq('select email from public.members', array['admin@example.no'], 'an admin at aal1 reads only their own row');
select throws_ok(
  $$insert into public.members (name, surname, email) values ('X', 'Y', 'x@example.no')$$,
  '42501', null, 'an admin at aal1 cannot add members'
);
update public.members set name = 'Endret' where email = 'a@example.no';
select tests.as_owner();
select is((select name from public.members where email = 'a@example.no'), 'Anna', 'an admin at aal1 cannot edit members');

-- admin at aal2: full register, insert and update, no delete
select tests.authenticate_as('admin@example.no', 'aal2');
select is((select count(*)::int from public.members), 5, 'an admin at aal2 reads the whole register');
select lives_ok(
  $$insert into public.members (name, surname, email) values ('Xena', 'Y', '  New@Example.NO ')$$,
  'an admin at aal2 adds a member'
);
select lives_ok(
  $$update public.members set phone = ' 12345678 ' where email = 'a@example.no'$$,
  'an admin at aal2 edits a member'
);
select throws_ok(
  $$delete from public.members where email = 'b@example.no'$$,
  '42501', null, 'nobody deletes from the register through the API'
);

select tests.as_owner();
select is((select email from public.members where name = 'Xena'), 'new@example.no', 'email is trimmed and lower-cased on write');
select is((select phone from public.members where email = 'a@example.no'), '12345678', 'phone is trimmed on write');
select throws_ok(
  $$insert into public.members (name, surname, email) values ('Bad', 'Y', 'not-an-email')$$,
  '23514', null, 'a malformed email is rejected'
);
select throws_ok(
  $$update public.members set status = 'disabled' where email = 'b@example.no'$$,
  '23514', null, 'disabled without disabled_at is rejected'
);

-- last-admin protection
select throws_ok(
  $$update public.members set is_admin = false where email = 'admin@example.no'$$,
  'P0001', 'last_admin', 'the last admin cannot be demoted'
);
select throws_ok(
  $$update public.members set status = 'disabled', disabled_at = now() where email = 'admin@example.no'$$,
  'P0001', 'last_admin', 'the last admin cannot be disabled'
);
select throws_ok(
  $$delete from public.members where email = 'admin@example.no'$$,
  'P0001', 'last_admin', 'the last admin cannot be deleted'
);
update public.members set is_admin = true where email = 'b@example.no';
select lives_ok(
  $$update public.members set is_admin = false where email = 'admin@example.no'$$,
  'an admin can be demoted while another active admin remains'
);

-- signup hooks
select throws_ok(
  $$insert into auth.users (id, email) values (gen_random_uuid(), 'stranger@example.no')$$,
  'P0001', null, 'an email not on the register cannot sign up'
);
select throws_ok(
  $$insert into auth.users (id, email) values (gen_random_uuid(), 'disabled2@example.no')$$,
  'P0001', null, 'an unknown email cannot sign up'
);
update public.members set status = 'disabled', disabled_at = now() where email = 'pending@example.no';
select throws_ok(
  $$insert into auth.users (id, email) values (gen_random_uuid(), 'pending@example.no')$$,
  'P0001', null, 'a disabled member cannot sign up'
);
update public.members set status = 'active', disabled_at = null where email = 'pending@example.no';
insert into auth.users (id, email) values (gen_random_uuid(), 'pending@example.no');
select is(
  (select supabase_id from public.members where email = 'pending@example.no'),
  tests.user_id('pending@example.no'),
  'signing up links the register row'
);
select is(
  (select name from public.profiles where supabase_id = tests.user_id('pending@example.no')),
  'Per',
  'signing up starts the profile with the register name'
);

select * from finish();
rollback;
