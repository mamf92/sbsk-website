-- Phase 2 step 1: the member register, membership payments and the admin_session() boundary
-- on every existing policy (docs/plans/phase-2-admin-page.md, "Step 1 migration"; security plan
-- S2b, docs/plans/SECURITY_AND_RELIABILITY.md).
--
-- `members` is the register (board-owned: email, phone, dates, status, admin flag, payments).
-- `profiles` is the member's own presentation (name, photo, bio, locale). Address fields are
-- dropped from both: nothing the club does needs a postal address (gdpr.md, data minimisation).
-- Board members disable rather than delete (status = 'disabled'); erasure is the GDPR function.
--
-- In every policy below, "admin" means public.admin_session(): an active admin at aal2.

-- ---------------------------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------------------------
create type public.member_status as enum ('active', 'disabled');
create type public.payment_method as enum ('vipps', 'manual', 'bank', 'cash');
create type public.payment_status as enum ('pending', 'paid', 'refunded', 'failed');

-- ---------------------------------------------------------------------------------------------
-- members: the register
-- ---------------------------------------------------------------------------------------------
alter table public.members
  drop column address,
  drop column postcode,
  drop column city,
  alter column phone drop not null,
  add column status public.member_status not null default 'active',
  add column member_since date not null default current_date,
  add column disabled_at timestamptz,
  add column disabled_reason text check (char_length(disabled_reason) <= 500),
  add column birth_year smallint check (birth_year between 1900 and 2100),
  add column notes text check (char_length(notes) <= 2000);

update public.members
set member_since = coalesce(created_at::date, current_date),
    email = lower(trim(email)),
    phone = nullif(trim(phone), '');

update public.members set created_at = now() where created_at is null;

alter table public.members
  alter column created_at set not null,
  add constraint members_supabase_id_unique unique (supabase_id),
  add constraint members_supabase_id_fkey
    foreign key (supabase_id) references auth.users (id) on delete set null,
  add constraint members_email_format check (email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  add constraint members_name_length check (char_length(name) between 1 and 80),
  add constraint members_surname_length check (char_length(surname) <= 80),
  add constraint members_phone_length check (char_length(phone) <= 40),
  add constraint members_disabled_consistent check ((status = 'disabled') = (disabled_at is not null));

-- Lower-case and trim on write, so the signup hook's comparison with auth.users.email (which
-- GoTrue already lower-cases) is exact.
create or replace function public.members_normalise()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  new.email := lower(trim(new.email));
  new.phone := nullif(trim(new.phone), '');
  return new;
end;
$$;

revoke execute on function public.members_normalise() from public, anon, authenticated;

create trigger members_normalise
  before insert or update of email, phone on public.members
  for each row execute function public.members_normalise();

-- ---------------------------------------------------------------------------------------------
-- profiles: the member's own presentation
-- ---------------------------------------------------------------------------------------------
drop trigger if exists prevent_admin_escalation_trigger on public.profiles;
drop function if exists public.prevent_admin_escalation();

alter table public.profiles
  drop column address,
  drop column postcode,
  drop column city,
  drop column is_admin,
  add column locale text not null default 'nb' check (locale in ('nb', 'en')),
  add column terms_accepted_version text check (char_length(terms_accepted_version) <= 40),
  add column terms_accepted_at timestamptz,
  add column created_at timestamptz not null default now(),
  add constraint profiles_supabase_id_unique unique (supabase_id),
  add constraint profiles_bio_length check (char_length(bio) <= 500),
  add constraint profiles_name_length check (char_length(name) between 1 and 80),
  add constraint profiles_surname_length check (char_length(surname) <= 80);

-- ---------------------------------------------------------------------------------------------
-- Identity helpers. SECURITY DEFINER so policies can ask about the caller without the caller
-- needing read access to `members`; search_path pinned; anon cannot execute them.
-- ---------------------------------------------------------------------------------------------
create or replace function public.member_is_admin()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.members
    where supabase_id = auth.uid()
      and is_admin = true
      and status = 'active'
  );
$$;

create or replace function public.member_is_active()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.members
    where supabase_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.current_member_id()
returns uuid
language sql
stable
security definer
set search_path to 'public'
as $$
  select id from public.members
  where supabase_id = auth.uid()
    and status = 'active';
$$;

revoke execute on function public.member_is_admin() from public, anon;
revoke execute on function public.member_is_active() from public, anon;
revoke execute on function public.current_member_id() from public, anon;
grant execute on function public.member_is_admin() to authenticated, service_role;
grant execute on function public.member_is_active() to authenticated, service_role;
grant execute on function public.current_member_id() to authenticated, service_role;

-- ---------------------------------------------------------------------------------------------
-- The club can never lock itself out: the last active admin cannot be disabled, demoted or
-- deleted. Raised with a stable message the UI maps to a translated error.
-- ---------------------------------------------------------------------------------------------
create or replace function public.protect_last_admin()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if old.is_admin and old.status = 'active'
     and (tg_op = 'DELETE' or not new.is_admin or new.status <> 'active')
     and not exists (
       select 1 from public.members
       where id <> old.id and is_admin and status = 'active'
     ) then
    raise exception 'last_admin' using
      errcode = 'P0001',
      hint = 'The last active board member cannot be removed, disabled or demoted.';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke execute on function public.protect_last_admin() from public, anon, authenticated;

create trigger protect_last_admin
  before update of is_admin, status or delete on public.members
  for each row execute function public.protect_last_admin();

-- ---------------------------------------------------------------------------------------------
-- Auth hooks: a disabled member cannot create an account; a new account links its register
-- row and starts its profile with the register's name.
-- ---------------------------------------------------------------------------------------------
create or replace function public.hook_restrict_signup_by_email_list()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.email is null or new.email = '' then
    raise exception 'Signup rejected: Email is required';
  end if;

  if not exists (
    select 1 from public.members
    where email = lower(trim(new.email))
      and status = 'active'
  ) then
    raise exception 'Signup rejected: this email is not on the active member register.';
  end if;

  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  m public.members;
begin
  update public.members
  set supabase_id = new.id
  where email = lower(trim(new.email))
  returning * into m;

  insert into public.profiles (supabase_id, email, name, surname)
  values (new.id, lower(new.email), m.name, m.surname)
  on conflict (supabase_id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.hook_restrict_signup_by_email_list() from public, anon, authenticated;

-- A member edits their own presentation; only an admin (or the auth sync trigger, which runs
-- as the table owner) may change which account a profile belongs to or its email.
create or replace function public.profiles_protect_columns()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if current_user in ('anon', 'authenticated') and not public.admin_session() then
    if new.supabase_id is distinct from old.supabase_id
       or new.email is distinct from old.email
       or new.created_at is distinct from old.created_at then
      raise exception 'Not allowed to change these profile fields' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.profiles_protect_columns() from public, anon;

create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute function public.profiles_protect_columns();

-- ---------------------------------------------------------------------------------------------
-- Payments: one row per payment event. Phase 2 ticks them by hand; Vipps (phase 6) inserts
-- on CAPTURED into the same table.
-- ---------------------------------------------------------------------------------------------
create table public.membership_payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members (id) on delete set null,
  payer_name text not null check (char_length(payer_name) between 1 and 200),
  season smallint not null check (season between 2020 and 2100),
  amount_nok integer not null check (amount_nok >= 0),
  method public.payment_method not null,
  status public.payment_status not null default 'paid',
  paid_at timestamptz,
  provider_reference text check (char_length(provider_reference) <= 200),
  marked_by uuid default auth.uid() references auth.users (id) on delete set null,
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  constraint membership_payments_paid_has_date check (status <> 'paid' or paid_at is not null)
);

create unique index membership_payments_provider_reference_key
  on public.membership_payments (provider_reference) where provider_reference is not null;
create index membership_payments_member_season_idx on public.membership_payments (member_id, season);

alter table public.membership_payments enable row level security;

-- "Has this member paid for the current season?" in one place.
create view public.member_season_status with (security_invoker = true) as
  select m.id as member_id,
         s.season,
         coalesce(bool_or(p.status = 'paid'), false) as paid,
         max(p.paid_at) filter (where p.status = 'paid') as paid_at
  from public.members m
  cross join (select extract(year from now())::smallint as season) s
  left join public.membership_payments p on p.member_id = m.id and p.season = s.season
  group by m.id, s.season;

-- What other active members may see of each other (sign-up lists, avatars): no email, no
-- phone, nothing of the register. Runs as its owner on purpose (security_invoker = false):
-- a member has no read access to other people's profiles, and this exposes five columns only,
-- to active members only. Accepted Supabase advisor 0010 (security definer view) for that reason.
create view public.member_directory with (security_invoker = false) as
  select p.supabase_id, p.name, p.surname, p.photo_url, p.bio
  from public.profiles p
  join public.members m on m.supabase_id = p.supabase_id
  where m.status = 'active'
    and public.member_is_active();

-- ---------------------------------------------------------------------------------------------
-- Grants. Explicit, because new tables on this project no longer get Supabase's old blanket
-- grants (event_participants has none live, which broke sign-ups; fixed below).
-- ---------------------------------------------------------------------------------------------
revoke all on public.members, public.profiles from anon, authenticated;
grant select, insert, update on public.members to authenticated;
grant select, update on public.profiles to authenticated;

revoke all on public.membership_payments from public, anon, authenticated;
grant select, insert, update on public.membership_payments to authenticated;

revoke all on public.member_season_status, public.member_directory from public, anon, authenticated;
grant select on public.member_season_status, public.member_directory to authenticated;

grant all on public.members, public.profiles, public.membership_payments to service_role;
grant select on public.member_season_status, public.member_directory to service_role;

revoke all on public.contact_messages from anon, authenticated;
grant insert on public.contact_messages to anon, authenticated;
grant select on public.contact_messages to authenticated;
grant all on public.contact_messages to service_role;

revoke all on public.event_participants from anon, authenticated;
grant select, insert, delete on public.event_participants to authenticated;
grant all on public.event_participants to service_role;

-- ---------------------------------------------------------------------------------------------
-- Policies. Single-purpose; every admin branch is admin_session().
-- ---------------------------------------------------------------------------------------------
drop policy if exists "Admins can view members" on public.members;
drop policy if exists "Admins can create members" on public.members;
drop policy if exists "Admins can update members" on public.members;
drop policy if exists "Admins can delete members" on public.members;

create policy "Members read their own active row"
  on public.members for select to authenticated
  using (supabase_id = (select auth.uid()) and status = 'active');

create policy "Admins read the register"
  on public.members for select to authenticated
  using (public.admin_session());

create policy "Admins add members"
  on public.members for insert to authenticated
  with check (public.admin_session());

create policy "Admins update members"
  on public.members for update to authenticated
  using (public.admin_session())
  with check (public.admin_session());

-- No delete policy: removal is disable; erasure goes through the GDPR function (gdpr.md).

-- Belt and braces: even a future permissive policy cannot let a non-aal2 caller write.
create policy "Register writes need an admin with a second factor"
  on public.members as restrictive for all to authenticated
  using (public.admin_session() or supabase_id = (select auth.uid()))
  with check (public.admin_session());

drop policy if exists "Admins can view all, members can view own" on public.profiles;
drop policy if exists "Admins update all, members update own" on public.profiles;
drop policy if exists "Users create own profile, admins create any" on public.profiles;
drop policy if exists "Admins can delete profiles" on public.profiles;

create policy "Members read their own profile"
  on public.profiles for select to authenticated
  using (supabase_id = (select auth.uid()));

create policy "Admins read profiles"
  on public.profiles for select to authenticated
  using (public.admin_session());

create policy "Active members edit their own profile"
  on public.profiles for update to authenticated
  using (supabase_id = (select auth.uid()) and public.member_is_active())
  with check (supabase_id = (select auth.uid()) and public.member_is_active());

create policy "Admins edit profiles"
  on public.profiles for update to authenticated
  using (public.admin_session())
  with check (public.admin_session());

-- No insert policy (handle_new_user creates the row) and no delete policy (erasure).

create policy "Members read their own payments"
  on public.membership_payments for select to authenticated
  using (member_id = public.current_member_id());

create policy "Admins read payments"
  on public.membership_payments for select to authenticated
  using (public.admin_session());

create policy "Admins record payments"
  on public.membership_payments for insert to authenticated
  with check (public.admin_session());

create policy "Admins correct payments"
  on public.membership_payments for update to authenticated
  using (public.admin_session())
  with check (public.admin_session());

drop policy if exists "Admins can read contact messages" on public.contact_messages;
create policy "Admins can read contact messages"
  on public.contact_messages for select to authenticated
  using (public.admin_session());

drop policy if exists "Authenticated members can view event participants" on public.event_participants;
create policy "Active members can view event participants"
  on public.event_participants for select to authenticated
  using (public.member_is_active());

drop policy if exists "Members join events as themselves" on public.event_participants;
create policy "Members join events as themselves"
  on public.event_participants for insert to authenticated
  with check ((select auth.uid()) = supabase_id and public.member_is_active());

drop policy if exists "Members leave events, admins remove any participant" on public.event_participants;
create policy "Members leave events, admins remove any participant"
  on public.event_participants for delete to authenticated
  using ((select auth.uid()) = supabase_id or public.admin_session());

-- ---------------------------------------------------------------------------------------------
-- Audit every admin-managed write, from the database, so no client can skip it.
-- ---------------------------------------------------------------------------------------------
create trigger audit_members
  after insert or update or delete on public.members
  for each row execute function public.log_admin_change();

create trigger audit_membership_payments
  after insert or update or delete on public.membership_payments
  for each row execute function public.log_admin_change();
