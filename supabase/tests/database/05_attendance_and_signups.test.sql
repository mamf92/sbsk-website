-- Check-in, guest counts, the admin sign-up view, event participants and contact messages.
begin;
\ir helpers/auth.sql
select plan(16);
select tests.seed();

-- event participants (RSVP)
select tests.authenticate_as('a@example.no');
select lives_ok(
  $$insert into public.event_participants (event_id, supabase_id, name, surname) values ('evt-1', auth.uid(), 'Anna', 'T')$$,
  'an active member signs up for an event'
);
select throws_ok(
  $$insert into public.event_participants (event_id, supabase_id) values ('evt-1', tests.user_id('b@example.no'))$$,
  '42501', null, 'a member cannot sign someone else up'
);
select tests.authenticate_as('b@example.no');
select is((select count(*)::int from public.event_participants), 1, 'active members see who is coming');
select tests.authenticate_as('disabled@example.no');
select is_empty('select * from public.event_participants', 'a disabled member sees no sign-ups');
select throws_ok(
  $$insert into public.event_participants (event_id, supabase_id) values ('evt-1', auth.uid())$$,
  '42501', null, 'a disabled member cannot sign up'
);

-- admin_event_signups
select tests.authenticate_as('a@example.no');
select is_empty('select * from public.admin_event_signups', 'a member gets no rows from the admin sign-up view');
select tests.authenticate_as('admin@example.no', 'aal1');
select is_empty('select * from public.admin_event_signups', 'an admin at aal1 gets no rows from the admin sign-up view');
select tests.authenticate_as('admin@example.no', 'aal2');
select results_eq(
  'select display_name, email, source from public.admin_event_signups',
  $$values ('Anna Testesen'::text, 'a@example.no'::text, 'rsvp'::text)$$,
  'an admin at aal2 sees sign-ups with names and emails'
);

-- check-in
select lives_ok(
  format(
    $$insert into public.attendance (event_id, event_date, member_id) values ('evt-1', current_date, %L)$$,
    tests.member_id('b@example.no')
  ),
  'an admin at aal2 checks a walk-in in'
);
select lives_ok(
  $$insert into public.event_headcounts (event_id, event_date, guests) values ('evt-1', current_date, 3)$$,
  'an admin at aal2 records guests'
);
select tests.authenticate_as('admin@example.no', 'aal1');
select throws_ok(
  format(
    $$insert into public.attendance (event_id, event_date, member_id) values ('evt-1', current_date, %L)$$,
    tests.member_id('a@example.no')
  ),
  '42501', null, 'an admin at aal1 cannot check members in'
);
select tests.authenticate_as('b@example.no');
select is((select count(*)::int from public.attendance), 1, 'a member reads their own check-ins');
select is_empty('select * from public.event_headcounts', 'a member cannot read guest counts');
select tests.authenticate_as('a@example.no');
select is_empty('select * from public.attendance', 'a member does not see other people''s check-ins');

-- contact messages
select tests.as_anon();
select lives_ok(
  $$insert into public.contact_messages (name, email, message) values ('Ola', 'ola@example.no', 'Hei!')$$,
  'anyone can send a contact message'
);
select tests.authenticate_as('admin@example.no', 'aal2');
select is((select count(*)::int from public.contact_messages), 1, 'an admin at aal2 reads contact messages');

select * from finish();
rollback;
