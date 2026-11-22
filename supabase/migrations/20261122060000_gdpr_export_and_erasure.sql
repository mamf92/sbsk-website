-- Phase 3 step 8: GDPR export, erasure and retention (docs/plans/gdpr.md steps 2–4, with the
-- build notes in docs/plans/phase-3-members.md).
--
-- No edge functions (threads cannot deploy them), so everything here is SECURITY DEFINER SQL:
--   export_my_data()             the member's own data as one JSON document (right of access)
--   erase_my_account_check()     what would stop the erasure, asked before photos are removed
--   erase_my_account(confirm)    the member deletes their account (right to erasure); needs a
--                                sign-in under five minutes old, read from the JWT's `amr`
--   gdpr_fresh_sign_in()         lets the page ask for a new code before it starts
--   admin_export_member_data()   the same export, for a member who asks the board by email
--   admin_erase_member()         the same erasure, for the board (typed name confirms)
--   run_retention()              the nightly jobs; pg_cron is off, so the board's member list
--                                runs it, like purge_expired_applications()
--
-- Storage is not touched here: Supabase refuses direct deletes from storage.objects. The page
-- removes the member's own photos through the storage API before it calls the erasure; for the
-- board's erasures, the functions return the erased login ids and the board's browser removes
-- those folders (the "Admins delete profile images" policy below).
-- No confirmation email either (no mail provider yet); the page says what was deleted instead.

-- ---------------------------------------------------------------------------------------------
-- Ledgers
-- ---------------------------------------------------------------------------------------------

-- Proof that an erasure happened, without saying who: sha256 of members.id. A restored backup
-- re-applies these (gdpr.md step 5). Built-in sha256(), the same hash as pgcrypto's digest()
-- without needing the extension. Kept one year (run_retention()).
create table public.erasure_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  subject_hash text not null check (subject_hash ~ '^[0-9a-f]{64}$'),
  trigger text not null check (trigger in ('self', 'admin_request', 'retention'))
);

-- Exports asked for, to rate-limit them and so the board can show a request was answered.
-- Erased with the member.
create table public.gdpr_requests (
  id bigint generated always as identity primary key,
  member_id uuid not null references public.members (id) on delete cascade,
  kind text not null check (kind in ('export', 'admin_export')),
  at timestamptz not null default now()
);

create index gdpr_requests_member_idx on public.gdpr_requests (member_id, at desc);

alter table public.erasure_log enable row level security;
alter table public.gdpr_requests enable row level security;

-- Only these functions write or read them.
revoke all on public.erasure_log, public.gdpr_requests from public, anon, authenticated;
grant all on public.erasure_log, public.gdpr_requests to service_role;

-- ---------------------------------------------------------------------------------------------
-- Fresh sign-in
-- ---------------------------------------------------------------------------------------------

-- True when the newest proof of identity in this session (password, code or authenticator) is
-- under five minutes old. `amr` timestamps survive token refreshes, unlike `iat`, so an
-- unlocked phone left signed in for a week does not count.
create or replace function public.gdpr_fresh_sign_in()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce(
    (
      select max((entry ->> 'timestamp')::bigint)
      from jsonb_array_elements(
        case when jsonb_typeof(auth.jwt() -> 'amr') = 'array' then auth.jwt() -> 'amr' else '[]' end
      ) entry
      where entry ->> 'timestamp' ~ '^\d+$'
    ) >= extract(epoch from now()) - 300,
    false
  );
$$;

revoke execute on function public.gdpr_fresh_sign_in() from public, anon;
grant execute on function public.gdpr_fresh_sign_in() to authenticated, service_role;

-- ---------------------------------------------------------------------------------------------
-- Export
-- ---------------------------------------------------------------------------------------------

-- Everything the club holds about one member. Never the card token (it works like a key at the
-- door), MFA secrets, or anyone else's data. Internal; the two wrappers below decide who asks.
create or replace function public.member_data_export(p_member uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  m public.members;
  doc jsonb;
begin
  select * into m from public.members where id = p_member;
  if not found then
    raise exception 'not_member' using errcode = 'P0002';
  end if;

  doc := jsonb_build_object(
    'generatedAt', now(),
    'format', 'sbsk-export/1',
    'controller', jsonb_build_object('name', 'Stavanger Brettspillklubb', 'email', 'sbsk@hotmail.com'),
    'account', (
      select jsonb_build_object(
        'email', u.email,
        'createdAt', u.created_at,
        'lastSignInAt', u.last_sign_in_at,
        'mfaFactors', coalesce((
          select jsonb_agg(jsonb_build_object('type', f.factor_type))
          from auth.mfa_factors f where f.user_id = u.id
        ), '[]'::jsonb)
      )
      from auth.users u where u.id = m.supabase_id
    ),
    'register', to_jsonb(m) - 'member_card_token',
    'boardNote', (select n.notes from public.member_notes n where n.member_id = m.id),
    'profile', (
      select to_jsonb(p) - 'id' - 'supabase_id'
      from public.profiles p where p.supabase_id = m.supabase_id
    ),
    'eventSignups', coalesce((
      select jsonb_agg(jsonb_build_object('eventId', e.event_id, 'createdAt', e.created_at)
                       order by e.created_at)
      from public.event_participants e where e.supabase_id = m.supabase_id
    ), '[]'::jsonb),
    'checkIns', coalesce((
      select jsonb_agg(jsonb_build_object(
               'eventId', a.event_id, 'eventDate', a.event_date,
               'eventCategory', a.event_category, 'checkedInAt', a.checked_in_at
             ) order by a.event_date)
      from public.attendance a where a.member_id = m.id
    ), '[]'::jsonb),
    'badges', coalesce((
      select jsonb_agg(jsonb_build_object('slug', b.badge_slug, 'awardedAt', b.awarded_at)
                       order by b.awarded_at)
      from public.member_badges b where b.member_id = m.id
    ), '[]'::jsonb),
    'payments', coalesce((
      select jsonb_agg(jsonb_build_object(
               'season', p.season, 'amountNok', p.amount_nok, 'method', p.method,
               'status', p.status, 'paidAt', p.paid_at, 'payerName', p.payer_name,
               'reference', p.provider_reference, 'createdAt', p.created_at
             ) order by p.season)
      from public.membership_payments p where p.member_id = m.id
    ), '[]'::jsonb),
    'applications', coalesce((
      select jsonb_agg(jsonb_build_object(
               'createdAt', a.created_at, 'name', a.name, 'surname', a.surname,
               'email', a.email, 'birthYear', a.birth_year, 'message', a.message,
               'status', a.status, 'decidedAt', a.decided_at
             ) order by a.created_at)
      from public.membership_applications a where lower(a.email) = lower(m.email)
    ), '[]'::jsonb),
    'contactMessages', coalesce((
      select jsonb_agg(jsonb_build_object(
               'createdAt', c.created_at, 'name', c.name, 'message', c.message
             ) order by c.created_at)
      from public.contact_messages c where lower(c.email) = lower(m.email)
    ), '[]'::jsonb),
    -- What the board changed about this member: when, and what kind of change. Not the
    -- snapshots, which can hold the board's own notes and other people's ids.
    'adminActionsAboutMe', coalesce((
      select jsonb_agg(jsonb_build_object('at', l.at, 'table', l.table_name, 'action', l.action)
                       order by l.at)
      from public.admin_audit_log l
      where l.row_id = m.id::text
         or l.old ->> 'member_id' = m.id::text
         or l.new ->> 'member_id' = m.id::text
    ), '[]'::jsonb)
  );
  return doc;
end;
$$;

revoke execute on function public.member_data_export(uuid) from public, anon, authenticated;

-- The member's own copy. One per ten minutes.
create or replace function public.export_my_data()
returns jsonb
language plpgsql
volatile
security definer
set search_path to 'public'
as $$
declare
  me uuid := public.current_member_id();
begin
  if me is null then
    raise exception 'not_member' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.gdpr_requests
    where member_id = me and kind = 'export' and at > now() - interval '10 minutes'
  ) then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  insert into public.gdpr_requests (member_id, kind) values (me, 'export');
  return public.member_data_export(me);
end;
$$;

-- For a member who cannot sign in (disabled, or never had a login) and asks the board.
create or replace function public.admin_export_member_data(p_member uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path to 'public'
as $$
begin
  if not public.admin_session() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if not exists (select 1 from public.members where id = p_member) then
    raise exception 'not_member' using errcode = 'P0002';
  end if;
  insert into public.gdpr_requests (member_id, kind) values (p_member, 'admin_export');
  return public.member_data_export(p_member);
end;
$$;

revoke execute on function public.export_my_data() from public, anon;
revoke execute on function public.admin_export_member_data(uuid) from public, anon;
grant execute on function public.export_my_data() to authenticated, service_role;
grant execute on function public.admin_export_member_data(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------------------------
-- Erasure
-- ---------------------------------------------------------------------------------------------

-- The headcount's touch trigger stamped every update with auth.uid(), including the cascade
-- that nulls `updated_by` when that login is deleted, which put the deleted id straight back
-- and failed the foreign key. Stamp only real changes to the count.
create or replace function public.event_headcounts_touch()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if new.guests is not distinct from old.guests and new.event_date is not distinct from old.event_date then
    return new;
  end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

revoke execute on function public.event_headcounts_touch() from public, anon, authenticated;

-- One transaction, in the order gdpr.md step 3 gives. Internal; the wrappers below decide who
-- may call it. Refuses the last active admin (protect_last_admin() raises `last_admin`).
-- Returns the erased login's id (null for a register-only member), whose photo folder the
-- caller then removes.
create or replace function public.erase_member(p_member uuid, p_trigger text)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  m public.members;
  k text;
begin
  select * into m from public.members where id = p_member for update;
  if not found then
    raise exception 'not_member' using errcode = 'P0002';
  end if;

  -- 1. Check-ins become anonymous guests, so the event's headcount stays right.
  insert into public.event_headcounts (event_id, event_date, guests)
  select event_id, min(event_date), count(*)
  from public.attendance where member_id = m.id
  group by event_id
  on conflict (event_id) do update set guests = public.event_headcounts.guests + excluded.guests;
  delete from public.attendance where member_id = m.id;

  -- 2. Everything else that is only about them.
  delete from public.member_badges where member_id = m.id;
  if m.supabase_id is not null then
    delete from public.event_participants where supabase_id = m.supabase_id;
  end if;
  delete from public.membership_applications where lower(email) = lower(m.email);
  delete from public.contact_messages where lower(email) = lower(m.email);

  -- 3. Payments are bookkeeping (five years): unlinked, payer name and amount kept.
  update public.membership_payments set member_id = null where member_id = m.id;

  -- 4. The person: profile, register row (member_notes and gdpr_requests cascade), login.
  if m.supabase_id is not null then
    delete from public.profiles where supabase_id = m.supabase_id;
  end if;
  delete from public.members where id = m.id;
  if m.supabase_id is not null then
    delete from auth.users where id = m.supabase_id;
  end if;

  -- 5. Last, because the deletes above wrote audit rows of their own: blank every personal key
  --    in every audit row about them, and forget them as the actor.
  foreach k in array public.audit_personal_keys() loop
    update public.admin_audit_log l
    set old = case when l.old ? k and l.old -> k <> 'null'::jsonb
                   then jsonb_set(l.old, array[k], '"[slettet]"') else l.old end,
        new = case when l.new ? k and l.new -> k <> 'null'::jsonb
                   then jsonb_set(l.new, array[k], '"[slettet]"') else l.new end
    where (l.row_id = m.id::text
           or l.old ->> 'member_id' = m.id::text
           or l.new ->> 'member_id' = m.id::text
           or (m.supabase_id is not null
               and (l.old ->> 'supabase_id' = m.supabase_id::text
                    or l.new ->> 'supabase_id' = m.supabase_id::text)))
      and ((l.old ? k and l.old -> k <> 'null'::jsonb) or (l.new ? k and l.new -> k <> 'null'::jsonb));
  end loop;
  if m.supabase_id is not null then
    update public.admin_audit_log set actor = null where actor = m.supabase_id;
    -- Their login id, in the snapshots: the link on their own rows, and as the author of other
    -- rows' changes (checked in by, marked paid by, ...). Also in the board's notes, which has
    -- no foreign key to null it.
    foreach k in array array['supabase_id', 'updated_by', 'checked_in_by', 'marked_by', 'decided_by', 'awarded_by'] loop
      update public.admin_audit_log l
      set old = case when l.old ->> k = m.supabase_id::text
                     then jsonb_set(l.old, array[k], 'null') else l.old end,
          new = case when l.new ->> k = m.supabase_id::text
                     then jsonb_set(l.new, array[k], 'null') else l.new end
      where l.old ->> k = m.supabase_id::text or l.new ->> k = m.supabase_id::text;
    end loop;
    update public.member_notes set updated_by = null where updated_by = m.supabase_id;
  end if;

  -- 6. The ledger: that someone was erased, never who.
  insert into public.erasure_log (subject_hash, trigger)
  values (encode(sha256(convert_to(m.id::text, 'UTF8')), 'hex'), p_trigger);
  return m.supabase_id;
end;
$$;

revoke execute on function public.erase_member(uuid, text) from public, anon, authenticated;
grant execute on function public.erase_member(uuid, text) to service_role;

-- Raises what would stop "Slett kontoen min" (`not_member`, `reauth_required`, `last_admin`)
-- and returns the member id otherwise. The page asks this before it removes any photo, so a
-- refused erasure leaves the account exactly as it was.
create or replace function public.erase_my_account_check()
returns uuid
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  m public.members;
begin
  -- Not current_member_id(): that is active members only, and a member the board has just
  -- disabled is still signed in until the token runs out.
  select * into m from public.members where supabase_id = auth.uid();
  if not found then
    raise exception 'not_member' using errcode = '42501';
  end if;
  if not public.gdpr_fresh_sign_in() then
    raise exception 'reauth_required' using errcode = '42501';
  end if;
  -- The same rule protect_last_admin() enforces on the delete, asked early.
  if m.is_admin and m.status = 'active' and not exists (
    select 1 from public.members where id <> m.id and is_admin and status = 'active'
  ) then
    raise exception 'last_admin' using errcode = 'P0001';
  end if;
  return m.id;
end;
$$;

-- "Slett kontoen min". The page types SLETT and, when the sign-in is older than five minutes,
-- asks for a new code first (`reauth_required`).
create or replace function public.erase_my_account(p_confirm text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  me uuid;
begin
  if upper(trim(coalesce(p_confirm, ''))) not in ('SLETT', 'DELETE') then
    raise exception 'confirm_mismatch' using errcode = 'P0001';
  end if;
  me := public.erase_my_account_check();
  perform public.erase_member(me, 'self');
end;
$$;

-- The board, for a member who asks by email or has no login. Typing the member's full name
-- confirms. Not for erasing yourself: that is the member page, with its fresh sign-in.
-- Returns the erased login id, for the board's browser to remove the photo folder.
create or replace function public.admin_erase_member(p_member uuid, p_confirm_name text)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  m public.members;
begin
  if not public.admin_session() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  select * into m from public.members where id = p_member;
  if not found then
    raise exception 'not_member' using errcode = 'P0002';
  end if;
  if m.supabase_id is not distinct from auth.uid() then
    raise exception 'use_own_page' using errcode = 'P0001';
  end if;
  if lower(regexp_replace(trim(coalesce(p_confirm_name, '')), '\s+', ' ', 'g'))
     <> lower(regexp_replace(trim(m.name || ' ' || m.surname), '\s+', ' ', 'g')) then
    raise exception 'confirm_mismatch' using errcode = 'P0001';
  end if;
  return public.erase_member(p_member, 'admin_request');
end;
$$;

revoke execute on function public.erase_my_account_check() from public, anon;
grant execute on function public.erase_my_account_check() to authenticated, service_role;
revoke execute on function public.erase_my_account(text) from public, anon;
revoke execute on function public.admin_erase_member(uuid, text) from public, anon;
grant execute on function public.erase_my_account(text) to authenticated, service_role;
grant execute on function public.admin_erase_member(uuid, text) to authenticated, service_role;

-- The board removes the photo folder of a member it erased (the login is gone by then, so the
-- owner's own policy no longer applies).
drop policy if exists "Admins delete profile images" on storage.objects;
create policy "Admins delete profile images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'profile-images' and public.admin_session());

-- ---------------------------------------------------------------------------------------------
-- Retention (gdpr.md step 4)
-- ---------------------------------------------------------------------------------------------

-- The nightly jobs, run whenever the board opens the member list (no pg_cron). Returns how many
-- rows each rule removed. Not here yet: payments after five financial years (none are that old
-- before 2032, and deleting one would also take back the supporter badge it earned) and the
-- event registrations of the Vipps phase.
create or replace function public.run_retention()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  applications integer;
  contact integer;
  erasures integer;
  audit integer;
  lapsed integer := 0;
  failed integer := 0;
  logins uuid[] := '{}';
  login uuid;
  m uuid;
begin
  if not public.admin_session() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  applications := public.purge_expired_applications();

  delete from public.contact_messages where created_at < now() - interval '12 months';
  get diagnostics contact = row_count;

  delete from public.erasure_log where at < now() - interval '1 year';
  get diagnostics erasures = row_count;

  delete from public.admin_audit_log where at < now() - interval '2 years';
  get diagnostics audit = row_count;

  -- Disabled for two years: erased. A disabled member is never an active admin, so
  -- protect_last_admin() never stops this.
  -- Each in its own subtransaction: one that fails (another board member's run erased it
  -- first, say) is skipped and counted, and never undoes the purges above.
  for m in
    select id from public.members
    where status = 'disabled' and disabled_at < now() - interval '24 months'
  loop
    begin
      login := public.erase_member(m, 'retention');
      lapsed := lapsed + 1;
      if login is not null then
        logins := logins || login;
      end if;
    exception when others then
      failed := failed + 1;
      raise warning 'run_retention: erasing a lapsed member failed: %', sqlerrm;
    end;
  end loop;

  return jsonb_build_object(
    'applications', applications,
    'contactMessages', contact,
    'erasureLog', erasures,
    'auditLog', audit,
    'lapsedMembers', lapsed,
    'lapsedFailed', failed,
    -- The photo folders the board's browser removes next.
    'erasedLogins', to_jsonb(logins)
  );
end;
$$;

revoke execute on function public.run_retention() from public, anon;
grant execute on function public.run_retention() to authenticated, service_role;
