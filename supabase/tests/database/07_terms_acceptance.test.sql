-- profiles.terms_accepted_*: the member sets the version, the database sets the time (phase 3).
begin;
\ir helpers/auth.sql
select plan(4);
select tests.seed();

select tests.authenticate_as('a@example.no');
select lives_ok(
  $$update public.profiles set terms_accepted_version = '2026-11' where supabase_id = auth.uid()$$,
  'a member accepts the terms on their own profile'
);
select tests.as_owner();
select ok(
  (select terms_accepted_at between now() - interval '1 minute' and now() + interval '1 minute'
   from public.profiles where email = 'a@example.no'),
  'the acceptance time is stamped by the database'
);

select tests.authenticate_as('a@example.no');
update public.profiles set terms_accepted_at = '2001-01-01' where supabase_id = auth.uid();
select tests.as_owner();
select ok(
  (select terms_accepted_at > '2020-01-01' from public.profiles where email = 'a@example.no'),
  'a member cannot back-date the acceptance'
);

select tests.authenticate_as('b@example.no');
update public.profiles set terms_accepted_version = '2026-11' where email = 'a@example.no' and supabase_id <> auth.uid();
select tests.as_owner();
select is(
  (select terms_accepted_version from public.profiles where email = 'b@example.no'),
  null,
  'accepting on someone else''s profile changes nothing'
);

select * from finish();
rollback;
