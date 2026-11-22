-- event_attendees: names come live from profiles; hidden members are counted, not named
-- (phase 3 step 4, decisions 7 and 8).
begin;
\ir helpers/auth.sql
select plan(9);
select tests.seed();

select tests.authenticate_as('a@example.no');
insert into public.event_participants (event_id, supabase_id) values ('evt-1', auth.uid());
select tests.authenticate_as('b@example.no');
insert into public.event_participants (event_id, supabase_id) values ('evt-1', auth.uid());
update public.profiles set show_in_attendee_lists = false where supabase_id = auth.uid();

-- Anna sees herself by name and Bjørn as a hidden, anonymous row.
select tests.authenticate_as('a@example.no');
select results_eq(
  $$select name, hidden, supabase_id is null from public.event_attendees order by hidden$$,
  $$values ('Anna'::text, false, false), (null::text, true, true)$$,
  'a hidden member is counted but not named or identified'
);
select is(
  (select count(*)::int from public.event_participants),
  1,
  'the table itself only answers for the caller''s own sign-ups'
);
select is(
  (select count(*)::int from public.member_directory where name = 'Bjørn'),
  0,
  'a hidden member is left out of the directory'
);

-- Bjørn always sees himself.
select tests.authenticate_as('b@example.no');
select is(
  (select name from public.event_attendees where supabase_id = auth.uid()),
  'Bjørn',
  'a hidden member still sees their own name'
);

-- A profile edit shows at once: there is no snapshot any more.
select tests.authenticate_as('a@example.no');
update public.profiles set name = 'Anne' where supabase_id = auth.uid();
select is(
  (select name from public.event_attendees where not hidden),
  'Anne',
  'names are read live from the profile'
);

-- The board sees everyone, by name.
select tests.authenticate_as('admin@example.no', 'aal2');
select is(
  (select count(*)::int from public.event_attendees where not hidden),
  2,
  'an admin at aal2 sees hidden members by name'
);
select tests.authenticate_as('admin@example.no', 'aal1');
select is(
  (select count(*)::int from public.event_attendees where hidden),
  1,
  'an admin at aal1 is an ordinary member here'
);

-- A disabled member's sign-ups disappear from the list.
select tests.as_owner();
update public.members set status = 'disabled', disabled_at = now() where email = 'b@example.no';
select tests.authenticate_as('a@example.no');
select is(
  (select count(*)::int from public.event_attendees),
  1,
  'a disabled member is not listed as coming'
);

select tests.as_anon();
select throws_ok('select * from public.event_attendees', '42501', null, 'anon cannot read attendees');

select * from finish();
rollback;
