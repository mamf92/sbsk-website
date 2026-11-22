-- Phase 3 step 5: badges (docs/plans/phase-3-members.md, decision 10 and "Badges").
--
-- Definitions are rows in `badges`, seeded here; names and descriptions live in the app
-- (src/content/badges.ts), keyed by slug. Automatic badges are awarded, and revoked again when
-- an undo means the rule no longer holds, by `award_auto_badges()`, called from triggers on the
-- tables the rules read. Manual badges are given and taken back by the board.
--
-- pg_cron is not enabled on the project, so the one time-based rule (membership_years) is
-- re-checked whenever the member opens Min side: `my_badges()` runs the award first.

create type public.badge_kind as enum ('auto', 'manual');

create table public.badges (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  kind public.badge_kind not null,
  -- null for manual badges; { "type": ..., "min": n, ... } for automatic ones.
  rule jsonb,
  sort_order smallint not null default 0,
  active boolean not null default true,
  constraint badges_rule_matches_kind check (
    (kind = 'manual' and rule is null)
    or (kind = 'auto' and rule ? 'type' and (rule ->> 'min')::int >= 1)
  )
);

create table public.member_badges (
  member_id uuid not null references public.members (id) on delete cascade,
  badge_slug text not null references public.badges (slug),
  awarded_at timestamptz not null default now(),
  -- null = awarded automatically (award_auto_badges() writes null explicitly); otherwise the
  -- board member who gave it.
  awarded_by uuid default auth.uid() references auth.users (id) on delete set null,
  primary key (member_id, badge_slug)
);

create index member_badges_badge_idx on public.member_badges (badge_slug);

alter table public.badges enable row level security;
alter table public.member_badges enable row level security;

revoke all on public.badges, public.member_badges from public, anon, authenticated;
grant select on public.badges to authenticated;
grant select, insert, delete on public.member_badges to authenticated;
grant all on public.badges, public.member_badges to service_role;

create policy "Members read badge definitions"
  on public.badges for select to authenticated
  using (public.member_is_active() or public.admin_session());

create policy "Members read their own badges"
  on public.member_badges for select to authenticated
  using (member_id = public.current_member_id());

create policy "Admins read all badges"
  on public.member_badges for select to authenticated
  using (public.admin_session());

create policy "Admins give manual badges"
  on public.member_badges for insert to authenticated
  with check (
    public.admin_session()
    and awarded_by = auth.uid()
    and exists (
      select 1 from public.badges b
      where b.slug = member_badges.badge_slug and b.kind = 'manual' and b.active
    )
  );

create policy "Admins take back manual badges"
  on public.member_badges for delete to authenticated
  using (
    public.admin_session()
    and exists (
      select 1 from public.badges b
      where b.slug = member_badges.badge_slug and b.kind = 'manual'
    )
  );

-- Only the board's own changes are audited; automatic awards follow from check-ins and
-- payments, which are audited already.
create trigger audit_member_badges_insert
  after insert on public.member_badges
  for each row when (new.awarded_by is not null)
  execute function public.log_admin_change();

create trigger audit_member_badges_delete
  after delete on public.member_badges
  for each row when (old.awarded_by is not null)
  execute function public.log_admin_change();

-- ---------------------------------------------------------------------------------------------
-- Rules
-- ---------------------------------------------------------------------------------------------

-- The member's current value for one rule. Rule types:
--   checkins_total       check-ins, all time
--   checkins_category    check-ins at events of `category` (attendance.event_category snapshot)
--   distinct_categories  how many different event categories
--   months_in_a_row      longest run of calendar months with at least one check-in
--   membership_years     whole years since members.member_since
--   paid_seasons         seasons with a paid membership payment
create or replace function public.badge_value(p_member uuid, p_rule jsonb)
returns integer
language plpgsql
stable
security definer
set search_path to 'public'
as $$
begin
  case p_rule ->> 'type'
    when 'checkins_total' then
      return (select count(*) from public.attendance where member_id = p_member);
    when 'checkins_category' then
      return (
        select count(*) from public.attendance
        where member_id = p_member and event_category = p_rule ->> 'category'
      );
    when 'distinct_categories' then
      return (
        select count(distinct event_category) from public.attendance
        where member_id = p_member and event_category is not null
      );
    when 'months_in_a_row' then
      return coalesce((
        select max(run)
        from (
          select count(*) as run
          from (
            select month_index, month_index - row_number() over (order by month_index) as grp
            from (
              select distinct (extract(year from event_date) * 12 + extract(month from event_date))::int
                as month_index
              from public.attendance
              where member_id = p_member
            ) months
          ) numbered
          group by grp
        ) runs
      ), 0)::int;
    when 'membership_years' then
      return coalesce((
        select extract(year from age(current_date, member_since))::int
        from public.members where id = p_member
      ), 0);
    when 'paid_seasons' then
      return (
        select count(distinct season) from public.membership_payments
        where member_id = p_member and status = 'paid'
      );
    else
      return 0;
  end case;
end;
$$;

-- Bring one member's automatic badges in line with the rules: award what now holds, take back
-- what no longer does (a check-in undone by mistake must not leave a badge behind).
create or replace function public.award_auto_badges(p_member uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if p_member is null or not exists (select 1 from public.members where id = p_member) then
    return;
  end if;

  delete from public.member_badges mb
  using public.badges b
  where mb.member_id = p_member
    and mb.badge_slug = b.slug
    and b.kind = 'auto'
    and public.badge_value(p_member, b.rule) < (b.rule ->> 'min')::int;

  insert into public.member_badges (member_id, badge_slug, awarded_by)
  select p_member, b.slug, null
  from public.badges b
  where b.kind = 'auto'
    and b.active
    and public.badge_value(p_member, b.rule) >= (b.rule ->> 'min')::int
  on conflict (member_id, badge_slug) do nothing;
end;
$$;

create or replace function public.award_auto_badges_trigger()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform public.award_auto_badges(old.member_id);
  end if;
  if tg_op in ('INSERT', 'UPDATE') and (tg_op = 'INSERT' or new.member_id is distinct from old.member_id) then
    perform public.award_auto_badges(new.member_id);
  end if;
  return null;
end;
$$;

create or replace function public.award_auto_badges_member_trigger()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  perform public.award_auto_badges(new.id);
  return null;
end;
$$;

revoke execute on function public.badge_value(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.award_auto_badges(uuid) from public, anon, authenticated;
revoke execute on function public.award_auto_badges_trigger() from public, anon, authenticated;
revoke execute on function public.award_auto_badges_member_trigger() from public, anon, authenticated;

create trigger attendance_award_badges
  after insert or update or delete on public.attendance
  for each row execute function public.award_auto_badges_trigger();

create trigger membership_payments_award_badges
  after insert or update or delete on public.membership_payments
  for each row execute function public.award_auto_badges_trigger();

create trigger members_award_badges
  after update of member_since on public.members
  for each row execute function public.award_auto_badges_member_trigger();

-- ---------------------------------------------------------------------------------------------
-- The member's own view: every active badge, earned or not, with progress for automatic ones.
-- ---------------------------------------------------------------------------------------------
create or replace function public.my_badges()
returns table (
  slug text,
  kind public.badge_kind,
  awarded_at timestamptz,
  progress integer,
  target integer
)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  me uuid := public.current_member_id();
begin
  if me is null then
    return;
  end if;
  -- Time-based rules have no table change to fire on; this keeps them current.
  perform public.award_auto_badges(me);
  return query
    select b.slug,
           b.kind,
           mb.awarded_at,
           case when b.kind = 'auto'
             then least(public.badge_value(me, b.rule), (b.rule ->> 'min')::int)
           end,
           (b.rule ->> 'min')::int
    from public.badges b
    left join public.member_badges mb on mb.badge_slug = b.slug and mb.member_id = me
    where b.active or mb.member_id is not null
    order by b.sort_order, b.slug;
end;
$$;

revoke execute on function public.my_badges() from public, anon;
grant execute on function public.my_badges() to authenticated, service_role;

-- ---------------------------------------------------------------------------------------------
-- Seed. Category values match Sanity's event.category options (src/sanity/schemaTypes/
-- eventType.ts), plus 'festival', which check-in writes for Board Game Masters. The plan's
-- all-rounder asked for five categories; there are four, so it is three.
-- ---------------------------------------------------------------------------------------------
insert into public.badges (slug, kind, rule, sort_order) values
  ('first-roll',        'auto',   '{"type": "checkins_total", "min": 1}',                             10),
  ('regular',           'auto',   '{"type": "checkins_total", "min": 10}',                            20),
  ('veteran',           'auto',   '{"type": "checkins_total", "min": 25}',                            30),
  ('fifty',             'auto',   '{"type": "checkins_total", "min": 50}',                            40),
  ('hundred',           'auto',   '{"type": "checkins_total", "min": 100}',                           50),
  ('all-rounder',       'auto',   '{"type": "distinct_categories", "min": 3}',                        60),
  ('tournament-player', 'auto',   '{"type": "checkins_category", "category": "turnering", "min": 1}', 70),
  ('masters',           'auto',   '{"type": "checkins_category", "category": "festival", "min": 1}',  80),
  ('streak-4',          'auto',   '{"type": "months_in_a_row", "min": 4}',                            90),
  ('three-years',       'auto',   '{"type": "membership_years", "min": 3}',                          100),
  ('supporter',         'auto',   '{"type": "paid_seasons", "min": 2}',                              110),
  ('helping-hand',      'manual', null,                                                              200),
  ('board',             'manual', null,                                                              210),
  ('teacher',           'manual', null,                                                              220);

-- Members who already have check-ins and payments get what they have earned.
select public.award_auto_badges(id) from public.members;
