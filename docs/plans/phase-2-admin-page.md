# Plan — Phase 2: Admin page (styreportal)

Status: planned · Owner: unassigned · Depends on: [i18n foundation](i18n.md), the security
plan's admin MFA (see "Prerequisites") · Followed by: [phase 3](phase-3-members.md) ·
Data rules: [gdpr.md](gdpr.md)

This plan is written to be picked up cold by an implementing agent. Read "Current state" before
writing any code: the repo already has a board portal, and this phase rebuilds it rather than
starting from nothing.

## Goal

A board member signs in (with a second factor), lands on one page that has:

1. **Their own profile** — the same header, profile edit and personal calendar a regular member
   gets in phase 3 (built here first, reused there).
2. **Upcoming events and who signed up** — the next events from Sanity, each with its sign-up
   count, the list of names, and paid status where the event takes payment.
3. **Members** — the membership register: search, add, edit, disable/re-enable, make or remove
   admin, and this season's payment status with a manual "paid" tick.
4. **Check-in** — a door mode, usable on a phone, to tick members in at an event. Check-ins feed
   every statistic in phase 3.
5. **Statistics** — attendance and membership numbers the board needs for annual reports and
   grant applications.

Everything an admin can do is enforced in the database (RLS) or in an edge function that checks
admin status itself. The UI hiding a button is never the boundary.

## Current state (verified 2026-11-11 against `redesign`)

- Routes `/login`, `/lag-medlemsprofil`, `/medlemsportal`, `/styreportal` exist in
  `src/main.tsx` but are compiled out unless `VITE_ENABLE_MEMBER_PORTAL=true`
  (`src/utils/featureFlags.ts`, #213).
- `boardPortalLoader` (`src/loaders/board-portal-loader.ts`) redirects signed-out users to
  `/login?reason=not_authenticated` and non-admins to `/medlemsportal?reason=not_admin`, by
  treating a permission-denied error from `getMembers()` as "not admin".
- `src/components/sections/BoardPortalSection/` has `MemberForm` (create/edit a `members` row),
  `MemberSearchList` (client-side search via `useMemberSearch`), `ProfileCard`, `PortalHeader`.
- Admin status: `public.member_is_admin()` (SECURITY DEFINER, reads `members.is_admin` for
  `auth.uid()`), see `supabase/migrations/20260809200650_harden_rls_admin_boundary.sql` and
  `20261107093420_revoke_anon_member_is_admin.sql`. The client asks it through
  `src/supabase/queryHelpers/isBoardAdmin.ts`.
- Tables in `public` (all RLS on, **0 rows** as of 2026-11-07, so breaking changes are free):
  `members`, `profiles`, `event_participants`, `contact_messages`.
  - `members`: `id, supabase_id, email, name, surname, address, postcode, city, phone, is_admin, created_at`.
  - `profiles`: `id (bigint identity), supabase_id, email, name, surname, address, postcode, city, photo_url, bio, is_admin (frozen), created_at`.
  - `event_participants`: `event_id (Sanity _id), supabase_id → auth.users on delete cascade, name, surname, photo_url snapshot`.
- Auth hooks/triggers exist in the database but **not** in `supabase/migrations/`:
  `handle_new_user()` (creates a profile on sign-up), `hook_restrict_signup_by_email_list()`
  (a before-user-created hook that only lets emails on the `members` list sign up),
  `sync_profile_email_on_auth_update()`. **Step 0 dumps them into a migration** so they are
  reviewable and testable.
- Events live in Sanity (`event` type, `src/sanity/schemaTypes/eventType.ts`): `title`,
  `category`, `eventStartTime`, `eventEndTime`, `location`, `hasDetailPage`, `slug`,
  `schedule[]`, `signupUrl`. The event-pages plan (`docs/plans/` — Board Game Masters) adds
  levels and paid registrations; this plan only reads them.
- Email: Supabase's built-in SMTP only delivers to the project's own team addresses and is
  rate-limited to a handful per hour. **Invites and OTP codes need custom SMTP (Resend, sender
  on the club's domain)** — see "Prerequisites".

## Prerequisites (owner in brackets)

| Item                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Blocks           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| [security plan, `SECURITY_AND_RELIABILITY.md`] Admin MFA: TOTP enrolment (`/to-faktor/oppsett`) and challenge (`/to-faktor`), `public.admin_session()` (= `member_is_admin()` **and** JWT `aal = 'aal2'`), `src/loaders/requireAdminSession.ts`, and `requireAdmin()` in `supabase/functions/_shared/auth.ts`. `member_is_admin()` stays an identity probe that works at aal1, so the client can tell an admin to enter their code. **Every admin branch in this plan's RLS, RPCs and edge functions uses `admin_session()`, never `member_is_admin()`.** | Step 2 onward    |
| [security plan] "Database tests" CI job (`supabase start` + `supabase test db`), and its baseline migration of the dashboard-created tables (S4.1). This plan adds tests to `supabase/tests/*.test.sql`.                                                                                                                                                                                                                                                                                                                                                  | Step 1 tests     |
| [security plan] `public.admin_audit_log` table, its generic audit trigger function, and the 2-year pg_cron purge. This plan attaches the trigger to its own new tables.                                                                                                                                                                                                                                                                                                                                                                                   | Step 1           |
| [Martin] Custom SMTP: Resend account, domain verified, SMTP credentials entered in Supabase → Auth → SMTP. Sender e.g. `noreply@<club domain>`, reply-to the club inbox.                                                                                                                                                                                                                                                                                                                                                                                  | Step 4 (invites) |
| [Martin] Supabase DPA accepted in the dashboard (Organization → Legal). See [gdpr.md](gdpr.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Launch           |
| [i18n plan] i18next set up; new strings go into `admin.json` / `member.json` from the start.                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Step 3 onward    |

If MFA is not ready when step 2 lands, use `admin_session()` anyway (define it in this phase's
migration if the security PR has not merged; the definitions must be identical): admin features
then fail closed (nobody has an aal2 session) rather than open.

## Decisions

| #   | Decision                                                                                                                                                                                                                                                                                                                                                         |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Two routes, shared top.** `/medlemsportal` is "Min side" for everyone. `/styreportal` is the admin page: it renders the same `MemberDashboardTop` (profile header + profile edit + personal calendar) and then the admin sections. The header's "Min side" link points an admin to `/styreportal`.                                                             |
| 2   | Admin sections are **nested routes** under `/styreportal` so the door check-in can be bookmarked on a phone: `/styreportal` (oversikt), `/styreportal/medlemmer`, `/styreportal/innsjekk`, `/styreportal/innsjekk/:eventId`, `/styreportal/statistikk`. Norwegian slugs, as `CLAUDE.md` requires.                                                                |
| 3   | **`members` is the register, `profiles` is the person's own presentation.** Register data (email, phone, membership dates, status, admin flag, payment) is admin-owned. Profile data (display name, photo, bio, locale) is member-owned. Address fields are **dropped** from both (data minimisation — nothing in the club needs a postal address; see gdpr.md). |
| 4   | **Disable, don't delete**, when the board removes someone: `members.status = 'disabled'`, the auth user is banned, sessions revoked, history kept. Full erasure is a separate action (member's own request, or the retention job) — see gdpr.md.                                                                                                                 |
| 5   | Every RLS policy that grants a member data access also requires the member to be **active** (`public.member_is_active()`), so a disabled member's still-valid JWT (up to 1 h) reads nothing.                                                                                                                                                                     |
| 6   | Privileged operations that touch `auth.users` (ban, unban, invite, sign-out-everywhere) go through **one edge function, `admin-members`**, which re-checks admin status with the caller's JWT and only then uses the service role. The service-role key never leaves Supabase.                                                                                   |
| 7   | **Every admin write is audit-logged** in `admin_audit_log` by a database trigger, not by the client, so it cannot be skipped.                                                                                                                                                                                                                                    |
| 8   | Payment status is **per season** (calendar year). Phase 2 supports a manual tick; Vipps (phase 6 plan) writes to the same `membership_payments` table.                                                                                                                                                                                                           |
| 9   | Check-in is a **separate `attendance` table**, not a flag on `event_participants`, because walk-ins check in without having signed up. Guests without accounts are a **number** per event, not names.                                                                                                                                                            |
| 10  | The last active admin cannot be disabled, demoted or deleted (database-enforced), so the club can never lock itself out.                                                                                                                                                                                                                                         |
| 11  | The board portal gets its own flag, `VITE_ENABLE_BOARD_PORTAL`, so phase 2 can go live for the board (with `/login`) while the member-facing routes stay off until phase 3.                                                                                                                                                                                      |

## Data model

One migration per step below; name files with the timestamp the remote gives back from
`list_migrations` (see the memory note in `.claude/skills/sbsk-supabase-query`). Put a header
comment on each, in the style of the existing migrations: what, why, which issue.

### Step 0 migration — capture what exists

**Owned by the security plan (S4.1).** If it has merged, skip this step. Otherwise:
`supabase/migrations/<ts>_capture_auth_hooks.sql`: the current definitions of
`handle_new_user()`, `hook_restrict_signup_by_email_list()`, `sync_profile_email_on_auth_update()`,
their triggers, and the `members`/`profiles` table DDL and policies, exactly as they are live.
Obtain with `select pg_get_functiondef('public.handle_new_user'::regprocedure);` and
`pg_dump --schema-only` equivalents through the Supabase MCP. No behaviour change. This is the
baseline the later migrations edit, and the first pgTAP tests pin it.

### Step 1 migration — register, status, payments, audit

```sql
-- Enums
create type public.member_status as enum ('active', 'disabled');
create type public.payment_method as enum ('vipps', 'manual', 'bank', 'cash');
create type public.payment_status as enum ('pending', 'paid', 'refunded', 'failed');

-- members: the register
alter table public.members
  drop column address, drop column postcode, drop column city,
  add column status public.member_status not null default 'active',
  add column member_since date not null default current_date,
  add column disabled_at timestamptz,
  add column disabled_reason text check (char_length(disabled_reason) <= 500),
  add column birth_year smallint check (birth_year between 1900 and extract(year from now())::int),
  add column notes text check (char_length(notes) <= 2000),      -- admin-only note
  add constraint members_email_unique unique (email),
  add constraint members_supabase_id_unique unique (supabase_id),
  add constraint members_email_format check (email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  add constraint members_disabled_consistent
    check ((status = 'disabled') = (disabled_at is not null));
-- Normalise email on write (lower + trim) in a BEFORE trigger, so the signup hook's
-- comparison against auth.users.email (already lower-cased by GoTrue) is exact.

-- profiles: the member's own presentation
alter table public.profiles
  drop column address, drop column postcode, drop column city,
  add column locale text not null default 'nb' check (locale in ('nb', 'en')),
  add column terms_accepted_version text,
  add column terms_accepted_at timestamptz,
  add constraint profiles_supabase_id_unique unique (supabase_id),
  add constraint profiles_bio_length check (char_length(bio) <= 500),
  add constraint profiles_name_length check (char_length(name) between 1 and 80),
  add constraint profiles_surname_length check (char_length(surname) <= 80);
-- profiles.is_admin: drop it. It has been frozen since #100; members.is_admin is the only
-- authority. Drop prevent_admin_escalation() and its trigger in the same migration.

-- Helpers. SECURITY DEFINER + pinned search_path, EXECUTE revoked from public/anon and
-- granted to authenticated only (same pattern as 20261107093420).
create or replace function public.current_member_id() returns uuid ...
  -- select id from members where supabase_id = auth.uid() and status = 'active'
create or replace function public.member_is_active() returns boolean ...
  -- exists(select 1 from members where supabase_id = auth.uid() and status = 'active')
-- member_is_admin(): add `and status = 'active'`. It stays the aal1 identity probe; the aal2
-- requirement lives in admin_session() (security plan), which calls it.

-- Payments: one row per payment event, many per member over the years
create table public.membership_payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members (id) on delete set null,
  payer_name text not null check (char_length(payer_name) between 1 and 200), -- bookkeeping snapshot
  season smallint not null check (season between 2020 and 2100),
  amount_nok integer not null check (amount_nok >= 0),     -- whole kroner
  method public.payment_method not null,
  status public.payment_status not null default 'paid',
  paid_at timestamptz,
  provider_reference text,                                  -- Vipps reference (phase 6)
  marked_by uuid references auth.users (id) on delete set null,
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);
create unique index membership_payments_provider_reference_key
  on public.membership_payments (provider_reference) where provider_reference is not null;
create index on public.membership_payments (member_id, season);

-- "Has this member paid for season X?" as one place to ask
create view public.member_season_status with (security_invoker = true) as
  select m.id as member_id, s.season,
         bool_or(p.status = 'paid') as paid,
         max(p.paid_at) filter (where p.status = 'paid') as paid_at
  from public.members m
  cross join (select extract(year from now())::smallint as season) s
  left join public.membership_payments p on p.member_id = m.id and p.season = s.season
  group by m.id, s.season;

```

Triggers:

- Attach the security plan's audit trigger (AFTER INSERT/UPDATE/DELETE) to `members`,
  `membership_payments` and (step 4) `attendance` / `event_headcounts`. Ask it to log changed
  columns only, and to log `notes` as "changed", never its content.
- `protect_last_admin` (BEFORE UPDATE/DELETE on `members`): raise if the row is the last
  `is_admin = true and status = 'active'` row and the change would remove that.
- `members_email_normalise` (BEFORE INSERT/UPDATE): `new.email := lower(trim(new.email))`.
- Update `hook_restrict_signup_by_email_list()` to also reject `status = 'disabled'`.
- Update `handle_new_user()` to link `members.supabase_id = new.id` by email and to create the
  profile with `name`/`surname` copied from the register row.

RLS (replace all existing `members` policies; keep each policy single-purpose):

| Table                 | select                                                                                                                     | insert                                | update                                                                      | delete                                        |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------- |
| `members`             | own row if active, or admin                                                                                                | admin                                 | admin                                                                       | none (erasure goes through the GDPR function) |
| `profiles`            | own row, or admin, or active member viewing an **active** member's public columns (via the `member_directory` view, below) | none (trigger creates)                | own row (columns: name, surname, bio, photo_url, locale, terms_*), or admin | none                                          |
| `membership_payments` | own (`member_id = current_member_id()`), or admin                                                                          | admin                                 | admin                                                                       | none                                          |
| `admin_audit_log`     | admin                                                                                                                      | none (trigger only, SECURITY DEFINER) | none                                                                        | none                                          |

Column-level protection on `profiles` update: a `BEFORE UPDATE` trigger rejects changes to
`supabase_id`, `email`, `created_at` unless the caller is admin (RLS cannot restrict columns).
On `members`, members have no update policy at all; they edit their name through `profiles`.

In this table and everywhere below, **"admin" means `public.admin_session()`**.

`member_directory` view (`security_invoker = false`, owned by postgres, `select` granted to
`authenticated`, filtered `where public.member_is_active()` and only active members): exposes
`supabase_id, name, surname, photo_url, bio` and nothing else. This is what other members see
(sign-up lists, avatars). It replaces the photo/name snapshot that `event_participants` stores
today — see phase 3 step 4.

### Step 4 migration — attendance

```sql
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,                          -- Sanity event _id
  event_date date not null,                        -- snapshot: stats must not depend on Sanity
  event_category text,                             -- snapshot, for badges ("tried 5 categories")
  member_id uuid references public.members (id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  checked_in_by uuid references auth.users (id) on delete set null,
  unique (event_id, member_id)
);
create table public.event_headcounts (
  event_id text primary key,
  event_date date not null,
  guests integer not null default 0 check (guests between 0 and 10000),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);
```

RLS: `attendance` select own rows or admin; insert/delete admin only. `event_headcounts` admin
only. Erasure **deletes** a member's attendance rows and adds the count to
`event_headcounts.guests` first, so event totals stay right without keeping who was there (see
gdpr.md).

### Admin sign-up overview view

`public.admin_event_signups` (security_invoker, so RLS on the underlying tables applies; only
admins get rows): a `union all` of `event_participants` (source `'rsvp'`, payment_status null)
and the event-pages plan's paid registrations table (source `'registration'`), joined to
`member_directory` for names. Columns: `event_id, session_id, member_id, display_name, email,
source, payment_status, created_at`. The registrations half maps the event-pages plan's
`event_registrations(id, event_id, session_id, supabase_id, name, email, status, payment_reference,
created_at)`: `session_id` is a **path** — `'{dayKey}'` for a whole festival day,
`'{dayKey}/{sessionKey}'` for one session, null for the whole event (Sanity `_key`s are only
unique within their array) — and `status` (`pending_payment | confirmed | cancelled | refunded`)
becomes `payment_status`. Group and label sessions by splitting the path, never by the bare
key. If the registrations table does not exist yet when this step lands, ship the view with the
`rsvp` half only and add the other half in the event-pages PR.

## Edge function: `admin-members`

`supabase/functions/admin-members/index.ts`. Follow the shape of
`update-event-participants/index.ts`, but move CORS into `supabase/functions/_shared/cors.ts`
(origins from an `ALLOWED_ORIGINS` secret, comma-separated) and use it from both functions.

Request: `POST { action, memberId, ... }`, validated with Zod (`npm:zod@4`). Actions:

| action     | effect                                                                                                                                                                                                                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `invite`   | Member row must exist and be active. `auth.admin.inviteUserByEmail(email, { redirectTo: <site>/lag-medlemsprofil })` if no auth user yet; otherwise 409.                                                                                                                                                 |
| `disable`  | `members.status = 'disabled'`, `disabled_at = now()`, reason; `auth.admin.updateUserById(id, { ban_duration: '876000h' })`; `auth.admin.signOut` for all sessions of that user (via `delete from auth.sessions where user_id = …` in an RPC owned by postgres, since supabase-js only signs out by JWT). |
| `enable`   | Reverse of the above: `ban_duration: 'none'`, status active.                                                                                                                                                                                                                                             |
| `setAdmin` | Set `is_admin`. Refuses if the target has no verified TOTP factor (`auth.mfa_factors` where `status = 'verified'`), so nobody becomes admin without 2FA.                                                                                                                                                 |

Order of checks, all before any service-role call: method is POST → `requireAdmin(req)` from
`_shared/auth.ts` (security plan: verifies the JWT with a user-scoped client and calls
`admin_session()` on it, so aal2 and active status are both enforced) → body validates →
target exists. Reply with
`{ ok: true }` or a status code and a stable error code (`not_admin`, `last_admin`,
`no_mfa`, `not_found`, `already_invited`) the UI maps to translated messages. Never echo
Postgres error text to the client.

Plain create/edit of a member row and payment ticks go **straight through PostgREST with RLS**
(query helpers), not through the function — they need no service role.

## UI

All new shared pieces go in `src/components/ui/` via the **sbsk-component** skill, with tests.
Sections in `src/components/sections/AdminPortalSection/`. Styling from the redesign roles only
(`docs/DESIGN_LANGUAGE.md`, decision log steps 2–11): square corners, `shadow-card` on cards,
`Button` variants `primary | secondary | ghost | danger`.

### Shared with phase 3 (build here)

- `MemberDashboardTop` (section): navy band (`on-dark`) with `Avatar` (size xl), full name,
  "Medlem siden {{date}}", badge count chip, and three stat tiles (check-ins, events joined,
  this season's payment status). Phase 2 shows real numbers for check-ins once step 4 lands;
  until then the tile shows "–".
- `ProfileEditDialog` (section): reuse and restyle `ProfileForm`: name, surname, bio (textarea,
  500 chars with live counter), photo (upload → `uploadImage`, preview, remove). Uses `Dialog`.
- `MiniCalendar` (ui): month grid, keyboard navigable (arrow keys move by day, PageUp/PageDown
  by month, `aria-current="date"` on today), dots on days with the member's events, a list of
  that day's events below. Built here, filled with real sign-ups in phase 3.

### Admin overview (`/styreportal`)

- `UpcomingEventsPanel`: next 5 events (`upcomingEventsForAdmin()` Sanity helper, start ≥ now,
  ordered by start) with sign-up count, an `AvatarStack`, and "Vis påmeldte" expanding to a
  table (name, email, source, paid). "Gå til innsjekk" links to `/styreportal/innsjekk/:eventId`.
- `PaidSignupsPanel`: placeholder card until the event-pages/Vipps plans land, then reads
  `admin_event_signups where source = 'registration'`.
- `MembersSummary`: active members, paid this season, unpaid, disabled — each a link into the
  members tab pre-filtered.

### Members (`/styreportal/medlemmer`)

- Table on desktop, cards on mobile. Columns: name, email, member since, status chip,
  this season (paid/unpaid chip), admin chip, account (has signed in / invited / not invited).
- Filters (decision log step 10): tabs Aktive / Deaktiverte / Alle; chips "Ikke betalt",
  "Styret"; search by name/email (`useMemberSearch`, fix #75 while there).
- Row actions: Rediger, Marker som betalt (dialog: amount prefilled from a `MEMBERSHIP_FEE_NOK`
  constant in `src/utils/membership.ts`, method manual/bank/cash, date), Send invitasjon,
  Deaktiver (dialog with reason, `danger` button, explains "kan ikke logge inn, historikk
  beholdes"), Aktiver, Gjør til styremedlem / Fjern fra styret.
- "Legg til medlem" opens `MemberForm` (name, surname, email, optional phone, optional birth
  year, member since, note) with "Send invitasjon nå" checked by default.
- CSV export of the current filter (name, email, member since, paid this season) for the
  treasurer. Generated client-side from rows the admin can already read. Header row
  translated. Escape cells starting with `= + - @` (CSV injection).

### Check-in (`/styreportal/innsjekk[/:eventId]`)

- Without an id: today's and the next 7 days' events; pick one.
- With an id: big search field at the top (autofocus), signed-up members listed first with a
  large "Sjekk inn" toggle, then a search across all active members for walk-ins. Each tap is
  an immediate insert/delete with optimistic UI and an undo toast. A "Gjester uten konto" stepper
  writes `event_headcounts.guests`. Counter at the top: "23 sjekket inn · 4 gjester".
- Works one-handed at 360 px wide; touch targets ≥ 44 px.
- Later (phase 3 option): scan the member's QR card. Not in this phase.

### Statistics (`/styreportal/statistikk`)

Read through SECURITY DEFINER RPCs that return aggregates only (admin-checked inside):

- `admin_stats_overview(season)`: active members, new members this season, paid count,
  check-ins this season, unique attendees, average attendance per event, guests.
- `admin_stats_attendance_by_month(season)`: month, events, check-ins, unique members.
- `admin_stats_top_events(season, limit)`: event_id, date, check-ins + guests (titles resolved
  from Sanity client-side).
- `admin_stats_age_groups(season)`: counts under 26 / 26 and over, from `birth_year`, for grant
  reports (Frifond and municipal grants ask for members under 26). Only buckets, never rows.

Charts follow the `dataviz` skill (bar for months, stat tiles for the overview), each with a
table alternative for screen readers. No chart library unless the skill's guidance needs one;
inline SVG is enough for two bar charts.

## Query helpers (`src/supabase/queryHelpers/`)

One function per file, per the sbsk-supabase-query skill: `getRegister()`,
`createMemberEntry()`, `updateMemberEntry()`, `markMembershipPaid()`, `getSeasonStatus()`,
`invokeAdminMembers(action, payload)`, `getEventSignupsForAdmin(eventIds)`,
`checkInMember()`, `undoCheckIn()`, `setGuestCount()`, `getAdminStats*()`. Replace
`createMember.ts`/`editMember.ts` (they still send address fields and `is_admin`) rather than
keeping both. The loader `adminPortalLoader` replaces `boardPortalLoader` and starts with the
security plan's `requireAdminSession()`: no session → `/login?reason=not_authenticated`; admin
at aal1 → `/to-faktor` (or `/to-faktor/oppsett` with no factor yet); not admin →
`/medlemsportal?reason=not_admin`. Decide admin with the RPCs, not with a permission error from
a table read.

## Security checklist for this phase

- [ ] Every new table has RLS enabled in the same migration that creates it, and a pgTAP test
      proving a non-admin, a disabled member and `anon` get nothing.
- [ ] Every admin branch uses `admin_session()`; a test with an aal1 admin JWT is denied on
      every table, RPC and the edge function. `member_is_admin()` also requires active status.
- [ ] `admin-members` refuses: no JWT, non-admin JWT, aal1 admin JWT, wrong method, bad body,
      origin not in the allowlist (CORS), and returns no Postgres error text.
- [ ] Last-admin trigger tested for disable, demote and delete.
- [ ] Audit rows written for every admin write, including through the edge function.
- [ ] No `dangerouslySetInnerHTML`; member-supplied text (bio, notes, names) rendered as text.
- [ ] CSV export escapes formula prefixes.
- [ ] Security advisors (`get_advisors`) clean or each remaining warning documented in the
      migration comment, as 20261107093420 does.
- [ ] `placehold.net` avatar fallback replaced by a local asset and removed from the CSP
      (it leaks every viewer's IP to a third party — see gdpr.md).

## Steps (one PR each, into `redesign`)

| Step | PR content                                                                                                                                                        | Done when                                                                                                                                 |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | (Security plan S4.1 if merged.) Capture-existing migration; pgTAP baseline tests.                                                                                 | `supabase db reset` from migrations reproduces the live schema; tests green in CI.                                                        |
| 1    | Step 1 migration + regenerated types (`generate_typescript_types` → `src/supabase/database.types.ts`, used by the client) + new query helpers + their unit tests. | Advisors clean; pgTAP RLS matrix green; old address fields gone from all helpers and forms.                                               |
| 2    | `adminPortalLoader`, nested routes, `VITE_ENABLE_BOARD_PORTAL`, overview with `MemberDashboardTop`, `ProfileEditDialog`, `UpcomingEventsPanel`, `MembersSummary`. | Admin at aal2 sees the overview; member is bounced with the reason alert; e2e green.                                                      |
| 3    | Members tab: list, filters, add/edit, mark paid, CSV.                                                                                                             | All row actions work against the e2e stub; audit rows appear (pgTAP).                                                                     |
| 4    | `admin-members` edge function + invite/disable/enable/setAdmin in the UI; attendance migration.                                                                   | Disabled user's existing session reads nothing (pgTAP with a JWT for a disabled member); invite email arrives (manual check, Resend log). |
| 5    | Check-in mode + headcounts.                                                                                                                                       | Check in/undo works offline-tolerant (optimistic + retry); e2e at 360 px.                                                                 |
| 6    | Statistics RPCs + page.                                                                                                                                           | Numbers match a seeded fixture in pgTAP; charts have table fallbacks.                                                                     |

## Tests

**pgTAP** (`supabase/tests/admin/*.test.sql`), using `tests.authenticate_as()` helpers
(basejump `supabase_test_helpers`, installed as a dev extension in the test DB only):

- RLS matrix: for each table × {anon, active member, disabled member, admin aal1, admin aal2}
  × {select, insert, update, delete}, the expected allow/deny.
- `hook_restrict_signup_by_email_list`: listed active email allowed, disabled refused, unknown
  refused, case-insensitive match.
- Last-admin protection; audit trigger content (diff contains changed columns only).
- `member_season_status` correct for paid, refunded, none.
- Stats RPCs: non-admin gets an exception, admin gets the seeded numbers.

**Vitest** (mock helpers, never the network):

- Each query helper: correct table/columns/filters, throws on error.
- `adminPortalLoader`: the four redirect outcomes.
- Members tab: filter logic, CSV escaping, "mark paid" dialog validation (Zod), row action
  visibility per status.
- Check-in: optimistic toggle + rollback on error; guest stepper bounds.
- `MiniCalendar`: keyboard navigation, `aria-current`, month change.

**Playwright** (`e2e/admin.spec.ts`, extend `e2e/fixtures/supabase.ts` with `members`,
`membership_payments`, `attendance`, `rpc/member_is_admin`, `functions/v1/admin-members`):

- Signed out → login; member → `/medlemsportal?reason=not_admin` with the alert; admin → overview.
- Add member → appears in list; mark paid → chip flips; disable → confirm dialog → status chip.
- Check-in at 360×740: search, check in, undo, guest count.
- Axe scan (`@axe-core/playwright`, if the security/testing plan adds it) on each admin route:
  no serious/critical violations.
- English: switch language, every admin route shows no raw keys.

## Out of scope here

Member self-service sign-up, OTP login, member page sections, badges (phase 3); paid
registrations (event-pages plan); Vipps (phase 6); push notifications (phase 5); GDPR export and
deletion (gdpr.md, scheduled to land with phase 3).
