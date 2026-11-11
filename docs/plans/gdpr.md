# Plan — GDPR: data inventory, download, deletion, privacy policy and terms

Status: planned · Owner: unassigned · Ships with: [phase 3](phase-3-members.md) (nothing
member-facing goes live before steps 1–4 below) · Touches: [phase 2](phase-2-admin-page.md),
the event-pages, Vipps (`phase-6-vipps-payments.md`), PWA (`phase-5-pwa-notifications.md`) and
security (`SECURITY_AND_RELIABILITY.md`) plans.

> This plan is engineering guidance, not legal advice. The policy text needs the board's
> approval, and anything marked **[confirm]** needs a decision from the club.

## Short answers to Martin's questions

- **Is download required?** Yes. A member has the right to a copy of their data (GDPR art. 15)
  and, for data they gave us under the membership agreement, to get it in a machine-readable
  format (art. 20). We offer a JSON download from Min side; requests by email are also valid and
  must be answered within one month (art. 12(3)).
- **Does "delete my account" remove them from the whole system?** Almost. Everything goes —
  login, profile, photo, sign-ups, check-ins, badges, messages, the register entry — **except**
  payment records, which accounting law requires us to keep for 5 years (art. 17(3)(b)). Those are
  cut loose from the account and keep only what a receipt needs: name, amount, date, reference.
  Check-ins become an anonymous number on the event so club statistics stay right. Backups age
  out within 12 weeks.
- **Where is the data?** Member data is in Supabase, in the EU (Frankfurt, AWS
  `eu-central-1`). Website content is in Sanity and contains no member data. The privacy policy
  lists every service and what it sees.
- **Privacy policy and terms?** Yes, both: a privacy policy (`/personvern`, required by art. 13
  at the point we collect data) and membership/user terms (`/vilkår`). Both in Norwegian and
  English, versioned, accepted during onboarding.

## Roles

- **Controller** (behandlingsansvarlig): Stavanger Brettspillklubb, org.nr **[confirm]**,
  contact sbsk@hotmail.com. The board as a whole is responsible; name one board member as the
  privacy contact **[confirm]**. No DPO is required (art. 37: not core large-scale processing).
- **Processors** (databehandlere) — need a data processing agreement (art. 28):
  Supabase (database, auth, storage, edge functions), Resend (sending emails), the web host
  (GitHub Pages now, Cloudflare Pages if the club moves), Cloudflare Turnstile (bot check).
- **Separate controllers**: Vipps MobilePay (payments — they process under their own terms;
  we receive only what the payment API returns), Spond (while still used for sign-ups).
- **Not a processor of member data**: Sanity. Keep it that way — no member names, emails or
  photos in Sanity documents (#98 already moved event participants out). Editors' own Sanity
  accounts are covered by Sanity's terms with the editor.

## Data inventory (the source of truth — update it in every PR that adds personal data)

| Data                                                                                       | Where                                       | Purpose                                                      | Legal basis (art. 6)                                       | Who sees it                                           | Kept until                                                     | On account deletion                                     |
| ------------------------------------------------------------------------------------------ | ------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------- |
| Name, email, phone (opt.), birth year (opt.), member since, status, admin flag, board note | `members`                                   | Membership register                                          | (b) membership agreement; birth year (f) grant reporting   | Board; member sees own (incl. note, on export)        | Membership ends + disabled 24 months                           | Deleted                                                 |
| Login (email, password hash, MFA factors, sign-in times)                                   | Supabase Auth (`auth.*`)                    | Signing in                                                   | (b)                                                        | Nobody in the app; Supabase as processor              | Account deleted                                                | Deleted (hard delete)                                   |
| Display name, photo, bio, language, attendee-list visibility, terms version                | `profiles`, storage `profile-images/<uid>/` | Member profile                                               | (b); photo/bio voluntary                                   | Active members (name/photo/bio, unless hidden); board | Account deleted                                                | Deleted, files removed                                  |
| Event sign-ups                                                                             | `event_participants`                        | Telling others you're coming                                 | (b)                                                        | Active members (unless hidden); board                 | Account deleted                                                | Deleted                                                 |
| Check-ins, guest counts                                                                    | `attendance`, `event_headcounts`            | Statistics, badges, grant reports                            | (f) legitimate interest                                    | Member (own); board                                   | Account deleted                                                | Converted to an anonymous count                         |
| Badges                                                                                     | `member_badges`                             | Fun / recognition                                            | (b)                                                        | Member; board                                         | Account deleted                                                | Deleted                                                 |
| Membership payments                                                                        | `membership_payments`, `vipps_payments`     | Bookkeeping, payment status                                  | (c) legal obligation (bokføringsloven)                     | Member (own); board                                   | 5 years after the end of the financial year                    | Unlinked; name, amount, date, reference kept            |
| Paid event registrations                                                                   | `event_registrations` (event-pages plan)    | Event admission                                              | (b)                                                        | Board                                                 | Event + 3 months; payment part 5 years                         | Unpaid deleted; paid unlinked as above                  |
| Membership applications                                                                    | `membership_applications`                   | Processing an application                                    | (b) pre-contract steps                                     | Board                                                 | Approved 30 days, rejected/withdrawn 90 days                   | Deleted (matched by email)                              |
| Contact messages                                                                           | `contact_messages`                          | Answering questions                                          | (f)                                                        | Board                                                 | 12 months                                                      | Deleted (matched by email)                              |
| Admin actions                                                                              | `admin_audit_log` (security plan)           | Security, accountability                                     | (f)                                                        | Board                                                 | 2 years                                                        | Personal keys replaced with `[slettet]`; actor set null |
| Push subscriptions                                                                         | PWA plan's table                            | Notifications                                                | consent (a) via the browser prompt                         | Nobody (server only)                                  | Until unsubscribed or account deleted                          | Deleted                                                 |
| Erasure ledger                                                                             | `erasure_log` (this plan)                   | Re-applying deletions after a backup restore; accountability | (c)/(f)                                                    | Nobody (service role only)                            | 1 year                                                         | — (holds only a one-way hash)                           |
| IP address, user agent                                                                     | Host access logs, Supabase logs, Turnstile  | Delivering the site, security                                | (f)                                                        | Processors                                            | Processor defaults (Supabase free: ~1 day; host: per provider) | Out of our reach; ages out                              |
| Theme, motion, language, session                                                           | Browser `localStorage`                      | Strictly necessary / user-requested settings                 | ekomloven cookie rule exemption — no consent banner needed | Only the device                                       | Until cleared or signed out                                    | Cleared on sign-out                                     |

What we deliberately do **not** collect: postal address (dropped in phase 2), date of birth
(year only, optional), phone (optional), gender, analytics/tracking of any kind. Adding any of
these needs a new row above with a purpose. The `placehold.net` avatar fallback is removed in
phase 2 because it sends every viewer's IP to a third party.

### The rule for every future plan and PR

A PR that adds a table, column, bucket, third-party service or log containing personal data
must, in the same PR: (1) add or update a row in the table above, (2) define what happens to it
in `erase_member()`, (3) add it to the export, (4) give it a retention period (and the pg_cron
job if it is time-based), (5) update the privacy policy text if the purpose or recipient is
new. Add a checkbox for this to `.github/pull_request_template.md` in step 1.

## Implementation

### Step 1 — Privacy policy, terms, acceptance (lands before phase 3 step 3)

- Routes `/personvern` and `/vilkår` (public; not behind the portal flag) rendering
  `legal.json` through a `LegalDocument` section ([i18n.md](i18n.md) §6). Footer links to both.
- `src/utils/legal.ts`: `CURRENT_LEGAL_VERSION = '2027-01'`. Onboarding stores
  `profiles.terms_accepted_version` + `terms_accepted_at`; `requireMember()` sends anyone with an
  older version to a short "Vi har oppdatert vilkårene" step listing the change summary
  (`legal.changes.<version>`).
- The application form (`/bli-medlem`) and contact form show a one-line notice with a link
  ("Vi bruker opplysningene til å behandle søknaden. Les personvernerklæringen.") — information,
  not a consent checkbox, since the basis is not consent.
- PR template checkbox (see the rule above).

### Step 2 — Export ("Last ned mine data")

Edge function `supabase/functions/gdpr-export/index.ts`:

1. `requireUser(req)` from `_shared/auth.ts` (verified JWT, active or disabled — a disabled
   member keeps the right of access, so this function, uniquely, does **not** require active
   status; their login is banned though, so in practice disabled members ask by email and an
   admin runs the export with `{ memberId }`, admin_session required for that variant).
2. Rate limit: one export per member per 10 minutes (a `gdpr_requests` table row with
   `member_id, kind, at`; also gives the board a record that requests were answered).
3. With the service role, collect into one object:

   ```jsonc
   {
     "generatedAt": "…", "format": "sbsk-export/1", "legalVersion": "2027-01",
     "controller": { "name": "Stavanger Brettspillklubb", "email": "sbsk@hotmail.com" },
     "account":   { "email", "createdAt", "lastSignInAt", "mfaFactors": [{ "type", "createdAt" }] },
     "register":  { /* members row, including the board's note */ },
     "profile":   { /* profiles row minus internal ids */, "photo": { "path", "signedUrl" } },
     "eventSignups": [{ "eventId", "createdAt" }],
     "registrations": [ /* event_registrations */ ],
     "checkIns":  [{ "eventId", "eventDate", "eventCategory", "checkedInAt" }],
     "badges":    [{ "slug", "awardedAt" }],
     "payments":  [ /* membership_payments + vipps_payments rows */ ],
     "applications": [ … ], "contactMessages": [ … ],
     "adminActionsAboutMe": [{ "at", "action" }],
     "pushSubscriptions": [{ "createdAt", "userAgent" }]
   }
   ```

   Never include: password hashes, MFA secrets, other members' data (e.g. who else attended),
   the `member_card_token` (rotate-able secret-ish), service metadata.

4. Return `application/json` with `Content-Disposition: attachment; filename="sbsk-mine-data-YYYY-MM-DD.json"`.

Client (`/medlemsportal/innstillinger`): "Last ned mine data" → calls the function → enriches
event ids with titles from Sanity (public data) → triggers the download → also offers "Last ned
profilbilde" from the signed URL. A short explainer lists what the file contains, in the
member's language. Admin variant: a "Eksporter data" action on a member in the members tab.

### Step 3 — Deletion ("Slett kontoen min")

SQL function `public.erase_member(p_member_id uuid, p_trigger text)` — SECURITY DEFINER,
EXECUTE granted to `service_role` only, one transaction:

1. Refuse if the member is the last active admin (`last_admin`).
2. `attendance`: `insert … on conflict do update` `event_headcounts.guests += 1` per row, then
   delete the rows.
3. Delete: `member_badges`, `event_participants` (by `supabase_id`), push subscriptions,
   `membership_applications` and `contact_messages` matching the email (case-insensitive),
   unpaid/future `event_registrations`.
4. Unlink: `membership_payments.member_id = null`, `vipps_payments` / paid
   `event_registrations` → `supabase_id = null`, `email = null`; keep payer name, amount, date,
   reference.
5. Delete the `profiles` row and the `members` row.
6. **Last of all mutations** — `admin_audit_log`: for every row about this member, replace
   every key returned by the security plan's `public.audit_personal_keys()` (name, surname,
   email, phone, photo_url, bio, …) with `'[slettet]'` in **both** the old and new snapshots;
   keep action and time. Where the member was the **actor**, set `actor_id = null`. Use that
   function, never a local key list, so the trigger and the erasure can't drift. This must run
   after steps 2–5, because the audit triggers on `members`, `membership_payments` and
   `attendance` write new rows (with the deleted values in the old snapshot) for those very
   mutations; redacting earlier would leave those fresh rows unredacted.
7. Insert `erasure_log(at, subject_hash, trigger)` where `subject_hash =
encode(digest(supabase_id::text || member_id::text, 'sha256'), 'hex')`, trigger in
   `'self' | 'admin_request' | 'retention'`.
8. Return the auth user id and the storage prefix.

Edge function `supabase/functions/gdpr-delete/index.ts`:

1. `requireUser(req)`; body `{ confirm: "SLETT" }` (or `"DELETE"` in English) must match.
2. **Fresh authentication**: the newest `timestamp` in the JWT's `amr` claim (the time of the
   last real password, OTP or TOTP verification) must be under 5 minutes old. **Not** `iat`:
   a token refresh issues a new JWT with a fresh `iat` and no new proof of identity, while `amr`
   timestamps survive refreshes unchanged. Verify the JWT with `auth.getUser()` first, then read
   `amr` from the verified token's payload. Otherwise reply `reauth_required` and the UI asks
   for a new sign-in code (`signInWithOtp` + `verifyOtp`, which adds a new `amr` entry) before
   retrying. This stops a borrowed unlocked phone deleting someone's account. Deno test: a JWT
   with a fresh `iat` but an `amr` timestamp older than 5 minutes is refused.
3. Send the confirmation email first (Resend; the address is about to be erased): "Kontoen din
   hos Stavanger Brettspillklubb er slettet" + what was kept (payments) and for how long.
4. `rpc('erase_member')` with the service role.
5. Storage: list and remove everything under `profile-images/<uid>/`.
6. `auth.admin.deleteUser(uid, /* shouldSoftDelete */ false)`.
7. If 5 or 6 fails after 4 succeeded, log and retry via a `pending_cleanup` row the nightly job
   finishes — the database part is already done and the login is unusable (no members row).

Admin variant (member asked by email, or has no login): same function with `{ memberId }` and
`admin_session()`; skips steps 2–3 of the edge function (the board confirms in a `danger`
dialog that requires typing the member's name), trigger `'admin_request'`.

UI (`/medlemsportal/innstillinger`, at the bottom, `danger` styling): explains in plain words
what is deleted and what is kept, links to the download first ("Vil du laste ned dataene dine
før du sletter?"), then a `Dialog` with the typed confirmation, then the re-auth code if needed.
After success: sign out locally, clear storage, show a goodbye page (`/konto-slettet`).

Membership: deleting the account ends the membership; paid fees are not refunded (terms §).

### Step 4 — Retention jobs (pg_cron, Europe/Oslo, nightly)

| Job                       | Rule                                                                                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `erase_lapsed_disabled`   | `members.status = 'disabled' and disabled_at < now() - interval '24 months'` → `erase_member(id, 'retention')` + delete auth user via the queued cleanup.   |
| `flag_lapsed_members`     | Active members with no paid season in the last two seasons → appear in a "Bør vurderes" filter in the members tab (no automatic action; the board decides). |
| `purge_payments`          | Payment rows whose season ended more than 5 full financial years ago → delete.                                                                              |
| `purge_applications`      | Approved > 30 days, rejected/withdrawn > 90 days → delete.                                                                                                  |
| `purge_contact_messages`  | Older than 12 months → delete.                                                                                                                              |
| `purge_registrations`     | Unpaid registrations for events that ended > 3 months ago → delete.                                                                                         |
| `purge_erasure_log`       | Older than 1 year → delete.                                                                                                                                 |
| `finish_pending_cleanup`  | Retry storage/auth deletions left by step 3.7.                                                                                                              |
| (security plan) audit log | Older than 2 years → delete.                                                                                                                                |

Each job is a SQL function with a pgTAP test using fixed timestamps.

### Step 5 — Backups and restore

Supabase's free tier has no downloadable backups. The security plan's weekly age-encrypted dump
(`SECURITY_AND_RELIABILITY.md`, S7: private repo `mamf92/sbsk-backups`, kept 12 weeks) is a copy
of personal data too: document in the privacy policy that deleted data disappears from backups
within 12 weeks.

A dump taken before an erasure also predates that erasure's `erasure_log` row, so the ledger
inside a restored dump cannot be trusted to be complete. Keep the ledger **independently**:

- The weekly backup job (S7) also writes `erasure_log` on its own (hashes only, no personal data)
  to a separate file, `erasure-ledger-<date>.csv`, retained **1 year** (longer than any dump),
  next to but not inside the dumps.
- `erase_member()` runs on every deletion, so between backups the live database holds the only
  copy of recent hashes. The restore runbook (`SECURITY_AND_RELIABILITY.md`, S7) therefore
  starts by exporting `erasure_log` from the live database if it is still reachable.

Restore runbook: (1) export the live `erasure_log` if possible; (2) take the newest standalone
ledger file; (3) restore the dump; (4) merge both ledgers into the restored `erasure_log`
(`insert … on conflict do nothing`); (5) run `reapply_erasures()`, which erases every member
whose hash is in the merged ledger; (6) re-run the storage/auth cleanup for those ids. If the
live database is gone and the newest ledger file is older than an erasure, that erasure can be
lost. The window is at most one week; the runbook says so, and after such a restore the board
re-runs any deletion it handled by email in that week.

### Step 6 — Processor agreements and records (Martin / the board, no code)

- [ ] Accept Supabase's DPA (dashboard → Organization → Legal documents). Confirm region
      `eu-central-1` stays (it is today).
- [ ] Resend DPA; choose the EU sending region if the account offers one.
- [ ] Cloudflare DPA (accept in the dashboard) if hosting or Turnstile runs there.
- [ ] GitHub Pages: covered by GitHub's DPA for the account owner; note in the policy that the
      host sees IP addresses.
- [ ] Record of processing (art. 30): the data-inventory table above is it — keep a dated copy
      in the board's files once a year.
- [ ] Breach routine: who checks, who decides, Datatilsynet notified within 72 hours (art. 33),
      members told without undue delay if the risk is high (art. 34). One paragraph in the
      board's handbook; the security plan's alerting feeds it.
- [ ] Accounting retention: confirm with the treasurer whether the club is bokføringspliktig
      **[confirm]**. If it is not, the 5 years can shrink to what the club's own statutes or
      auditor require; the plan uses 5 years until told otherwise.
- [ ] Board resolution adopting the privacy policy and terms (styrevedtak), with the version id.

## Privacy policy — outline (`legal.json` → `privacy.*`)

Plain language, short sentences, headings as questions. Norwegian first; English mirrors it.

1. **Hvem er ansvarlig?** Club name, org.nr, address, email, privacy contact.
2. **Hva samler vi inn, og hvorfor?** A friendly version of the inventory table: what, why,
   legal basis in plain words ("fordi du er medlem", "fordi loven krever det", "fordi vi har en
   berettiget interesse i å …").
3. **Hvor lagres det?** Supabase in the EU (Frankfurt). Sanity holds only public website
   content. List of services that process data for us and what they see (Supabase, Resend, web
   host, Cloudflare Turnstile) and separate controllers (Vipps MobilePay, Spond). Transfers
   outside the EU/EEA: none for stored data; providers' support access covered by their DPAs
   and the EU standard contractual clauses.
4. **Hvem ser hva?** Other members see name, photo and bio, and which events you've signed up
   for — unless you turn that off. The board sees the register and payments. Nobody outside
   the club sees anything. We never sell data, show ads, or use analytics or tracking.
5. **Hvor lenge?** The retention column, in words.
6. **Dine rettigheter.** Access, correction, deletion, restriction, portability, objection
   (to the legitimate-interest parts, e.g. check-in statistics); how: the buttons on Min side,
   or email; answer within one month; complaint to Datatilsynet (datatilsynet.no).
7. **Barn.** Own account from 13; younger members registered by a parent/guardian.
8. **Lagring i nettleseren.** The four local-storage items and why no cookie banner is needed.
9. **Sikkerhet.** EU hosting, encryption in transit and at rest, access control, 2FA for the
   board, encrypted backups kept 12 weeks.
10. **Endringer.** Versioned; members asked to re-accept on material changes.

## Terms — outline (`legal.json` → `terms.*`)

1. **Medlemskap**: season = calendar year; fee set by the annual meeting (årsmøtet); paid via
   Vipps or bank; membership confirmed when paid; not refunded once the season has started.
2. **Konto**: one person per account; keep your codes and password to yourself; the board uses
   two-factor sign-in; we may disable an account that breaks these terms or the club's rules.
3. **Oppførsel**: friendly and inclusive; harassment or cheating can lead to disabling the
   account and exclusion per the club's statutes.
4. **Innhold du laster opp**: you must have the right to the photo; no offensive content; the
   board may remove it.
5. **Arrangementer**: sign off if you can't come; paid events have their own refund terms shown
   at sign-up; the right of withdrawal (angrerett) does not apply to leisure events on a fixed
   date (angrerettloven § 22 m) **[confirm wording]**.
6. **Ansvar**: the club is run by volunteers; the site is provided as-is; club games are used
   at your own care.
7. **Endringer og kontakt**; Norwegian law.

## Tests

- **pgTAP**: `erase_member` on a fully seeded member (every table above has a row) leaves zero
  rows referencing them anywhere, `event_headcounts` increased by their check-ins, payments
  unlinked with name kept, every `audit_personal_keys()` key redacted in old and new snapshots (including the audit rows the erasure itself just wrote) and
  actor nulled where they acted, `erasure_log` row present; refuses the last
  admin; callable only by `service_role`. Each retention job with fixed clocks.
  `reapply_erasures()` removes a re-inserted member when given a ledger merged from outside the
  restored dump (simulate: dump, erase, restore the dump, merge the saved ledger, reapply).
- **pgTAP inventory guard**: a test lists every `public` table and every column whose name
  matches `email|name|phone|supabase_id|member_id|photo|bio|birth` and fails if a table is not
  in an allowlist that maps it to its erase/export handling. A new personal-data table without
  GDPR handling then breaks CI.
- **Deno tests** (`supabase/functions/gdpr-*/index.test.ts`): auth required, re-auth window,
  wrong confirmation word, admin variant requires admin_session, rate limit, no secrets in the
  export, response headers.
- **Vitest**: settings section states (download in progress, error, re-auth prompt, typed
  confirmation enables the button only on exact match in the active language).
- **Playwright**: download produces a JSON file with the expected top-level keys (stubbed
  function); delete flow through dialog → goodbye page → signed out; `/personvern` and
  `/vilkår` render in both languages and are linked from the footer; axe scan.

## Acceptance

- A member can download their data and delete their account from Min side without contacting
  anyone, and the board can do both on a member's behalf.
- After deletion, no table, bucket or auth record references the person except the unlinked
  payment rows the law requires.
- The privacy policy states, in both languages, exactly what the data inventory says, and the
  PR template makes keeping them in sync part of every change.
