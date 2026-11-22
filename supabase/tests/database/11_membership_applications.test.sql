-- "Bli medlem": anyone applies, only the board reads and decides, approval adds to the
-- register, retention purges old decisions.
begin;
\ir helpers/auth.sql
select plan(19);
select tests.seed();

create or replace function tests.application_id(p_email text)
returns uuid
language sql
security definer
set search_path to 'public'
as $$
  select id from public.membership_applications where email = lower(p_email) order by created_at desc limit 1
$$;
grant execute on all functions in schema tests to anon, authenticated;

-- applying
select tests.as_anon();
select lives_ok(
  $$insert into public.membership_applications (name, surname, email, birth_year, message, privacy_version)
    values (' Sara ', 'Søker', ' Sara@Example.NO ', 1990, 'Hei!', '2026-11')$$,
  'an anonymous visitor applies'
);
select throws_ok(
  $$insert into public.membership_applications (name, surname, email, privacy_version)
    values ('Sara', 'Søker', 'sara@example.no', '2026-11')$$,
  '23505', null, 'a second open application from the same email is refused'
);
select throws_ok(
  $$insert into public.membership_applications (name, surname, email, privacy_version, status)
    values ('Eve', 'Ond', 'eve@example.no', '2026-11', 'approved')$$,
  '42501', null, 'an applicant cannot approve themself'
);
select throws_ok(
  $$insert into public.membership_applications (name, surname, email, privacy_version)
    values ('Bot', 'Bot', 'not-an-email', '2026-11')$$,
  '23514', null, 'an address without @ and a domain is refused'
);
select throws_ok(
  'select * from public.membership_applications',
  '42501', null, 'an anonymous visitor cannot read applications'
);

-- reading
select tests.authenticate_as('a@example.no');
select is_empty('select * from public.membership_applications', 'a member reads no applications');
select tests.authenticate_as('admin@example.no', 'aal1');
select is_empty('select * from public.membership_applications', 'an admin at aal1 reads none');
select tests.authenticate_as('admin@example.no', 'aal2');
select results_eq(
  'select name, email, message from public.membership_applications',
  $$values ('Sara'::text, 'sara@example.no'::text, 'Hei!'::text)$$,
  'an admin at aal2 reads the application, trimmed and lower-cased'
);

-- deciding
select tests.authenticate_as('a@example.no');
select throws_ok(
  format('select public.approve_application(%L)', tests.application_id('sara@example.no')),
  '42501', 'not_admin', 'a member cannot approve'
);
select tests.authenticate_as('admin@example.no', 'aal1');
select throws_ok(
  format('select public.approve_application(%L)', tests.application_id('sara@example.no')),
  '42501', 'not_admin', 'an admin at aal1 cannot approve'
);
select tests.authenticate_as('admin@example.no', 'aal2');
select lives_ok(
  format('select public.approve_application(%L)', tests.application_id('sara@example.no')),
  'an admin at aal2 approves'
);
select tests.as_owner();
select results_eq(
  $$select name, surname, birth_year::int, status::text from public.members where email = 'sara@example.no'$$,
  $$values ('Sara'::text, 'Søker'::text, 1990, 'active'::text)$$,
  'approval adds the applicant to the register'
);
select is(
  (select decided_by from public.membership_applications where email = 'sara@example.no'),
  tests.user_id('admin@example.no'),
  'the approval records who decided'
);
select tests.authenticate_as('admin@example.no', 'aal2');
select throws_ok(
  format('select public.approve_application(%L)', tests.application_id('sara@example.no')),
  'P0001', 'not_pending', 'an application cannot be approved twice'
);

-- an existing member applies
select tests.as_anon();
insert into public.membership_applications (name, surname, email, privacy_version)
values ('Anna', 'Igjen', 'a@example.no', '2026-11');
select tests.authenticate_as('admin@example.no', 'aal2');
select throws_ok(
  format('select public.approve_application(%L)', tests.application_id('a@example.no')),
  'P0001', 'already_member', 'approving someone already on the register is refused'
);
select lives_ok(
  format('select public.reject_application(%L)', tests.application_id('a@example.no')),
  'an admin at aal2 rejects'
);

-- retention
select tests.as_owner();
update public.membership_applications set decided_at = now() - interval '31 days' where email = 'sara@example.no';
update public.membership_applications set decided_at = now() - interval '89 days' where email = 'a@example.no';
insert into public.membership_applications (name, surname, email, privacy_version, created_at)
values ('Gammel', 'Søknad', 'stale@example.no', '2026-11', now() - interval '91 days'),
       ('Ny', 'Søknad', 'fresh@example.no', '2026-11', now() - interval '89 days');
select tests.authenticate_as('admin@example.no', 'aal2');
select is(public.purge_expired_applications(), 2, 'an approval older than 30 days and a pending one older than 90 are purged');
select tests.as_owner();
select is(
  (select array_agg(email order by email) from public.membership_applications),
  array['a@example.no', 'fresh@example.no'],
  'a rejection under 90 days and a pending one under 90 days are kept'
);
select tests.as_owner();
select is_empty(
  $$select 1 from public.admin_audit_log
    where table_name = 'membership_applications'
      and (coalesce(new, '{}') ? 'email' or coalesce(old, '{}') ? 'email')$$,
  'the audit log holds decisions, never the applicant''s email'
);

select * from finish();
rollback;
