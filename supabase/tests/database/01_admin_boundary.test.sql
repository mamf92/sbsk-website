-- admin_session() / member_is_admin() / member_is_active() and who may call them
-- (security plan S2b, phase 2 decision 5).
begin;
\ir helpers/auth.sql
select plan(14);
select tests.seed();

-- Grants: anon may call none of the identity helpers.
select ok(not has_function_privilege('anon', 'public.member_is_admin()', 'execute'), 'anon cannot execute member_is_admin');
select ok(not has_function_privilege('anon', 'public.admin_session()', 'execute'), 'anon cannot execute admin_session');
select ok(not has_function_privilege('anon', 'public.member_is_active()', 'execute'), 'anon cannot execute member_is_active');
select ok(not has_function_privilege('authenticated', 'public.log_admin_change()', 'execute'), 'nobody calls the audit trigger as an RPC');

select tests.authenticate_as('admin@example.no', 'aal1');
select is(public.member_is_admin(), true, 'admin at aal1 is identified as an admin');
select is(public.admin_session(), false, 'admin at aal1 has no admin session');

select tests.authenticate_as('admin@example.no', 'aal2');
select is(public.admin_session(), true, 'admin at aal2 has an admin session');

select tests.authenticate_as('a@example.no', 'aal2');
select is(public.admin_session(), false, 'a member with a second factor is still not an admin');
select is(public.member_is_active(), true, 'an active member is active');
select is(public.current_member_id(), tests.member_id('a@example.no'), 'current_member_id is the caller''s register row');

select tests.authenticate_as('disabled@example.no', 'aal1');
select is(public.member_is_active(), false, 'a disabled member is not active');
select is(public.current_member_id(), null, 'a disabled member has no current member id');

-- A disabled admin loses admin status even at aal2.
select tests.as_owner();
select tests.add_member('admin2@example.no', 'Arne', true);
update public.members set status = 'disabled', disabled_at = now() where email = 'admin2@example.no';
select tests.authenticate_as('admin2@example.no', 'aal2');
select is(public.member_is_admin(), false, 'a disabled admin is not an admin');
select is(public.admin_session(), false, 'a disabled admin has no admin session');

select * from finish();
rollback;
