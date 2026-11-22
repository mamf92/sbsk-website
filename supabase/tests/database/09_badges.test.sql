-- Badges: definitions, every automatic rule type (award and revoke on undo), manual badges by
-- the board only, and the member's own my_badges() view.
begin;
\ir helpers/auth.sql
select plan(30);
select tests.seed();

create or replace function tests.badges_of(p_email text)
returns text[]
language sql
security definer
set search_path to 'public'
as $$
  select coalesce(array_agg(badge_slug order by badge_slug), '{}')
  from public.member_badges where member_id = tests.member_id(p_email)
$$;

create or replace function tests.check_in(p_email text, p_event text, p_date date, p_category text)
returns void
language sql
security definer
set search_path to 'public'
as $$
  insert into public.attendance (event_id, event_date, event_category, member_id)
  values (p_event, p_date, p_category, tests.member_id(p_email))
$$;
grant execute on all functions in schema tests to anon, authenticated;

-- Seeded categories must be ones the site can produce: Sanity's event.category options plus
-- 'festival' from check-in. A renamed category in the schema must be renamed here too
-- (src/content/badges.test.ts compares this list with the schema file).
select is_empty(
  $$select rule ->> 'category' from public.badges
    where rule ? 'category'
      and rule ->> 'category' not in ('spillkveld', 'turnering', 'annet', 'festival')$$,
  'every seeded category exists on the site'
);

-- checkins_total + checkins_category + distinct_categories
select tests.as_owner();
select tests.check_in('a@example.no', 'evt-1', date '2026-01-10', 'turnering');
select is(tests.badges_of('a@example.no'), array['first-roll', 'tournament-player'], 'a first check-in at a tournament awards two badges');
select tests.check_in('a@example.no', 'evt-2', date '2026-02-10', 'spillkveld');
select tests.check_in('a@example.no', 'bgm-xix', date '2026-03-10', 'festival');
select ok('all-rounder' = any(tests.badges_of('a@example.no')), 'three categories award all-rounder');
select ok('masters' = any(tests.badges_of('a@example.no')), 'a festival check-in awards masters');
select ok(not ('streak-4' = any(tests.badges_of('a@example.no'))), 'three months in a row is not yet a streak');

-- months_in_a_row: a gap breaks the run
select tests.check_in('a@example.no', 'evt-5', date '2026-05-10', 'spillkveld');
select ok(not ('streak-4' = any(tests.badges_of('a@example.no'))), 'a gap month breaks the streak');
select tests.check_in('a@example.no', 'evt-4', date '2026-04-10', 'spillkveld');
select ok('streak-4' = any(tests.badges_of('a@example.no')), 'filling the gap makes five months in a row');

-- revoke on undo, through the admin's own delete
select tests.authenticate_as('admin@example.no', 'aal2');
delete from public.attendance where event_id = 'evt-1' and member_id = tests.member_id('a@example.no');
select tests.as_owner();
select ok(not ('tournament-player' = any(tests.badges_of('a@example.no'))), 'undoing the only tournament check-in takes the badge back');
select ok('first-roll' = any(tests.badges_of('a@example.no')), 'a badge that still holds is kept');
select ok('streak-4' = any(tests.badges_of('a@example.no')), 'February to May is still four in a row');

-- regular at ten
select tests.check_in('b@example.no', 'evt-r' || n, date '2025-01-01' + n, 'spillkveld') from generate_series(1, 9) n;
select ok(not ('regular' = any(tests.badges_of('b@example.no'))), 'nine check-ins is not regular');
select tests.check_in('b@example.no', 'evt-r10', date '2025-01-11', 'spillkveld');
select ok('regular' = any(tests.badges_of('b@example.no')), 'ten check-ins is regular');

-- paid_seasons
insert into public.membership_payments (member_id, payer_name, season, amount_nok, method, paid_at)
values (tests.member_id('b@example.no'), 'B', 2025, 200, 'manual', now());
select ok(not ('supporter' = any(tests.badges_of('b@example.no'))), 'one paid season is not supporter');
insert into public.membership_payments (member_id, payer_name, season, amount_nok, method, paid_at)
values (tests.member_id('b@example.no'), 'B', 2026, 200, 'manual', now());
select ok('supporter' = any(tests.badges_of('b@example.no')), 'two paid seasons is supporter');
update public.membership_payments set status = 'refunded', paid_at = null
where member_id = tests.member_id('b@example.no') and season = 2026;
select ok(not ('supporter' = any(tests.badges_of('b@example.no'))), 'a refund takes supporter back');

-- membership_years (no table change fires it: my_badges() re-checks)
update public.members set member_since = current_date - interval '3 years 1 day'
where email = 'b@example.no';
select ok('three-years' = any(tests.badges_of('b@example.no')), 'changing member_since re-checks the years badge');

-- my_badges()
select tests.authenticate_as('b@example.no');
select is((select count(*)::int from public.my_badges()), 14, 'a member sees every active badge');
select is(
  (select progress from public.my_badges() where slug = 'veteran'), 10,
  'progress counts toward a locked badge'
);
select is(
  (select progress from public.my_badges() where slug = 'first-roll'), 1,
  'progress is capped at the target'
);
select ok(
  (select awarded_at is not null from public.my_badges() where slug = 'regular'),
  'an earned badge has its date'
);
select tests.authenticate_as('disabled@example.no');
select is_empty('select * from public.my_badges()', 'a disabled member gets no badges');
select tests.as_anon();
select throws_ok('select * from public.my_badges()', '42501', null, 'anon cannot call my_badges');

-- reading
select tests.authenticate_as('a@example.no');
select is(
  (select count(*)::int from public.member_badges where member_id <> public.current_member_id()), 0,
  'a member reads only their own badges'
);

-- manual badges
select throws_ok(
  format(
    $$insert into public.member_badges (member_id, badge_slug, awarded_by) values (%L, 'teacher', auth.uid())$$,
    tests.member_id('a@example.no')
  ),
  '42501', null, 'a member cannot give themself a badge'
);
select tests.authenticate_as('admin@example.no', 'aal1');
select throws_ok(
  format(
    $$insert into public.member_badges (member_id, badge_slug, awarded_by) values (%L, 'teacher', auth.uid())$$,
    tests.member_id('a@example.no')
  ),
  '42501', null, 'an admin at aal1 cannot give a badge'
);
select tests.authenticate_as('admin@example.no', 'aal2');
select throws_ok(
  format(
    $$insert into public.member_badges (member_id, badge_slug, awarded_by) values (%L, 'hundred', auth.uid())$$,
    tests.member_id('a@example.no')
  ),
  '42501', null, 'an admin cannot hand out an automatic badge'
);
select lives_ok(
  format(
    $$insert into public.member_badges (member_id, badge_slug) values (%L, 'teacher')$$,
    tests.member_id('a@example.no')
  ),
  'an admin at aal2 gives a manual badge'
);
delete from public.member_badges where badge_slug = 'first-roll';
select tests.as_owner();
select ok('first-roll' = any(tests.badges_of('a@example.no')), 'an admin cannot take back an automatic badge');
select is(
  (select count(*)::int from public.admin_audit_log where table_name = 'member_badges'), 1,
  'giving a manual badge is audited'
);
select is(
  (select awarded_by from public.member_badges where badge_slug = 'teacher'),
  tests.user_id('admin@example.no'),
  'a manual badge records who gave it'
);

select * from finish();
rollback;
