# Plan — Phase 3: Members — sign-up, sign-in, Min side, events, badges

Status: planned · Owner: unassigned · Depends on: [phase 2](phase-2-admin-page.md) (register,
payments, attendance, `member_directory`, shared dashboard components), the security plan
(`docs/plans/SECURITY_AND_RELIABILITY.md`: Turnstile, CORS/auth shared modules, pgTAP job),
[i18n](i18n.md) · Ships together with: [gdpr.md](gdpr.md) (export, deletion, privacy policy and
terms must be live before the first member signs up) · Later: Vipps (`phase-6-vipps-payments.md`)
plugs into the sign-up built here.

## Goal

A person on the club's member list can create their own login, sign in with a password **or** a
one-time code sent by email, and get a personal page ("Min side") with:

1. **Top bar** — photo, name, badge count and basic statistics (times checked in, member since,
   events joined).
2. **My calendar** — a small calendar with the events they've signed up for, plus suggestions
   for what to sign up for next.
3. **Profile** — change photo and bio.
4. **Badges** — earned and still-to-earn, with progress.
5. **Membership card** _(the extra section — see decision 9)_ — this season's payment status and
   a QR code the board scans at the door to check them in.
6. **Settings and privacy** — language, password, sign-in methods, download my data, delete my
   account.

From the calendar and event pages they sign up to (and leave) events, and other members see who
is coming. When signed in, the orange "Bli medlem" button becomes "Min side".

People **not** on the list cannot create a login. They apply through "Bli medlem" (name, email,
later Vipps payment); the board approves, or — once Vipps lands — paying approves them
automatically.

## Current state (verified 2026-11-11, re-checked against `main` 2026-11-13)

- `src/hooks/useAuthActions.ts`: `registerWithPassword` (`auth.signUp`) and
  `signInWithPassword`. No OTP, no password reset.
- `src/hooks/authContext/authProvider.tsx`: session from supabase-js, profile refetched, admin
  probed with `isBoardAdmin()`; nothing mirrored in localStorage (#95 — keep it that way).
- Sign-up is already restricted in the database by `hook_restrict_signup_by_email_list()`.
- `src/pages/BecomeAMember.tsx` is a placeholder pointing to the club email.
- `src/components/layout/Header.tsx`: shows "Logg inn" or a portal link, and always "Bli medlem".
- `event_participants` + `supabase/functions/update-event-participants`: join/leave by Sanity
  event `_id`; the function snapshots name/surname/photo from the caller's profile.
- `CalendarSection` already renders participants with `AvatarStack` and a join toggle for
  signed-in members.
- Routes for login/register/member portal are behind `VITE_ENABLE_MEMBER_PORTAL` (#213).
- Phase 2 delivers: `members.status`, `membership_payments`, `member_season_status`,
  `attendance`, `member_directory`, `MemberDashboardTop`, `ProfileEditDialog`, `MiniCalendar`,
  `admin_session()` usage everywhere.

## Decisions

| #   | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Invite-only stays a database rule.** `hook_restrict_signup_by_email_list()` is the boundary; the UI only explains it. Both sign-in methods create the auth user on first use if, and only if, the email is an **active** row in `members`.                                                                                                                                                                                               |
| 2   | **Two sign-in methods, one form.** Email field first; then "Logg inn med passord" or "Send meg en engangskode". A member never has to set a password.                                                                                                                                                                                                                                                                                      |
| 3   | **OTP is a 6-digit code, not a magic link.** A link opens in whatever browser the mail app picks (breaks the PWA in phase 5 and in-app mail browsers); a code works everywhere. Code valid 10 minutes (`auth.email.otp_expiry = 600`), length 6.                                                                                                                                                                                           |
| 4   | **Account creation = first sign-in.** `/lag-medlemsprofil` asks for email → sends a code → verifies → onboarding (name prefilled from the register, optional photo/bio, accept terms + privacy, optional password). No separate "register" form with a password. The admin "Send invitasjon" email from phase 2 links here.                                                                                                                |
| 5   | **Turnstile** captcha on every auth call that sends email or checks a password (Supabase native captcha support; security plan wires the CSP).                                                                                                                                                                                                                                                                                             |
| 6   | **Accepted risk: email enumeration.** The hook's refusal tells a caller whether an address is on the member list. Membership of a board game club is low-sensitivity; Turnstile + Supabase's per-IP and per-email rate limits make bulk probing impractical. The UI wording stays neutral ("Vi fant ikke e-posten i medlemslisten. Er du medlem? Kontakt styret, eller bli medlem."). Recorded so nobody "fixes" it by weakening the hook. |
| 7   | **Event sign-ups stop snapshotting names and photos.** `event_participants` keeps only `event_id, supabase_id, created_at`; names and photos come from `member_directory` at read time. A profile edit or account deletion then shows up everywhere at once, and there is no stale copy of personal data to export or erase (gdpr.md).                                                                                                     |
| 8   | **Members choose whether other members see them in attendee lists** (`profiles.show_in_attendee_lists`, default `true`). Hidden members show as "+1 til" to members; the board always sees names.                                                                                                                                                                                                                                          |
| 9   | **The sixth section is a membership card.** It answers "have I paid?" (Martin's requirement that members see their own payment status), gives the board a fast door check-in (scan instead of search), and is useful offline at the venue once the PWA caches it. Alternative candidates (game wishlist, play log) overlap the "new ideas" plan, so they are left to it.                                                                   |
| 10  | **Badges are data, awarded by the database.** Definitions in a `badges` table seeded by migration; automatic badges awarded by a trigger on `attendance` (and a daily pg_cron job for time-based ones); manual badges awarded by the board. Revoked automatically if an undo means the rule no longer holds (a mistaken check-in must not leave a badge). Names and descriptions live in i18n files keyed by slug.                         |
| 11  | **Membership application before Vipps.** "Bli medlem" posts to `membership_applications`; the board approves in the members tab (creates the `members` row + sends the invite). When the Vipps phase lands, a captured payment approves the application automatically — same table, same approval function.                                                                                                                                |
| 12  | **Profile photos are re-encoded in the browser** (canvas → WebP, max 512 × 512) before upload. That strips EXIF, including GPS coordinates from phone photos, and keeps storage small.                                                                                                                                                                                                                                                     |
| 13  | Minimum age for an own account: **13** (personopplysningsloven § 5 sets 13 as the age of consent for online services in Norway). Younger members stay on the register without a login. The onboarding asks for confirmation ("Jeg er 13 år eller eldre").                                                                                                                                                                                  |

## Data model (migrations in this phase)

### `profiles` additions

```sql
alter table public.profiles
  add column show_in_attendee_lists boolean not null default true,
  add column member_card_token text unique
    default encode(extensions.gen_random_bytes(16), 'hex');  -- QR payload, rotatable, not a login secret
```

`member_directory` (phase 2) gains a filter: rows with `show_in_attendee_lists = false` are
visible only to `admin_session()` and to the member themself.

### `event_participants` slimmed

```sql
alter table public.event_participants
  drop column name, drop column surname, drop column photo_url;
-- select policy: active members only (was: any authenticated user)
-- insert: auth.uid() = supabase_id and member_is_active()
-- delete: own row, or admin_session()
```

Update `supabase/functions/update-event-participants` to stop reading the profile (it then only
inserts/deletes) — or drop the function and call PostgREST directly through RLS, which is now
enough because the row carries no client-supplied display data. **Decision: drop the function**;
one less deployable, and the insert policy already pins `supabase_id = auth.uid()`. Rewrite
`src/supabase/queryHelpers/eventParticipants.ts` accordingly and join names from
`member_directory`.

Also add a capacity guard if the event-pages plan sets one: a `BEFORE INSERT` trigger reading
`event_capacity(event_id)` from a small `event_settings` table maintained by an admin, raising
`event_full`. Skip if events stay uncapped.

### Badges

```sql
create type public.badge_kind as enum ('auto', 'manual');

create table public.badges (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  kind public.badge_kind not null,
  rule jsonb,                 -- null for manual; see the rule shapes below
  sort_order smallint not null default 0,
  active boolean not null default true
);

create table public.member_badges (
  member_id uuid not null references public.members (id) on delete cascade,
  badge_slug text not null references public.badges (slug),
  awarded_at timestamptz not null default now(),
  awarded_by uuid references auth.users (id) on delete set null,   -- null = automatic
  primary key (member_id, badge_slug)
);
```

RLS: `badges` readable by any authenticated active member; writable by nobody (migrations
only). `member_badges` readable own + admin (+ others' **count** through `member_directory` if we
show it later — not in this phase); insert/delete for manual badges by admin only; automatic
rows written by the SECURITY DEFINER function `award_auto_badges(member_id)`.

Rule shapes (evaluated in `award_auto_badges`, plpgsql, one `case` per `type`):

```jsonc
{ "type": "checkins_total", "min": 10 }
{ "type": "checkins_category", "category": "turnering", "min": 1 }
{ "type": "distinct_categories", "min": 5 }
{ "type": "event_attended", "eventSlugPrefix": "board-game-masters" }   // matches attendance.event_id via a mapping table filled by the check-in UI
{ "type": "months_in_a_row", "min": 4 }
{ "type": "membership_years", "min": 3 }                                // daily cron
{ "type": "paid_seasons", "min": 2 }
```

Seed (Norwegian name / English name — goes into `member.badges.*`, not the table):

| slug                | kind   | rule                              | nb / en                                      |
| ------------------- | ------ | --------------------------------- | -------------------------------------------- |
| `first-roll`        | auto   | checkins_total ≥ 1                | Første kast / First roll                     |
| `regular`           | auto   | checkins_total ≥ 10               | Stamgjest / Regular                          |
| `veteran`           | auto   | checkins_total ≥ 25               | Veteran / Veteran                            |
| `fifty`             | auto   | checkins_total ≥ 50               | Halvhundre / Half-century                    |
| `hundred`           | auto   | checkins_total ≥ 100              | Hundreklubben / The Hundred Club             |
| `all-rounder`       | auto   | distinct_categories ≥ 5           | Allsidig / All-rounder                       |
| `tournament-player` | auto   | checkins_category turnering ≥ 1   | Turneringsspiller / Tournament player        |
| `masters`           | auto   | event_attended Board Game Masters | Masters-deltaker / Masters participant       |
| `streak-4`          | auto   | months_in_a_row ≥ 4               | Trofast / Faithful                           |
| `three-years`       | auto   | membership_years ≥ 3              | Tre år ved bordet / Three years at the table |
| `supporter`         | auto   | paid_seasons ≥ 2                  | Støttespiller / Supporter                    |
| `helping-hand`      | manual | —                                 | Hjelpende hånd / Helping hand (volunteers)   |
| `board`             | manual | —                                 | Styreverv / Board member                     |
| `teacher`           | manual | —                                 | Spillforklarer / Rules teacher               |

Category values must match Sanity's `event.category` options exactly; read them from
`src/sanity/schemaTypes/eventType.ts` when writing the seed and add a pgTAP test that fails if a
seeded category is not in a hardcoded copy of that list (and a vitest that compares the copy with
the schema file), so a renamed category is caught.

Triggers: `attendance` AFTER INSERT/DELETE → `award_auto_badges(member_id)`; pg_cron daily
03:00 Europe/Oslo → `award_time_badges()` for `membership_years` and `months_in_a_row`.

Artwork: one SVG per slug in `src/assets/icons/badges/<slug>.svg` (dice-based, single colour
using `currentColor` so dark mode works). Until drawn, a generic badge SVG with the slug's
initial. Locked badges render greyed with a progress hint ("3 av 10 innsjekkinger").

### Membership applications

```sql
create type public.application_status as enum ('pending', 'approved', 'rejected', 'withdrawn');
create table public.membership_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 80),
  surname text not null check (char_length(surname) between 1 and 80),
  email text not null check (email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  birth_year smallint check (birth_year between 1900 and extract(year from now())::int),
  message text check (char_length(message) <= 1000),
  status public.application_status not null default 'pending',
  decided_at timestamptz,
  decided_by uuid references auth.users (id) on delete set null,
  payment_reference text,              -- Vipps phase
  privacy_version text not null        -- the policy version shown on the form
);
create unique index on public.membership_applications (lower(email)) where status = 'pending';
```

RLS: `anon`/`authenticated` insert only (with check `status = 'pending'` and decision columns
null); admin select/update. Same spam defences as the contact form (honeypot field rejected
client- and server-side, Turnstile, email regex — see the contact-form plan and
`20260824180000_contact_messages_email_format.sql`). An RPC `approve_application(id)`
(admin_session only) inserts the `members` row, marks approved, and returns the member id; the
UI then calls `admin-members` `invite`. Retention: rejected/withdrawn rows deleted after 90 days,
approved rows after 30 days (the register now holds the data) — pg_cron job (gdpr.md).

### Member statistics RPC

`my_stats()` (SECURITY DEFINER, uses `current_member_id()`, returns one row):
`checkins_total, checkins_season, events_joined_upcoming, member_since, months_streak,
favourite_category, badges_earned, badges_total, season_paid`. One round trip for the top bar.

### Membership card lookup

`admin_member_by_card_token(token text)` (admin_session only) → `member_id, name, photo,
season_paid`. Members can rotate their token from the card ("Lag ny kode") via
`rotate_member_card_token()` (own row only).

## Auth flows

New/changed in `src/hooks/useAuthActions.ts` (each a thin call + typed error mapping):

| Function                         | Supabase call                                                                                                                                             |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sendSignInCode(email, captcha)` | `auth.signInWithOtp({ email, options: { shouldCreateUser: true, captchaToken } })`                                                                        |
| `verifySignInCode(email, code)`  | `auth.verifyOtp({ email, token: code, type: 'email' })`                                                                                                   |
| `signInWithPassword(...)`        | existing, plus `captchaToken`                                                                                                                             |
| `setPassword(password)`          | `auth.updateUser({ password })` — requires a recent sign-in (Supabase "secure password change"); if refused, ask for a fresh code first                   |
| `sendPasswordReset(email)`       | Not a separate flow: "Glemt passord?" sends a sign-in code; once in, set a new password in Settings. One less email template and one less attack surface. |

Remove `registerWithPassword` (`auth.signUp`): account creation is the OTP flow only.

Map Supabase errors to i18n keys: hook refusal → `auth.errors.not_on_list`; disabled
(banned) → `auth.errors.disabled` ("Kontoen er deaktivert. Kontakt styret."); invalid/expired
code → `auth.errors.code_invalid`; rate limited → `auth.errors.rate_limited`; captcha →
`auth.errors.captcha`. Never show raw `error.message`.

Supabase config (versioned in `supabase/config.toml`, applied to the hosted project by hand or
via the management API — note which in the PR):

- `auth.email.enable_signup = true` (the hook gates it), `double_confirm_changes = true`,
  `secure_password_change = true`, `otp_length = 6`, `otp_expiry = 600`.
- `auth.password.min_length = 10`, leaked-password protection **on** (it is currently off per
  the 2026-11-07 advisor run; requires Pro — if unavailable on free tier, enforce
  `min_length = 12` and note it).
- `auth.rate_limit.email_sent` per hour suitable for the club (e.g. 30) with custom SMTP.
- Site URL + redirect allowlist: production origin and localhost.
- Templates per [i18n.md](i18n.md) §3 (bilingual; the OTP template shows `{{ .Token }}` big).

## Routes and UI

Same styling rule as [phase 2](phase-2-admin-page.md#ui): build on `main` in the current look,
sections compose `src/components/ui/` primitives only, colours come from `@theme` tokens
(including the semantic aliases phase 2 adds: `--color-danger`, `--color-success`,
`--color-portal-band`), so the redesign can later be applied as a reskin. New primitives this
phase needs: `BadgeTile`, `QrCode` (lazy-loaded), `OtpInput` (six boxes, paste-aware,
`autocomplete="one-time-code"`), `LanguageToggle` if the i18n foundation has not added it.

| Route                          | Page                                                                                                                                                            |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/login`                       | `LoginSection` rebuilt: email → password or code. Links: "Første gang? Lag medlemsprofil", "Bli medlem".                                                        |
| `/lag-medlemsprofil`           | Email → code → onboarding (`OnboardingSection`: name, surname, photo, bio, 13+ confirmation, terms + privacy checkbox with links, optional password, language). |
| `/medlemsportal`               | Min side (sections below). Admins land on `/styreportal`, which has the same top (phase 2 decision 1).                                                          |
| `/medlemsportal/innstillinger` | Settings and privacy (section 6), its own route so gdpr.md can link to it directly.                                                                             |
| `/bli-medlem`                  | Signed out: application form. Signed in: redirect to `/medlemsportal`.                                                                                          |
| `/personvern`, `/vilkår`       | Privacy policy and terms ([gdpr.md](gdpr.md)). Public, not behind the flag.                                                                                     |

Header: when signed in, the orange CTA reads "Min side" (`/medlemsportal`, or `/styreportal`
for admins) instead of "Bli medlem"; "Logg inn" becomes an avatar menu (Min side, Innstillinger,
Logg ut). Update `Header.test.tsx` for all three states (signed out, member, admin).

A loader `requireMember()` (`src/loaders/requireMember.ts`): no session → `/login?reason=…`;
session but no active member row (disabled while signed in) → sign out and
`/login?reason=disabled`; onboarding not finished (`terms_accepted_version` null or older than
current) → `/lag-medlemsprofil?step=terms`. Used by every `/medlemsportal*` loader.

### Min side sections (`src/components/sections/MemberPortalSection/`)

1. **`MemberDashboardTop`** (from phase 2) fed by `my_stats()`: avatar, name, "Medlem siden
   mars 2025", badge count ("7 merker"), tiles: Innsjekkinger (season / total), Påmeldt (upcoming),
   Rekke (months in a row). Edit button opens `ProfileEditDialog`.
2. **`MyCalendar`**: `MiniCalendar` with dots for signed-up events (from `event_participants`
   - Sanity titles), today's/selected day's list with "Meld av" buttons; below it
     "Forslag til deg": up to 3 upcoming events not joined, scored client-side —
     +3 if category = member's most-attended category, +2 if ≥ 5 members signed up, +1 if within
     14 days; ties by date. Each with "Meld meg på". Empty state for a new member: the next three
     events. Data: one Sanity query for events in the next 60 days, one Supabase query for the
     member's sign-ups and counts.
3. **`ProfileEditDialog`** (from phase 2) with photo re-encode (decision 12): `src/utils/
resizeImage.ts` (canvas `toBlob('image/webp', 0.85)`), reject non-images before decoding,
   old photo deleted from storage after a successful replace.
4. **`BadgeGrid`**: earned first (date earned), then locked with progress. Each badge a button
   opening a small dialog with the description. `aria-label` includes earned/locked state.
5. **`MembershipCard`**: name, photo, "Medlem 2027 — Betalt" (`--color-success`) / "Ikke betalt" (with "Slik
   betaler du" — Vipps link once phase 6 lands, until then the club's account number and fee
   from `src/utils/membership.ts`); QR of `member_card_token` (generate with a small, declared
   dependency such as `qrcode` — client-side, no network; check bundle cost and lazy-load it).
   Brightness tip for scanning. "Lag ny kode" rotates the token.
6. **Settings and privacy** (`/medlemsportal/innstillinger`): language; "Vis meg i
   deltakerlister" toggle; password set/change; sign out of all devices
   (`auth.signOut({ scope: 'global' })`); **Last ned mine data** and **Slett kontoen min**
   (both specified in [gdpr.md](gdpr.md)); links to the privacy policy and terms with the
   accepted version and date.

### Event sign-up

- `CalendarSection` and the event page (event-pages plan) use the new
  `joinEvent(eventId)` / `leaveEvent(eventId)` helpers (direct RLS insert/delete) and
  `getEventAttendees(eventIds)` (join with `member_directory`, hidden members counted).
- Signed out: the button reads "Logg inn for å melde deg på" → `/login?next=<current path>`.
  Validate `next` is a same-origin relative path starting with `/` and not `//` (open-redirect
  guard), in one helper `safeNext()` with tests.
- Disabled for past events; shows "Fullt" if a capacity guard exists.
- Paid / per-day registrations (BGM) are the event-pages and Vipps plans' flow, not this one.

### Admin additions (extends phase 2)

- Members tab: "Søknader" tab listing pending applications with Godkjenn (→ approve RPC →
  invite) and Avslå.
- Check-in: "Skann medlemskort" button using the `BarcodeDetector` API where available (Chrome
  Android, Safari 17+), falling back to the search list. Needs `getUserMedia` only — no new
  host; add `Permissions-Policy` note to `docs/HOSTING.md` (cannot be set on Pages).
- Member detail: award/revoke manual badges.

## Security checklist for this phase

- [ ] pgTAP: `event_participants`, `member_badges`, `membership_applications`, profile columns
      — the RLS matrix for anon / active / disabled / admin(aal1) / admin(aal2).
- [ ] pgTAP: signup hook — active listed email allowed via OTP path, unlisted refused,
      disabled refused, upper-case variant matches.
- [ ] A disabled member's existing session: `requireMember()` signs them out; RLS returns
      nothing in the meantime.
- [ ] Turnstile token sent on every auth call that emails or checks a password; e2e stub
      accepts a fake token.
- [ ] `safeNext()` rejects `//evil.com`, `https://evil.com`, `/\evil.com`, `javascript:`.
- [ ] Uploaded images: MIME allowlist (bucket already restricts), size ≤ 5 MB before re-encode,
      re-encoded output has no EXIF (unit test with a fixture JPEG carrying GPS).
- [ ] Bio and names rendered as text; length limits enforced by DB constraints and Zod.
- [ ] `member_card_token` is never accepted for anything but the admin lookup (grep the
      functions; pgTAP that a member cannot call `admin_member_by_card_token`).
- [ ] Sessions: supabase-js keeps the session in localStorage, so XSS = account takeover. The
      CSP's `script-src 'self'` is the main defence — no inline scripts, no new script hosts.

## Steps (one PR each, into `main`)

| Step | PR content                                                                                                                                                                         | Done when                                                                                                                          |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Auth: OTP + password form, `/lag-medlemsprofil` onboarding, templates, config, error mapping, `requireMember()`, `safeNext()`; remove `registerWithPassword`.                      | A listed email can create a login with a code and sign in either way; unlisted/disabled get the right message; e2e green.          |
| 2    | `/personvern` + `/vilkår` + terms acceptance (from gdpr.md step 1).                                                                                                                | Onboarding cannot finish without accepting; version stored.                                                                        |
| 3    | Min side top + profile edit (EXIF strip) + settings route without GDPR buttons; header CTA swap.                                                                                   | Member sees stats from `my_stats()`; header correct in three states.                                                               |
| 4    | `event_participants` slimming migration, drop `update-event-participants`, new helpers, `MyCalendar` with suggestions, calendar/event page join/leave, attendee visibility toggle. | Join/leave works from calendar and Min side; hidden member shows as "+1" to others, name to admin.                                 |
| 5    | Badges: tables, seed, award function + triggers + cron, `BadgeGrid`, manual badges in admin.                                                                                       | Checking a seeded member in 10 times awards `regular`; undo revokes; pgTAP covers every rule type.                                 |
| 6    | Membership card + QR + token rotation; admin scan in check-in.                                                                                                                     | Scan on a phone checks the member in; rotated token no longer resolves.                                                            |
| 7    | `/bli-medlem` application + admin "Søknader" + approve RPC.                                                                                                                        | Application → approve → invite email → member signs in.                                                                            |
| 8    | GDPR export + deletion (gdpr.md steps 2–4).                                                                                                                                        | See gdpr.md acceptance.                                                                                                            |
| 9    | Turn on `VITE_ENABLE_MEMBER_PORTAL` in production (one-line PR, after Martin's go).                                                                                                | Smoke-tested first with a real test member against a local production build with the flag on (`npm run build && npm run preview`). |

## Tests

**Vitest**: `useAuthActions` (each function, captcha passed through, error mapping table);
`requireMember` (four outcomes); `safeNext`; `resizeImage` (dimensions, type, EXIF gone);
suggestion scoring (pure function `scoreSuggestions(events, history, counts, now)`); `BadgeGrid`
(earned vs locked, progress text, a11y labels); `MembershipCard` (paid / unpaid / no season);
`MyCalendar` (dots, selection, leave); header CTA states; onboarding step machine.

**pgTAP**: see the security checklist, plus `my_stats()` against a seeded member;
`award_auto_badges` per rule type including revoke-on-undo; application insert as anon,
duplicate pending email refused, approve creates the members row.

**Playwright** (extend `e2e/fixtures/supabase.ts`: `auth/v1/otp`, `auth/v1/verify`,
`rest/v1/rpc/my_stats`, `badges`, `member_badges`, `membership_applications`,
`event_participants` with `member_directory`):

- OTP sign-in happy path; wrong code; not-on-list message; disabled message.
- First-time onboarding: cannot continue without terms; lands on Min side.
- Min side renders all six sections; keyboard through `MiniCalendar`; join a suggested event,
  it appears in the calendar; leave it.
- Header CTA: signed out "Bli medlem", member "Min side" → `/medlemsportal`, admin →
  `/styreportal`.
- `/login?next=//evil.example` stays on site after sign-in.
- English pass over every member route (no raw keys), and an axe scan per route.
- 360 px: no horizontal scroll on Min side.

## Out of scope

Vipps payment in the application (phase 6 plan adds it to the same form and table); push
notifications for sign-ups and reminders (phase 5 plan; it reads `profiles.locale`); paid event
registrations (event-pages plan).
