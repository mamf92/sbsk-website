-- profiles: the member's own presentation (phase 2 step 1).
begin;
\ir helpers/auth.sql
select plan(10);
select tests.seed();

select tests.as_anon();
select throws_ok('select * from public.profiles', '42501', null, 'anon cannot read profiles');

select tests.authenticate_as('a@example.no');
select results_eq('select email::text from public.profiles', array['a@example.no'], 'a member reads only their own profile');
select lives_ok(
  $$update public.profiles set bio = 'Liker Azul' where supabase_id = auth.uid()$$,
  'a member edits their own bio'
);
select throws_ok(
  $$update public.profiles set email = 'other@example.no' where supabase_id = auth.uid()$$,
  '42501', null, 'a member cannot change the email on their profile'
);
select throws_ok(
  $$insert into public.profiles (supabase_id, email) values (auth.uid(), 'x@example.no')$$,
  '42501', null, 'nobody inserts profiles through the API'
);
update public.profiles set bio = 'kapret' where email = 'b@example.no';
select tests.as_owner();
select is((select bio from public.profiles where email = 'b@example.no'), null, 'a member cannot edit someone else''s profile');

select tests.authenticate_as('disabled@example.no');
update public.profiles set bio = 'fortsatt her' where supabase_id = auth.uid();
select tests.as_owner();
select is((select bio from public.profiles where email = 'disabled@example.no'), null, 'a disabled member cannot edit their profile');

select tests.authenticate_as('admin@example.no', 'aal2');
select is((select count(*)::int from public.profiles), 4, 'an admin at aal2 reads every profile');

-- member_directory: active members see active members' public columns only
select tests.authenticate_as('a@example.no');
select is((select count(*)::int from public.member_directory), 3, 'the directory lists active members with an account');
select tests.authenticate_as('disabled@example.no');
select is_empty('select * from public.member_directory', 'a disabled member sees an empty directory');

select * from finish();
rollback;
