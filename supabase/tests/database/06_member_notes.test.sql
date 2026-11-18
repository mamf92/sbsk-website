-- Board-only notes about a member (20261118190000). A member can read their own register row,
-- so notes live in a table only an admin session can see.
begin;
\ir helpers/auth.sql
select plan(9);
select tests.seed();

select hasnt_column('public', 'members', 'notes', 'members carries no board notes a member could read');

select tests.authenticate_as('admin@example.no', 'aal2');
select lives_ok(
  format($$insert into public.member_notes (member_id, notes) values (%L, 'Skylder for 2025')$$,
         tests.member_id('a@example.no')),
  'an admin at aal2 writes a note'
);
select is((select notes from public.member_notes), 'Skylder for 2025', 'an admin at aal2 reads it');

select tests.authenticate_as('a@example.no');
select is_empty('select * from public.member_notes', 'the member cannot read a note about themselves');
select throws_ok(
  format($$insert into public.member_notes (member_id, notes) values (%L, 'x')$$,
         tests.member_id('b@example.no')),
  '42501', null, 'a member cannot write notes'
);

select tests.authenticate_as('admin@example.no', 'aal1');
select is_empty('select * from public.member_notes', 'an admin at aal1 reads no notes');

select tests.as_anon();
select throws_ok('select * from public.member_notes', '42501', null, 'anon has no access at all');

select tests.as_owner();
select is(
  (select new ->> 'notes' from public.admin_audit_log where table_name = 'member_notes'),
  '[endret]',
  'the audit log records that a note was written, never its text'
);
select is(
  (select row_id from public.admin_audit_log where table_name = 'member_notes'),
  tests.member_id('a@example.no')::text,
  'the audit row names the member the note is about'
);

select * from finish();
rollback;
