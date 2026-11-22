-- The membership card token: generated, unique, readable by its owner and the board only,
-- resolved by the admin lookup only, rotatable by the member, and never stored in the audit log.
begin;
\ir helpers/auth.sql
select plan(13);
select tests.seed();

select tests.as_owner();
select ok(
  (select bool_and(member_card_token ~ '^[0-9a-f]{32}$') from public.members),
  'every member has a 32-hex card token'
);
select is(
  (select count(distinct member_card_token)::int from public.members),
  (select count(*)::int from public.members),
  'card tokens are unique'
);
insert into public.membership_payments (member_id, payer_name, season, amount_nok, method, paid_at)
values (tests.member_id('a@example.no'), 'A', extract(year from now())::smallint, 200, 'manual', now());

create or replace function tests.card_of(p_email text)
returns text
language sql
security definer
set search_path to 'public'
as $$
  select member_card_token from public.members where email = lower(p_email)
$$;
grant execute on all functions in schema tests to anon, authenticated;

-- reading
select tests.authenticate_as('b@example.no');
select is(
  (select member_card_token from public.members where supabase_id = auth.uid()),
  tests.card_of('b@example.no'),
  'a member reads their own card token'
);
select is_empty(
  $$select member_card_token from public.members where supabase_id <> auth.uid()$$,
  'a member cannot read anyone else''s token'
);
select throws_ok(
  format($$select * from public.admin_member_by_card_token(%L)$$, tests.card_of('a@example.no')),
  '42501', 'not_admin', 'a member cannot look a card up'
);

-- the board's lookup
select tests.authenticate_as('admin@example.no', 'aal1');
select throws_ok(
  format($$select * from public.admin_member_by_card_token(%L)$$, tests.card_of('a@example.no')),
  '42501', 'not_admin', 'an admin at aal1 cannot look a card up'
);
select tests.authenticate_as('admin@example.no', 'aal2');
select results_eq(
  format($$select name, status::text, season_paid from public.admin_member_by_card_token(%L)$$, upper(tests.card_of('a@example.no'))),
  $$values ('Anna'::text, 'active'::text, true)$$,
  'an admin at aal2 finds a paid member by card (case-insensitive)'
);
select results_eq(
  format($$select status::text, season_paid from public.admin_member_by_card_token(%L)$$, tests.card_of('disabled@example.no')),
  $$values ('disabled'::text, false)$$,
  'a disabled member is found with their status'
);
select is_empty(
  $$select * from public.admin_member_by_card_token('00000000000000000000000000000000')$$,
  'an unknown code finds nobody'
);

-- rotation
select tests.authenticate_as('b@example.no');
create temporary table old_card on commit drop as select tests.card_of('b@example.no') as token;
grant select on old_card to authenticated;
select isnt(public.rotate_member_card_token(), (select token from old_card), 'rotating gives a new token');
select tests.authenticate_as('admin@example.no', 'aal2');
select is_empty(
  format($$select * from public.admin_member_by_card_token(%L)$$, (select token from old_card)),
  'the old code no longer resolves'
);
select tests.authenticate_as('disabled@example.no');
select throws_ok('select public.rotate_member_card_token()', '42501', 'not_member', 'a disabled member cannot rotate');

select tests.as_owner();
select is_empty(
  $$select 1 from public.admin_audit_log
    where coalesce(new ->> 'member_card_token', old ->> 'member_card_token') ~ '^[0-9a-f]{32}$'$$,
  'the audit log never holds a card token'
);

select * from finish();
rollback;
