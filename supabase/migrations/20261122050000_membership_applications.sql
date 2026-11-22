-- Phase 3 step 7: "Bli medlem" applications (docs/plans/phase-3-members.md, "Membership
-- applications").
--
-- Anyone can apply; nobody but the board can read an application. The board approves (which
-- adds the person to the register, so they can create their own login with that email) or
-- rejects. Decisions go through two SECURITY DEFINER functions, so there is no update policy.
--
-- Retention (gdpr.md): rejected and withdrawn applications are deleted after 90 days, approved
-- ones after 30 (the register holds the data then), and one left undecided for 90 days counts
-- as abandoned and goes too, so spam cannot pile up. pg_cron is not enabled on the project, so
-- purge_expired_applications() runs each time the board opens the member list.

create type public.application_status as enum ('pending', 'approved', 'rejected', 'withdrawn');

create table public.membership_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  surname text not null check (char_length(trim(surname)) between 1 and 80),
  email text not null
    check (char_length(email) <= 320 and email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  birth_year smallint check (birth_year between 1900 and 2100),
  message text check (char_length(message) <= 1000),
  status public.application_status not null default 'pending',
  decided_at timestamptz,
  decided_by uuid references auth.users (id) on delete set null,
  payment_reference text check (char_length(payment_reference) <= 200),
  -- The privacy policy version shown on the form when the person applied.
  privacy_version text not null check (char_length(privacy_version) between 1 and 20)
);

-- One open application per address; a second submit is a no-op for the applicant.
create unique index membership_applications_pending_email_key
  on public.membership_applications (lower(email)) where status = 'pending';
create index membership_applications_status_idx
  on public.membership_applications (status, created_at);

create or replace function public.membership_applications_normalise()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  new.email := lower(trim(new.email));
  new.name := trim(new.name);
  new.surname := trim(new.surname);
  new.message := nullif(trim(new.message), '');
  return new;
end;
$$;

revoke execute on function public.membership_applications_normalise() from public, anon, authenticated;

create trigger membership_applications_normalise
  before insert on public.membership_applications
  for each row execute function public.membership_applications_normalise();

alter table public.membership_applications enable row level security;

revoke all on public.membership_applications from public, anon, authenticated;
grant insert (name, surname, email, birth_year, message, privacy_version)
  on public.membership_applications to anon, authenticated;
grant select on public.membership_applications to authenticated;
grant all on public.membership_applications to service_role;

create policy "Anyone can apply"
  on public.membership_applications for insert to anon, authenticated
  with check (
    status = 'pending'
    and decided_at is null
    and decided_by is null
    and payment_reference is null
  );

create policy "Admins read applications"
  on public.membership_applications for select to authenticated
  using (public.admin_session());

-- Decisions are the board's actions on personal data, so they are audited. Only updates: the
-- audit row of an update holds just the changed columns (status, decided_at, decided_by), while
-- one for a delete would copy the applicant's name and email into a log kept for two years,
-- outliving the retention rule below.
create trigger audit_membership_applications
  after update on public.membership_applications
  for each row execute function public.log_admin_change();

-- ---------------------------------------------------------------------------------------------
-- Decisions
-- ---------------------------------------------------------------------------------------------

-- Adds the applicant to the register and marks the application approved. Raises
-- `already_member` if the email is on the register already (the board then just rejects or
-- leaves it), `not_pending` if someone decided it first.
create or replace function public.approve_application(p_id uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  app public.membership_applications;
  new_member uuid;
begin
  if not public.admin_session() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  select * into app from public.membership_applications where id = p_id for update;
  if not found or app.status <> 'pending' then
    raise exception 'not_pending' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.members where email = app.email) then
    raise exception 'already_member' using errcode = 'P0001';
  end if;

  insert into public.members (name, surname, email, birth_year)
  values (app.name, app.surname, app.email, app.birth_year)
  returning id into new_member;

  update public.membership_applications
  set status = 'approved', decided_at = now(), decided_by = auth.uid()
  where id = p_id;

  return new_member;
end;
$$;

create or replace function public.reject_application(p_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.admin_session() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  update public.membership_applications
  set status = 'rejected', decided_at = now(), decided_by = auth.uid()
  where id = p_id and status = 'pending';
  if not found then
    raise exception 'not_pending' using errcode = 'P0001';
  end if;
end;
$$;

-- Retention, run by the board's member list (see the header). Returns how many rows went.
create or replace function public.purge_expired_applications()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  removed integer;
begin
  if not public.admin_session() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  delete from public.membership_applications
  where (status = 'approved' and decided_at < now() - interval '30 days')
     or (status in ('rejected', 'withdrawn') and coalesce(decided_at, created_at) < now() - interval '90 days')
     or (status = 'pending' and created_at < now() - interval '90 days');
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke execute on function public.approve_application(uuid) from public, anon;
revoke execute on function public.reject_application(uuid) from public, anon;
revoke execute on function public.purge_expired_applications() from public, anon;
grant execute on function public.approve_application(uuid) to authenticated, service_role;
grant execute on function public.reject_application(uuid) to authenticated, service_role;
grant execute on function public.purge_expired_applications() to authenticated, service_role;
