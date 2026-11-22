-- GDPR: the member's export, erasure (their own, with a fresh sign-in, and the board's), and the
-- retention run.
begin;
\ir helpers/auth.sql
select plan(37);
select tests.seed();

-- authenticate_as() plus an `amr` entry: the last real sign-in, p_seconds_ago seconds back.
create or replace function tests.signed_in_ago(p_email text, p_seconds_ago integer, p_aal text default 'aal1')
returns void
language plpgsql
as $$
begin
  perform tests.authenticate_as(p_email, p_aal);
  perform set_config(
    'request.jwt.claims',
    (current_setting('request.jwt.claims')::jsonb || jsonb_build_object(
      'amr', jsonb_build_array(jsonb_build_object(
        'method', 'otp',
        'timestamp', extract(epoch from now())::bigint - p_seconds_ago
      ))
    ))::text,
    true
  );
end;
$$;
grant execute on all functions in schema tests to anon, authenticated;

-- Fixtures for Anna: a check-in, a badge, a payment, an old application, a contact message, a
-- board note, a sign-up.
select tests.as_owner();
insert into public.attendance (event_id, event_date, event_category, member_id)
values ('evt-1', date '2026-03-01', 'spillkveld', tests.member_id('a@example.no'));
insert into public.event_headcounts (event_id, event_date, guests) values ('evt-1', date '2026-03-01', 2);
insert into public.membership_payments (member_id, payer_name, season, amount_nok, method, paid_at)
values (tests.member_id('a@example.no'), 'Anna Testesen', 2026, 200, 'manual', now());
insert into public.membership_applications (name, surname, email, privacy_version, status)
values ('Anna', 'Testesen', 'a@example.no', '2026-11', 'approved');
insert into public.contact_messages (name, email, message) values ('Anna', 'A@example.no', 'Hei!');
insert into public.member_notes (member_id, notes) values (tests.member_id('a@example.no'), 'Hjelper til');
insert into public.event_participants (event_id, supabase_id) values ('evt-2', tests.user_id('a@example.no'));
update public.members set birth_year = 1990 where email = 'a@example.no';

-- ---------------------------------------------------------------------------------------------
-- Export
-- ---------------------------------------------------------------------------------------------
select tests.authenticate_as('a@example.no');
create temp table export_doc as select public.export_my_data() as doc;
grant select on export_doc to authenticated, anon;
select is((select doc #>> '{register,email}' from export_doc), 'a@example.no', 'the export holds the register row');
select ok(not ((select doc -> 'register' from export_doc) ? 'member_card_token'), 'the export leaves out the card token');
select is((select doc #>> '{boardNote}' from export_doc), 'Hjelper til', 'the export includes the board''s note');
select is((select jsonb_array_length(doc -> 'checkIns') from export_doc), 1, 'the export lists check-ins');
select is((select jsonb_array_length(doc -> 'payments') from export_doc), 1, 'the export lists payments');
select is((select jsonb_array_length(doc -> 'applications') from export_doc), 1, 'the export finds applications by email');
select is((select jsonb_array_length(doc -> 'contactMessages') from export_doc), 1, 'the export finds contact messages, any case');
select is((select jsonb_array_length(doc -> 'eventSignups') from export_doc), 1, 'the export lists sign-ups');
select ok((select doc -> 'profile' from export_doc) ? 'bio', 'the export holds the profile');
select throws_ok('select public.export_my_data()', 'P0001', 'rate_limited', 'a second export within ten minutes is refused');

select tests.as_anon();
select throws_ok('select public.export_my_data()', '42501', null, 'anon cannot export');

select tests.authenticate_as('admin@example.no', 'aal1');
select throws_ok(
  format('select public.admin_export_member_data(%L)', tests.member_id('disabled@example.no')),
  '42501', 'not_admin', 'the board export needs aal2'
);
select tests.authenticate_as('admin@example.no', 'aal2');
select is(
  (select public.admin_export_member_data(tests.member_id('disabled@example.no')) #>> '{register,email}'),
  'disabled@example.no',
  'the board exports a disabled member'
);
select tests.authenticate_as('b@example.no');
select throws_ok(
  format('select public.admin_export_member_data(%L)', tests.member_id('a@example.no')),
  '42501', 'not_admin', 'a member cannot export someone else'
);

-- ---------------------------------------------------------------------------------------------
-- Fresh sign-in
-- ---------------------------------------------------------------------------------------------
select tests.signed_in_ago('a@example.no', 60);
select ok(public.gdpr_fresh_sign_in(), 'a sign-in a minute ago is fresh');
select tests.signed_in_ago('a@example.no', 600);
select ok(not public.gdpr_fresh_sign_in(), 'a sign-in ten minutes ago is not');
select tests.authenticate_as('a@example.no');
select ok(not public.gdpr_fresh_sign_in(), 'no amr claim is not fresh');

-- ---------------------------------------------------------------------------------------------
-- Erasure by the member
-- ---------------------------------------------------------------------------------------------
select tests.signed_in_ago('a@example.no', 600);
select throws_ok($$select public.erase_my_account('SLETT')$$, '42501', 'reauth_required', 'an old sign-in must sign in again first');
select tests.signed_in_ago('a@example.no', 30);
select throws_ok($$select public.erase_my_account('slet')$$, 'P0001', 'confirm_mismatch', 'the typed word must match');
select tests.as_owner();
create temp table anna as select tests.member_id('a@example.no') as mid, tests.user_id('a@example.no') as uid;
select tests.signed_in_ago('a@example.no', 30);
select lives_ok($$select public.erase_my_account('slett')$$, 'a fresh sign-in erases the account');

select tests.as_owner();
select ok(not exists (select 1 from public.members where id = (select mid from anna)), 'the register row is gone');
select ok(not exists (select 1 from auth.users where id = (select uid from anna)), 'the login is gone');
select ok(not exists (select 1 from public.profiles where supabase_id = (select uid from anna)), 'the profile is gone');
select ok(not exists (select 1 from public.attendance where event_id = 'evt-1'), 'the check-in is gone');
select is((select guests from public.event_headcounts where event_id = 'evt-1'), 3, 'and counts as a guest instead');
select is(
  (select payer_name || ':' || coalesce(member_id::text, 'unlinked') from public.membership_payments where season = 2026),
  'Anna Testesen:unlinked',
  'the payment is kept for the books, unlinked'
);
select is(
  (select count(*)::int from public.membership_applications where email = 'a@example.no')
  + (select count(*)::int from public.contact_messages where lower(email) = 'a@example.no')
  + (select count(*)::int from public.event_participants where supabase_id = (select uid from anna)),
  0,
  'applications, contact messages and sign-ups are gone'
);
select is(
  (select subject_hash from public.erasure_log where trigger = 'self'),
  encode(sha256(convert_to((select mid from anna)::text, 'UTF8')), 'hex'),
  'the ledger holds the hash of the member id'
);
select is_empty(
  $$select 1 from public.admin_audit_log
    where (old::text || new::text) ~* 'a@example\.no|Anna|1990'$$,
  'no audit row still holds her email, name or birth year'
);
select is_empty(
  format('select 1 from public.admin_audit_log where actor = %L', (select uid from anna)),
  'she is no longer anyone''s actor in the audit log'
);

-- The last active admin cannot erase themself.
select tests.signed_in_ago('admin@example.no', 30, 'aal2');
select throws_ok($$select public.erase_my_account('SLETT')$$, 'P0001', 'last_admin', 'the last admin is refused');

-- ---------------------------------------------------------------------------------------------
-- Erasure by the board
-- ---------------------------------------------------------------------------------------------
select tests.authenticate_as('admin@example.no', 'aal2');
select throws_ok(
  format($$select public.admin_erase_member(%L, 'Bjørn')$$, tests.member_id('b@example.no')),
  'P0001', 'confirm_mismatch', 'the board must type the full name'
);
select throws_ok(
  format($$select public.admin_erase_member(%L, 'Ada Testesen')$$, tests.member_id('admin@example.no')),
  'P0001', 'use_own_page', 'the board cannot erase themself here'
);
select lives_ok(
  format($$select public.admin_erase_member(%L, '  bjørn   testesen ')$$, tests.member_id('b@example.no')),
  'typing the name erases the member'
);
select tests.authenticate_as('admin@example.no', 'aal1');
select throws_ok(
  format($$select public.admin_erase_member(%L, 'Per Testesen')$$, tests.member_id('pending@example.no')),
  '42501', 'not_admin', 'the board erasure needs aal2'
);

-- ---------------------------------------------------------------------------------------------
-- Retention
-- ---------------------------------------------------------------------------------------------
select tests.as_owner();
insert into public.contact_messages (name, email, message, created_at)
values ('Gammel', 'old@example.no', 'Hei', now() - interval '13 months');
update public.members set disabled_at = now() - interval '25 months' where email = 'disabled@example.no';
select tests.authenticate_as('admin@example.no', 'aal2');
select is(
  (select r ->> 'contactMessages' || '/' || (r ->> 'lapsedMembers') from public.run_retention() r),
  '1/1',
  'retention removes an old contact message and erases a member disabled for two years'
);
select tests.as_owner();
select is((select count(*)::int from public.erasure_log), 3, 'each erasure is in the ledger');

select * from finish();
rollback;
