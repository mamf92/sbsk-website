-- Phase 2: check-in at the door, and the board's view of who signed up
-- (docs/plans/phase-2-admin-page.md, "Step 4 migration — attendance" and "Admin sign-up
-- overview view").
--
-- Check-in is its own table, not a flag on event_participants, because walk-ins check in
-- without signing up. Guests without an account are a number per event, never names.
-- event_date and event_category are snapshots so statistics never depend on Sanity.

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  event_id text not null check (char_length(event_id) between 1 and 200),
  event_date date not null,
  event_category text check (char_length(event_category) <= 80),
  member_id uuid not null references public.members (id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  checked_in_by uuid default auth.uid() references auth.users (id) on delete set null,
  unique (event_id, member_id)
);

create index attendance_member_idx on public.attendance (member_id);
create index attendance_event_date_idx on public.attendance (event_date);

create table public.event_headcounts (
  event_id text primary key check (char_length(event_id) between 1 and 200),
  event_date date not null,
  guests integer not null default 0 check (guests between 0 and 10000),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users (id) on delete set null
);

alter table public.attendance enable row level security;
alter table public.event_headcounts enable row level security;

revoke all on public.attendance, public.event_headcounts from public, anon, authenticated;
grant select, insert, delete on public.attendance to authenticated;
grant select, insert, update on public.event_headcounts to authenticated;
grant all on public.attendance, public.event_headcounts to service_role;

create policy "Members read their own check-ins"
  on public.attendance for select to authenticated
  using (member_id = public.current_member_id());

create policy "Admins read check-ins"
  on public.attendance for select to authenticated
  using (public.admin_session());

create policy "Admins check members in"
  on public.attendance for insert to authenticated
  with check (public.admin_session());

create policy "Admins undo check-ins"
  on public.attendance for delete to authenticated
  using (public.admin_session());

create policy "Admins read guest counts"
  on public.event_headcounts for select to authenticated
  using (public.admin_session());

create policy "Admins add guest counts"
  on public.event_headcounts for insert to authenticated
  with check (public.admin_session());

create policy "Admins change guest counts"
  on public.event_headcounts for update to authenticated
  using (public.admin_session())
  with check (public.admin_session());

create or replace function public.event_headcounts_touch()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

revoke execute on function public.event_headcounts_touch() from public, anon, authenticated;

create trigger event_headcounts_touch
  before update on public.event_headcounts
  for each row execute function public.event_headcounts_touch();

create trigger audit_attendance
  after insert or update or delete on public.attendance
  for each row execute function public.log_admin_change();

create trigger audit_event_headcounts
  after insert or update or delete on public.event_headcounts
  for each row execute function public.log_admin_change();

-- Who signed up for what, for the board. security_invoker, so the underlying tables' RLS
-- applies, and filtered on admin_session() so a member gets no rows at all. The paid
-- registrations half (source 'registration', event-pages plan) is added when that table exists.
-- session_id is a path ('{dayKey}' or '{dayKey}/{sessionKey}'), null for the whole event.
create view public.admin_event_signups with (security_invoker = true) as
  select ep.event_id,
         null::text as session_id,
         m.id as member_id,
         ep.supabase_id,
         nullif(trim(coalesce(p.name, ep.name) || ' ' || coalesce(p.surname, ep.surname)), '') as display_name,
         m.email,
         'rsvp'::text as source,
         null::text as payment_status,
         ep.created_at
  from public.event_participants ep
  left join public.members m on m.supabase_id = ep.supabase_id
  left join public.profiles p on p.supabase_id = ep.supabase_id
  where public.admin_session();

revoke all on public.admin_event_signups from public, anon, authenticated;
grant select on public.admin_event_signups to authenticated, service_role;
