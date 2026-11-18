-- membership_payments, member_season_status and the admin audit log (phase 2 step 1, security S3).
begin;
\ir helpers/auth.sql
select plan(14);
select tests.seed();

-- payments
select tests.authenticate_as('admin@example.no', 'aal1');
select throws_ok(
  format(
    $$insert into public.membership_payments (member_id, payer_name, season, amount_nok, method, paid_at)
      values (%L, 'Anna Testesen', extract(year from now())::int, 300, 'manual', now())$$,
    tests.member_id('a@example.no')
  ),
  '42501', null, 'an admin at aal1 cannot record a payment'
);

select tests.authenticate_as('admin@example.no', 'aal2');
select lives_ok(
  format(
    $$insert into public.membership_payments (member_id, payer_name, season, amount_nok, method, paid_at)
      values (%L, 'Anna Testesen', extract(year from now())::int, 300, 'manual', now())$$,
    tests.member_id('a@example.no')
  ),
  'an admin at aal2 records a payment'
);
select is(
  (select marked_by from public.membership_payments limit 1),
  tests.user_id('admin@example.no'),
  'the payment records who ticked it'
);
select results_eq(
  $$select m.email, s.paid from public.member_season_status s join public.members m on m.id = s.member_id
    where m.email in ('a@example.no', 'b@example.no') order by m.email$$,
  $$values ('a@example.no'::text, true), ('b@example.no'::text, false)$$,
  'season status shows paid and unpaid'
);

select tests.authenticate_as('a@example.no');
select is((select count(*)::int from public.membership_payments), 1, 'a member reads their own payments');
select tests.authenticate_as('b@example.no');
select is_empty('select * from public.membership_payments', 'a member does not read other people''s payments');
update public.membership_payments set amount_nok = 0;
select tests.as_owner();
select is((select amount_nok from public.membership_payments limit 1), 300, 'a member cannot change payments');

-- audit log
select tests.as_owner();
delete from public.admin_audit_log;
select tests.authenticate_as('admin@example.no', 'aal2');
update public.members set phone = '99999999', notes = 'Hemmelig notat' where email = 'b@example.no';
select tests.as_owner();
select is((select count(*)::int from public.admin_audit_log), 1, 'one edit writes exactly one audit row');
select is(
  (select actor from public.admin_audit_log),
  tests.user_id('admin@example.no'),
  'the audit row names the admin who made the change'
);
select is(
  (select array(select jsonb_object_keys(new) order by 1) from public.admin_audit_log),
  array['notes', 'phone'],
  'the audit row holds only the changed columns'
);
select is((select new ->> 'notes' from public.admin_audit_log), '[endret]', 'a note is logged as changed, never its text');

select tests.authenticate_as('a@example.no');
select is_empty('select * from public.admin_audit_log', 'a member cannot read the audit log');
select throws_ok(
  $$insert into public.admin_audit_log (table_name, action) values ('members', 'UPDATE')$$,
  '42501', null, 'nobody writes the audit log directly'
);
select tests.authenticate_as('admin@example.no', 'aal2');
select is((select count(*)::int from public.admin_audit_log), 1, 'an admin at aal2 reads the audit log');

select * from finish();
rollback;
