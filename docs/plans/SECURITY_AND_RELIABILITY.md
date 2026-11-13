# Plan — security and reliability baseline

Status: **planned**, written 2026-11-11. Owner: Martin (decisions, settings, secrets) and agents
(everything in the repo). Each work package below is written to be picked up by an agent on its
own: it names the files, the steps, the acceptance criteria and the tests. Turn each one into a
GitHub issue before starting it, and follow the issue bookkeeping rules in
`.claude/skills/steward/SKILL.md`.

This plan is cross-cutting. The feature phases (event pages, admin page, member list and signup,
contact form, PWA, Vipps, GDPR) each have their own plan; every one of them must meet the
**rules for every feature** in section 3 of this document.

## 1. Where we are today

A lot is already in place. Do not redo any of it; build on it.

| Area                   | Already done                                                                                                                                                                                                                                                                                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| XSS                    | No `dangerouslySetInnerHTML` anywhere in `src/`. Sanity rich text goes through `@portabletext/react` components (`src/sanity/editors/portableTextComponents.tsx`). React 19 escapes text and blocks `javascript:` URLs in `href`. Sanity `url` fields validate `scheme: ['http', 'https']`.                                                                 |
| CSP                    | `src/security/csp.ts`, injected as `<meta>` by `vite.config.ts`. `script-src 'self'` in production, no inline script, no eval. `e2e/csp.spec.ts` fails on any violation.                                                                                                                                                                                    |
| Admin boundary         | One source of truth: `members.is_admin`, read by `public.member_is_admin()` (SECURITY DEFINER, pinned `search_path`). Every admin branch of every RLS policy calls it. `profiles.is_admin` is frozen by a trigger. Anon cannot execute it (`20261107093420_revoke_anon_member_is_admin.sql`). The client probe `isBoardAdmin()` is a UX hint, never a gate. |
| Invite-only signup     | `hook_restrict_signup_by_email_list()` auth hook rejects any sign-up whose email is not on the member list.                                                                                                                                                                                                                                                 |
| Storage                | `profile-images` bucket is private, signed URLs, per-user prefix enforced in RLS, 5 MB limit, MIME allowlist without SVG.                                                                                                                                                                                                                                   |
| Server-side writes     | `supabase/functions/update-event-participants` takes the actor from the verified JWT and uses a user-scoped client, so RLS still applies.                                                                                                                                                                                                                   |
| Supply chain           | Every action pinned to a commit SHA. Dependabot weekly for npm and actions. `npm audit --audit-level=critical` blocks PRs. `overrides` pin known-bad transitive packages.                                                                                                                                                                                   |
| Repo hygiene           | `SECURITY.md` with private vulnerability reporting, `CODEOWNERS`, `main` ruleset with required checks (`.github/rulesets/main.json`), no committed `.env`.                                                                                                                                                                                                  |
| Tests                  | Vitest unit tests; Playwright smoke suite against a production build with a request-reading Supabase stub (`e2e/fixtures/supabase.ts`) and real GROQ via `groq-js` (`e2e/fixtures/sanity.ts`).                                                                                                                                                              |
| Release flow (planned) | Epic #257 (dev → staging → main), #261 (promotion guard), #262 (staging Supabase project), #263/#264 (staging Sanity dataset and site). This plan depends on #262 for database tests against something that is not production, and does not duplicate it.                                                                                                   |

### Gaps this plan closes

1. **Admins sign in with a password only.** Anyone who phishes or reuses an admin's password
   gets the whole member list. No second factor exists anywhere.
2. **RLS has no tests.** The policies are the real security boundary, and nothing in CI runs a
   query against them. The e2e stub cannot (its own header says so).
3. **CMS URLs are only validated in the Studio.** `rule.uri(...)` stops an editor publishing a
   bad link, but a document written through the API skips Studio validation. Render-time code
   (`href={value.url}`, `href={sponsor.link}`, `href={buyUrl}` …) trusts whatever arrives.
4. **No code scanning, no scheduled audit.** CodeQL is not running; `npm audit` only runs when
   someone opens a PR, so an advisory published on a quiet week goes unseen.
5. **Stale CORS origins.** Sanity allows credentialed requests from `http://10.0.0.33:5173` (a
   LAN address from local development), and the same origin is in the edge function's
   `allowedOrigins`. Whoever holds that address on a network can make credentialed Studio
   requests from it. Remove it.
6. **No audit trail.** If an admin edits or deletes a member there is no record of who did it.
7. **Supabase advisors are checked by hand**, when someone remembers.

## 2. Decisions

These are made. Revisit only with a reason that is not in the "why" column.

| #   | Decision                                                                                                                                                                                                                                                                      | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **Keep the repository public.**                                                                                                                                                                                                                                               | Making it private hides nothing that matters: the deployed bundle, the Supabase URL, the publishable key and every query are readable in any browser's devtools, by design. The security lives in RLS and the auth hook, not in the source being secret. Going private would _cost_ us: GitHub Pages from a private repo needs a paid plan, and CodeQL, secret scanning with push protection and private vulnerability reporting are free only for public repos. |
| D2  | **TOTP two-factor (authenticator app) is mandatory for every admin, enforced by the database.** Optional for ordinary members.                                                                                                                                                | Supabase Auth MFA with TOTP is free on every plan. SMS MFA is a paid add-on and weaker. Enforcing it in RLS (JWT claim `aal = 'aal2'`) means a stolen password plus a hand-crafted API call still gets nothing, regardless of what the client does.                                                                                                                                                                                                              |
| D3  | **"Is an admin" and "is acting as an admin" become two functions.** `member_is_admin()` stays as the identity probe; a new `admin_session()` adds the `aal2` check and replaces `member_is_admin()` inside every policy.                                                      | The client must be able to ask "should this person be prompted for their code?" at `aal1`. If `member_is_admin()` itself required `aal2`, the client could not tell an admin who has not entered the code from a non-admin.                                                                                                                                                                                                                                      |
| D4  | **Recovery is two factors per admin plus a human.** Each admin enrolls two TOTP factors (phone app and a password manager). If both are lost, Martin removes the factor from the Supabase dashboard after confirming identity in person.                                      | Supabase MFA has no backup codes. Two factors covers a lost phone; the dashboard covers the rest; a written procedure stops it being improvised.                                                                                                                                                                                                                                                                                                                 |
| D5  | **Every admin action that changes data writes an audit row, by trigger, not by client code.**                                                                                                                                                                                 | A client can skip a call; it cannot skip a trigger.                                                                                                                                                                                                                                                                                                                                                                                                              |
| D6  | **One render-time URL guard, `safeHref()`, for every URL that comes from the CMS or from a member.** A lint rule bans the raw patterns.                                                                                                                                       | React 19 already neutralises `javascript:`, but `data:` and protocol-relative URLs still get through, and a single tested helper is easier to keep right than a dozen call sites.                                                                                                                                                                                                                                                                                |
| D7  | **No HTML from users, ever.** Member-written text (bios, contact messages, event comments) is plain text rendered as text. If rich text is ever needed it is Portable Text, not Markdown-to-HTML.                                                                             | Removes the whole stored-XSS class rather than sanitising it. DOMPurify stays only as the transitive dependency it already is.                                                                                                                                                                                                                                                                                                                                   |
| D8  | **Weekly automated audit runs in GitHub Actions and reports into one rolling issue.** No third-party SaaS scanner.                                                                                                                                                            | Free, reviewable as code, and nobody has to remember to look somewhere else.                                                                                                                                                                                                                                                                                                                                                                                     |
| D9  | **CodeQL as a workflow file, not "default setup".**                                                                                                                                                                                                                           | It is then versioned, pinned and reviewable like the rest of CI.                                                                                                                                                                                                                                                                                                                                                                                                 |
| D10 | **RLS is tested with pgTAP against a local Supabase stack in CI** (`supabase start` + `supabase test db`).                                                                                                                                                                    | It is the only way to test the real policies without touching production. Docker is available on GitHub-hosted runners.                                                                                                                                                                                                                                                                                                                                          |
| D11 | **Accessibility checks join the e2e suite** with `@axe-core/playwright`, on every public page.                                                                                                                                                                                | Cheap, catches regressions the redesign will otherwise introduce, and "reliable" includes usable.                                                                                                                                                                                                                                                                                                                                                                |
| D12 | **No DAST scanner (OWASP ZAP) for now.**                                                                                                                                                                                                                                      | Against GitHub Pages it reports exactly the header findings `docs/HOSTING.md` already accepts as unfixable. Revisit when the site moves to a host that can send headers.                                                                                                                                                                                                                                                                                         |
| D13 | **Bot protection with Cloudflare Turnstile, on the Supabase Auth endpoints and on every public form that writes data**, switched on in the first PR that ships either the email-OTP sign-in (members phase) or a public form (contact form, guest event sign-up). Not before. | Invite-only OTP sign-in answers differently for emails that are and are not on the member list, so without a captcha it can be scripted to probe who is a member. Turnstile is free and Supabase Auth supports it natively, but it adds `https://challenges.cloudflare.com` to `script-src` and `frame-src` in `src/security/csp.ts`. Pay that cost when there is something to protect.                                                                          |

## 3. Rules for every feature

Every feature plan and every PR from now on must meet these. Reviewers (human or agent) check
them; the PR template gets a short checklist (work package S1.4).

**Data and access**

1. Every new table has RLS enabled in the same migration that creates it, and at least one
   policy per operation the app uses. No policy `to anon` unless the data is public on purpose,
   and the migration comment says why.
2. Admin-only access uses `public.admin_session()` (after S2 lands; `member_is_admin()` before).
   Never check admin status in the client and trust it.
3. A row a member owns is matched on `auth.uid()`, never on an id the client sends.
4. Anything that needs the service-role key runs in an edge function, and the function checks
   the caller's JWT and, for admin actions, calls `admin_session()` with the caller's token
   before using the service-role client. The service-role key is never in a `VITE_` variable.
5. Every new table and policy gets pgTAP tests in `supabase/tests/` (after S4 lands): one test
   per role (anon, member, other member, admin at `aal1`, admin at `aal2`) per operation.
6. Nothing personal goes into Sanity. The `production` dataset is publicly readable. Names,
   emails, phone numbers, payment status, sign-ups: Supabase only.

**Rendering**

7. No `dangerouslySetInnerHTML`, no `innerHTML`, no `eval`, no `new Function`. Lint enforces it.
8. Every `href` or `src` whose value comes from Sanity, Supabase or a URL parameter goes
   through `safeHref()` / `safeSrc()`.
9. Member-written text is rendered as React text children. Line breaks via CSS
   (`whitespace-pre-line`), not by injecting `<br>`.
10. HTML emails built in an edge function escape every interpolated value with the shared
    `escapeHtml()` in `supabase/functions/_shared/`.

**Third parties**

11. A new script, frame, font, image or API host is added to `src/security/csp.ts` with a
    comment saying why, in the same PR. `e2e/csp.spec.ts` fails otherwise.
12. A new edge function allows only the origins in `supabase/functions/_shared/cors.ts` (S1.3).

**Tests**

13. A feature ships with unit tests for its logic, Playwright specs for its main flows (happy
    path, one failure path, the signed-out and wrong-role path), and pgTAP tests for its
    tables. See section 6 for what "main flows" means per feature.

## 4. Work packages

Ordered. S1 and S3 can start immediately and in parallel. S2 needs S1.2 and S2a must be live
and used by every admin before S2b is applied. S4 needs the baseline migration in S4.1.
Sizes: S = under half a day for an agent, M = about a day, L = several days.

### S1 — Quick hardening (all S)

**S1.1 Remove the stale LAN origin.**

- Sanity: delete the CORS origin `http://10.0.0.33:5173` (Sanity MCP `cors_origins_delete`, or
  manage.sanity.io → API → CORS origins). Keep `https://mamf92.github.io`,
  `http://localhost:5173`, `http://localhost:4173`.
- `supabase/functions/update-event-participants/index.ts`: remove it from `allowedOrigins`
  (moved into the shared module in S1.3).
- Acceptance: `cors_origins_list` returns three origins; the function's origin list has no
  private-network address.

**S1.2 `safeHref()` and `safeSrc()`.**

- New `src/utils/safeUrl.ts`:
  - `safeHref(value: unknown): string | undefined` returns the input only when it parses as an
    absolute `https:` or `http:` URL, a `mailto:` or `tel:` URL, or a same-origin relative path
    starting with a single `/` (not `//`). Everything else returns `undefined`, so React omits
    the attribute and the element renders as plain text or an inert link.
  - `safeSrc(value: unknown): string | undefined` allows `https:` only, plus `blob:` for upload
    previews.
- Replace every CMS- or DB-sourced `href`/`src`. Current call sites:
  `src/sanity/editors/portableTextComponents.tsx:86`, `src/components/ui/GameCard.tsx`
  (`buyUrl`, `bggUrl`, `videoUrl`), `src/components/ui/HeroLinks.tsx`,
  `src/components/ui/Carousel.tsx`, `src/components/ui/SanityImage.tsx`,
  `src/components/sections/AboutUsSection/AboutUsSection.tsx`,
  `src/components/sections/CalendarSection.tsx`, `src/components/sections/HomeHeroSection.tsx`
  (two), `src/pages/SingleEventPage.tsx` (`sponsor.link`), `src/pages/PostPage.tsx` (`link.url`, if that page has landed). Re-grep `href={` and `src={` before
  starting; the list will have grown.
- External links keep `rel="noopener noreferrer"` when `target="_blank"`.
- Tests: `src/utils/safeUrl.test.ts` with a table of inputs: `javascript:alert(1)`,
  `JaVaScRiPt:`, `\tjavascript:`, `data:text/html,…`, `vbscript:`, `//evil.example`,
  `/\evil.example`, `https://ok.example`, `mailto:a@b.no`, `/kalender`, `''`, `null`, a number.
  Plus one component test per touched component asserting that a `javascript:` URL from the
  fixture renders without an `href`.

**S1.3 Shared edge-function helpers.**

- `supabase/functions/_shared/cors.ts`: `corsHeaders(origin)`, reading the allowed origins
  from an `ALLOWED_ORIGINS` function secret (comma-separated), falling back to the production
  origin plus the two localhost ports when unset. Staging (#264) sets its own value, so no code
  change is needed per environment.
- `supabase/functions/_shared/auth.ts`: `requireUser(req)` (verifies the JWT with
  `supabase.auth.getUser()` on a user-scoped client, returns the user and that client or a 401)
  and `requireAdmin(req)` (calls `requireUser`, then `rpc('admin_session')` with the user's own
  client; 403 unless `true`). Before S2b lands, `requireAdmin` calls `member_is_admin`.
- `supabase/functions/_shared/html.ts`: `escapeHtml()` for email templates.
- Move `update-event-participants` onto `cors.ts` and `requireUser`.
- Acceptance: no edge function defines its own origin list; Deno unit tests for `escapeHtml`
  and for the CORS helper (`deno test supabase/functions/_shared`), run in CI in S4.

**S1.4 Lint and template guardrails.**

- `eslint.config.js`: add `no-restricted-syntax` / `no-restricted-properties` rules for
  `dangerouslySetInnerHTML` (JSXAttribute), assignments to `innerHTML`/`outerHTML`,
  `insertAdjacentHTML`, `document.write`, and `no-eval` / `no-implied-eval` /
  `no-new-func`. Test files may read `innerHTML`; scope the assignment rule to `src/**` minus
  `*.test.tsx` if needed. No new dependency.
- `.github/pull_request_template.md`: add a three-line "Security" checklist (RLS for new
  tables, CSP updated for new hosts, no user HTML) under the existing sections.
- Acceptance: `npm run lint` fails on a scratch file using `dangerouslySetInnerHTML` (verify
  locally, do not commit the scratch file).

**S1.5 Supabase Auth settings (Martin, in the dashboard).** Listed in section 7.

### S2 — Two-factor authentication for admins (L)

Supabase docs to read first: "Multi-Factor Authentication" and "MFA (TOTP)" in the Supabase
Auth guide. APIs used: `supabase.auth.mfa.enroll`, `challenge`, `verify`, `challengeAndVerify`,
`listFactors`, `unenroll`, `getAuthenticatorAssuranceLevel`.

**S2a — Enrollment and challenge UI (client only, nothing enforced yet).**

Routes (Norwegian slugs, added to `src/main.tsx` inside the same auth-guarded group as
`styreportal`):

| Route                | Page component                     | Purpose                                                                         |
| -------------------- | ---------------------------------- | ------------------------------------------------------------------------------- |
| `/to-faktor`         | `src/pages/TwoFactorChallenge.tsx` | Enter the six-digit code after password sign-in.                                |
| `/to-faktor/oppsett` | `src/pages/TwoFactorSetup.tsx`     | Enroll: show the QR code (SVG from `enroll()`) and the secret, verify one code. |

Steps:

1. `src/supabase/queryHelpers/mfa.ts`: thin wrappers `getAssurance()`, `listTotpFactors()`,
   `enrollTotp(friendlyName)`, `verifyTotp(factorId, code)`, `unenrollFactor(factorId)`. Each
   throws on error like the other helpers.
2. The QR code arrives from `enroll()` as an SVG data URI. Render it with
   `<img src={qr} alt="QR-kode for autentiseringsapp">`; `data:` is already in `img-src`. Do
   **not** inline the SVG markup. Also show the text secret for password managers.
3. `useAuthActions.signInWithPassword`: after sign-in, if `isBoardAdmin()` is true, call
   `getAssurance()`. `nextLevel === 'aal2' && currentLevel === 'aal1'` → navigate to
   `/to-faktor?neste=<path>`. No factor enrolled (`nextLevel === 'aal1'`) → navigate to
   `/to-faktor/oppsett`.
4. `boardPortalLoader` (and every future admin loader, via a shared
   `src/loaders/requireAdminSession.ts`): signed out → `/login`; not admin → member portal
   (existing behaviour); admin at `aal1` → `/to-faktor` or `/to-faktor/oppsett`.
5. Member portal ("Min profil"): a "To-faktor-innlogging" section listing factors with a
   remove button and an "add another" button. Admins see a notice until they have two.
6. Validate the code field with Zod (pattern `^\d{6}$`), consistent with #83/#243.
7. Copy is Norwegian, plain language; include a one-line explanation of what an authenticator
   app is and name two free ones (Google Authenticator, Microsoft Authenticator) plus "or your
   password manager".

Tests:

- Unit: `mfa.ts` wrappers with a mocked client; the redirect decision in
  `requireAdminSession` as a table (signed-out, member, admin aal1 no factor, admin aal1 with
  factor, admin aal2).
- e2e: extend `e2e/fixtures/supabase.ts` to answer `/auth/v1/factors`,
  `/auth/v1/factors/:id/challenge` and `/verify`, and to issue a session whose JWT carries
  `aal`. Specs: admin at `aal1` visiting `/styreportal` lands on `/to-faktor`; a correct code
  lands on `/styreportal`; a wrong code shows an error and stays; an admin without a factor
  lands on setup.

Rollout: merge, deploy, then **every admin enrolls two factors**. Martin confirms in the
dashboard (Authentication → Users → each admin shows two verified factors) before S2b.

**S2b — Enforcement in the database.**

Migration `supabase/migrations/<remote-version>_admin_session_requires_aal2.sql`
(name it with the remote version, per project memory):

```sql
-- The admin boundary now requires a second factor (plan: docs/plans/SECURITY_AND_RELIABILITY.md, S2).
-- member_is_admin() stays the identity probe the client uses to decide whether to prompt for a code.
create or replace function public.admin_session()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select public.member_is_admin()
     and coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2';
$$;

revoke execute on function public.admin_session() from public, anon;
grant execute on function public.admin_session() to authenticated, service_role;
```

Then recreate every policy that calls `member_is_admin()` to call `admin_session()` instead.
Find them with:

```sql
select schemaname, tablename, policyname, cmd, qual, with_check
from pg_policies
where qual ilike '%member_is_admin%' or with_check ilike '%member_is_admin%';
```

As of this writing that is: the four `profiles` policies, `event_participants` delete, the
`members` policies (created in the dashboard, so read them live before writing the migration),
`contact_messages` read policy, and the `prevent_admin_escalation()` trigger function. Storage
policies too if any admin branch exists there.

Also add a restrictive policy on `members` so even a future permissive policy cannot open it to
an `aal1` admin by accident:

```sql
create policy "Admin writes need a second factor"
  on public.members as restrictive for all to authenticated
  using (public.admin_session() or supabase_id = auth.uid())
  with check (public.admin_session());
```

(Adjust the `using` half to whatever self-read the members feature needs; the point is that
writes require `aal2`.)

Client: `isBoardAdmin()` keeps calling `member_is_admin` (identity). Add
`hasAdminSession()` calling `admin_session` for UI that should only show at `aal2`.

Acceptance:

- pgTAP (S4): admin at `aal1` gets zero rows / permission denied on `members`; admin at `aal2`
  reads and writes; member at `aal2` (an optional member factor) is still not an admin.
- Manual on production after apply: Martin signs in, is asked for the code, reaches the
  board portal. Supabase security advisors show no new warnings.

**S2c — Recovery runbook.** Add a "Lost authenticator" section to `SECURITY.md`'s maintainer
notes (or `docs/RUNBOOK.md` if #265 has created it): confirm identity in person or by phone
with a known number, Supabase dashboard → Authentication → Users → the user → remove factor,
the admin re-enrolls at next sign-in, note it in the audit log table manually.

**Sanity Studio.** Studio access is Sanity accounts, not Supabase. Studio cannot enforce MFA on
the free plan; the identity provider does. Rule (Martin, section 7): every Sanity project member
signs in with Google or GitHub, and has 2FA on that account. Remove members who no longer edit.
Review the member list in the monthly check (S5.3).

### S3 — Audit log and session hygiene (M)

1. Migration: `public.admin_audit_log (id bigint identity, at timestamptz default now(),
actor uuid default auth.uid(), table_name text, row_id text, action text, old jsonb, new
jsonb)`. RLS on; select for `admin_session()` only; no insert/update/delete policy at all.
2. A SECURITY DEFINER trigger function `log_admin_change()` attached `after insert or update or
delete` on `members`, and later on every admin-managed table (payments, event sign-ups made by
   an admin, check-ins). Store only changed columns in `old`/`new` to keep it small.
3. Revoke execute on the trigger function from `public, anon, authenticated` (same pattern as
   `20260809200650`).
4. GDPR interplay: both the `old` and the `new` snapshot of every audit row about a member hold
   their personal data, from the insert that created them through every edit. When a member is
   deleted (GDPR plan), the deletion function rewrites **every** audit row whose `row_id` is
   that member, setting every personal key in both snapshots to `'[slettet]'`: today `name`,
   `surname`, `email`, `phone`, `address`, `postcode`, `city`, `photo_url`, `bio` (check the
   columns `createMember.ts`/`editMember.ts` write, and every table the trigger is attached to,
   when implementing). Define the key list once, as `public.audit_personal_keys()`, so the
   trigger and the deletion function cannot drift, and keep `action`, `at`, `actor` and
   non-personal keys such as `is_admin`. Rows where the deleted member is the `actor` keep the
   row and set `actor` to null. Retention: rows older than two years are deleted by a scheduled
   `pg_cron` job. Document both in the privacy policy.

   Test (pgTAP): create a member, edit their phone and address, delete them, then assert that no
   audit row contains any of their original personal values in `old` or `new`.

5. Board portal: a read-only "Endringslogg" panel (last 50 entries) once the admin page plan
   reaches it. Not part of this package.
6. Sign-out everywhere: "Logg ut på alle enheter" button in the member portal calling
   `supabase.auth.signOut({ scope: 'global' })`. Admins are told to use it if a device is lost.

Tests: pgTAP that a member cannot read the log, an `aal2` admin can, nobody can write to it
directly, and an update on `members` produces exactly one row with the actor set.

### S4 — Database tests in CI (L)

**S4.1 Baseline migration (prerequisite, needs the live project awake).** The migrations in
`supabase/migrations/` start from tables that were created in the dashboard (`members`,
`profiles`, the signup hook, `handle_new_user`). A fresh database cannot be built from them.

- With the project active, dump the schema of `public` and the relevant `storage` policies
  (Supabase MCP `execute_sql` reading `pg_catalog`, or `supabase db dump --schema public` with
  the database password Martin provides as a session secret) into
  `supabase/migrations/00000000000000_baseline.sql`, ordered before everything else, and make
  every later migration idempotent against it (`if not exists`, `drop … if exists`).
- Do **not** apply the baseline to production; mark it applied there with
  `supabase migration repair --status applied 00000000000000` (Martin or an agent with the
  token), so production history matches the repo.
- Add `supabase/config.toml` (from `supabase init`) with auth settings matching production:
  invite-only hook enabled, MFA TOTP enroll and verify enabled, minimum password length.
- Acceptance: `supabase start && supabase db reset` on a clean machine builds the full schema
  with no errors, and a schema diff against production (`supabase db diff --linked`) is empty.

This is the same work #262 (staging project) needs. Do it once, under whichever issue starts
first, and link the other.

**S4.2 pgTAP suites.** `supabase/tests/*.test.sql`, run by `supabase test db`.

- `supabase/tests/helpers.sql`: create auth users and set the role and JWT claims per test,
  e.g. `select set_config('request.jwt.claims', json_build_object('sub', <uuid>, 'role',
'authenticated', 'aal', 'aal2')::text, true); set local role authenticated;`. (The
  community `basejump-supabase_test_helpers` package does this; vendoring its SQL is fine,
  adding it as a dbdev dependency is not needed.)
- One file per table: `profiles`, `members`, `event_participants`, `contact_messages`,
  `storage_profile_images`, `admin_audit_log`, and one for functions (`member_is_admin`,
  `admin_session`, grants: anon cannot execute either).
- Matrix per table: anon / member A / member B / admin `aal1` / admin `aal2` × select /
  insert / update / delete, asserting rows returned or `throws_ok(…, '42501')`.
- `profiles.is_admin` escalation: a member inserting or updating `is_admin = true` throws.

**S4.3 CI job.** New job `Database tests` in `.github/workflows/ci.yml`:

```yaml
db:
  name: Database tests
  runs-on: ubuntu-latest
  timeout-minutes: 15
  steps:
    - uses: actions/checkout@<sha> # pin like the others
    - uses: supabase/setup-cli@<sha> # pin; version: latest stable at time of writing
    - run: supabase start -x studio,imgproxy,inbucket,edge-runtime,logflare,vector,supavisor
    - run: supabase test db
    - run: deno test supabase/functions/_shared # after S1.3; needs denoland/setup-deno pinned
```

Only run it when `supabase/**` changes (`dorny/paths-filter` pinned, or a separate workflow
with `paths:`), but report a passing status otherwise so it can be a required check. Add the
context `Database tests` to `.github/rulesets/main.json` and tell Martin to re-import it
(section 7). The stub in `e2e/fixtures/supabase.ts` stays: it tests the client; pgTAP tests the
database.

### S5 — Scheduled audits (M)

**S5.1 CodeQL.** `.github/workflows/codeql.yml`: `github/codeql-action` (`init`, `analyze`,
pinned by SHA), language `javascript-typescript`, `build-mode: none`, query suite
`security-extended`. Triggers: `pull_request` to `main`, `push` to `main`, and `schedule:
cron '30 4 * * 1'` (Monday 05:30 Oslo in winter). `permissions: security-events: write,
contents: read`. Exclude `dist/`, `node_modules/` and test fixtures via a `paths-ignore` config.
Add `CodeQL` as a required check once it has run green twice. Dependabot already re-pins the
action.

**S5.2 Weekly security workflow.** `.github/workflows/security-weekly.yml`, schedule Monday
`0 5 * * 1` plus `workflow_dispatch`. Permissions: `contents: read`, `issues: write`. Jobs:

1. **Dependencies.** `npm ci`, `npm audit --audit-level=high --json > audit.json`. Report
   every advisory at high or above with its path; known accepted advisories (listed in the
   `ci.yml` audit comment) are filtered by GHSA id from a small `security/accepted-advisories.json`
   that carries a reason and a review-by date per entry. An entry past its date counts as a
   finding.
2. **Supabase advisors.** `curl` the Supabase Management API security advisors endpoint for the
   project (`GET https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/advisors/security`;
   check the current path in the Management API reference before writing it) with
   `SUPABASE_ACCESS_TOKEN` from repo secrets. Accepted lints (0029 on `member_is_admin` and
   `admin_session`, leaked-password protection while on the free plan) are filtered the same way.
   If the project is paused, report "paused" as information, not failure, and do not wake it.
3. **Live smoke.** Run a read-only Playwright project `live` (new, in `playwright.config.ts`,
   `baseURL` `https://mamf92.github.io/sbsk-website/`, only specs tagged `@live`) against the
   deployed site: every public route renders its `<h1>`, no CSP violations, no console errors,
   the Sanity content loads. No sign-in, no writes.
4. **Report.** A final job collects the three outputs into Markdown and creates or updates a
   single open issue titled `Ukentlig sikkerhetsrapport` (label `security`), using
   `actions/github-script` pinned. If everything is clean, it comments "Ingen funn" and closes
   the issue; a finding reopens it, which notifies Martin.

Note: GitHub disables scheduled workflows in a public repo after 60 days without repository
activity. Dependabot's weekly PRs normally count as activity; if the workflow is ever disabled,
the Actions tab shows a banner to re-enable it.

**S5.3 Monthly manual check (calendar reminder for Martin, 15 minutes).** Sanity project members
and their sign-in method; Supabase Authentication → Users with admin flag; GitHub
collaborators and deploy keys; repo secrets still needed; review open Dependabot and code
scanning alerts. A checklist issue template `.github/ISSUE_TEMPLATE/monthly-security-check.md`
holds the list.

**S5.4 Optional: a weekly agent review.** A scheduled Claude Code trigger that runs the
`security-review` skill over the week's merged diff on `main` and comments its findings on the
weekly report issue. Only set up when Martin asks for it; it costs usage every week, and S5.1–
S5.2 cover the mechanical part.

### S6 — End-to-end and reliability testing (M, then ongoing)

**S6.1 Structure.**

- Keep `e2e/` flat by area: `public/`, `auth/`, `admin/`, `member/`, `events/`, `live/`. Move
  existing specs only when a PR touches them anyway.
- Tags: `@smoke` (runs on every PR, under two minutes total), `@live` (S5.2), `@a11y`.
- Fixtures: grow `e2e/fixtures/supabase.ts` as features add tables. Every new table the client
  reads gets stub support in the same PR, with column names copied from the migration.
- Add a `mobile` Playwright project (`devices['Pixel 7']`) running only `@smoke` specs.
- Keep `retries: 1` in CI. A test that needs a retry twice in a week gets an issue; never skip
  or quarantine a test to make CI green.

**S6.2 Accessibility.** Add `@axe-core/playwright` as a dev dependency. `e2e/a11y.spec.ts`
visits every public route in light and dark theme and fails on `serious` or `critical`
violations, with a short, commented allowlist for issues already tracked (#170, #172).

**S6.3 Security specs.**

- `e2e/auth/guards.spec.ts`: signed-out → `/login` for every protected route; member → member
  portal with `reason=not_admin` for `/styreportal`; admin `aal1` → `/to-faktor`.
- `e2e/public/xss.spec.ts`: the Sanity fixture serves a post, event and game whose text
  contains `<img src=x onerror=alert(1)>` and whose links are `javascript:alert(1)` and
  `data:text/html,…`. Assert: no `dialog` event fires, the markup appears as literal text, and
  the links have no `href`. Same for a member bio and a contact message in the board portal.
- `csp.spec.ts` stays as is and covers every new route automatically if it iterates the router.

**S6.4 What each feature phase must cover** (the feature plans own the detail; this is the
floor):

| Feature                 | Must-have e2e flows                                                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Event pages (BGM)       | Each of the three page levels renders from fixture data; day tabs; programme times; map/meeting info; sign-up as member and as guest; full event shows waitlist. |
| Admin page              | Gate (signed-out, member, `aal1`, `aal2`); add, disable and re-enable a member; mark paid; check a participant in.                                               |
| Members list and signup | Invite-only: an email not on the list is refused with a clear message; an email on the list can register and sign in.                                            |
| Member page and GDPR    | Edit bio and avatar; download my data returns JSON with every table's rows for that user; delete account signs out and the account cannot sign in again.         |
| Contact form            | Send succeeds; validation errors; Turnstile token required (stubbed).                                                                                            |
| PWA                     | Manifest valid; service worker registers; offline fallback page shows; notification permission prompt only after a user action.                                  |
| Vipps                   | Redirect to the (stubbed) Vipps checkout; callback marks paid; a forged callback without a valid signature is rejected (unit/Deno test on the edge function).    |

**S6.5 Edge function tests.** Deno tests next to each function (`index.test.ts`) for request
validation, auth failures (no JWT, member calling an admin function, `aal1` admin) and CORS.
Run in the `Database tests` job.

### S7 — Weekly encrypted backups and the erasure ledger (M)

The Supabase free plan gives us no downloadable backups and no point-in-time recovery, and the
project pauses when idle. Member data has to be recoverable without depending on either.

**Decisions.**

- A weekly GitHub Actions job dumps the database and pushes it, encrypted, to a separate
  **private** repository, `mamf92/sbsk-backups`. Private and separate because this repo is
  public (D1): Actions artifacts here are downloadable by any signed-in GitHub user, and they
  expire after 90 days.
- Encryption with [`age`](https://github.com/FiloSottile/age) to a public key stored as the
  repo variable `BACKUP_AGE_RECIPIENT`. The private key never touches GitHub; Martin keeps it in
  his password manager plus one offline copy. A leaked backup repo then leaks ciphertext only.
- Profile images in storage are **not** backed up. Members can upload a new one; accepted.

**The erasure ledger.** The GDPR plan (`docs/plans/gdpr.md`, Step 5) keeps
`public.erasure_log`, holding only hashes of erased members, and `reapply_erasures()`. A
restored dump predates the erasures made after it was taken, and its own copy of the log is just
as old, so the job also writes the ledger to its own file:

| File                                   | Contents                                                                       | Kept                                        |
| -------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------- |
| `dumps/<date>.sql.age`                 | `supabase db dump` of schema and data (`public`, `auth` users and MFA factors) | 12 weeks; older ones are deleted by the job |
| `ledger/erasure-ledger-<date>.csv.age` | `public.erasure_log`, hashes only, as CSV                                      | 1 year                                      |

The ledger sits next to the dumps, never inside them, so it survives a restore of any dump.

**Workflow** `.github/workflows/backup-weekly.yml`, schedule `0 2 * * 0` plus
`workflow_dispatch`, `permissions: contents: read`:

1. `supabase/setup-cli` (pinned) and `age` from the distribution package.
2. If the project is paused, report it in the weekly security issue (S5.2) and stop; do not wake
   it. A paused project has no new data to lose.
3. Dump schema and data with `supabase db dump --db-url "$SUPABASE_DB_URL"` (once plain, once
   with `--data-only`), making sure the `auth` users and MFA factors are included (check the
   CLI's schema flags at the time of writing). Export the ledger with `psql` and
   `\copy public.erasure_log to 'ledger.csv' csv header`.
4. `age -r "$BACKUP_AGE_RECIPIENT"` on both; delete the plaintext in the same step.
5. Check out `mamf92/sbsk-backups` with `BACKUP_REPO_TOKEN` (a fine-grained token with contents
   write on that repo only). Add the two new files and drop files past their retention. Then
   **replace the history** rather than add to it: `git checkout --orphan next`, commit the
   retained set as one commit, `git push --force origin next:main`. Deleting a file in a normal
   commit would leave every expired dump recoverable from history, so erased members would live
   on in old dumps indefinitely and the repo would grow with every full dump. The backups repo
   gets no branch protection, so the force push is allowed there and nowhere else. GitHub can
   keep unreachable objects for a while after a force push; that window is accepted and noted
   in the privacy policy as "backups are deleted within 12 weeks plus a short processing delay".
6. Report "backup ok, N bytes" or the failure into the weekly security issue.

**Restore runbook** (add to `docs/RUNBOOK.md` when #265 creates it, else to this file):

1. Export the live `public.erasure_log`, if the live database can still be reached.
2. Take the newest `erasure-ledger-<date>.csv.age` from the backup repo and decrypt it.
3. Restore the chosen dump into the target project.
4. Load both ledgers into `public.erasure_log` with `on conflict do nothing`.
5. Run `select public.reapply_erasures();`.
6. Redo storage and auth cleanup for the ids it reports (delete their `profile-images/<uid>/`
   objects and their `auth.users` rows), as `erase_member()` does.

Test the runbook once a quarter against a local stack (`supabase start`, restore, reapply), and
once against the staging project when #262 exists.

## 5. Order and dependencies

```
S1 (quick hardening) ─┬─> S2a (MFA UI) ──> admins enroll ──> S2b (enforce) ──> S2c (runbook)
                      └─> S3 (audit log)
S4.1 (baseline) ──> S4.2 (pgTAP) ──> S4.3 (CI job)   [shared with #262]
S5.1, S5.2, S5.3 — independent, any time
S6.1–S6.3 — independent; S6.4 lands with each feature
S7 (backups) — independent; the ledger file starts once gdpr.md Step 5 lands
```

Recommended sequence for agents: S1 → S5.1 → S5.2 → S2a → S4 → S2b → S3 → S6.2/S6.3.
S2b should not merge before S4.2 has tests for it, so the enforcement migration is the first
policy change in this repo that is proven before it reaches production.

Feature work (event pages first) does **not** wait for this plan. It follows section 3 from
day one; anything in section 3 that depends on an unfinished package (pgTAP, `admin_session()`)
applies from the day that package merges.

## 6. Out of scope, on purpose

- **Moving off GitHub Pages.** Fixes the header-only findings in `docs/HOSTING.md`
  (clickjacking, COOP, caching). Separate decision with a cost; #186 tracks the environment
  side.
- **Trusted Types.** See `docs/HOSTING.md`.
- **Single sign-on across Sanity and Supabase** (#48).
- **Leaked-password protection** (HaveIBeenPwned check) is a Supabase Pro feature. Accepted on
  the free plan; mandatory admin TOTP covers the account type where it matters most.
- **Penetration test by a third party.** Not proportionate for a volunteer club site; revisit
  if payments volume grows after the Vipps phase.

## 7. What only Martin can do

Agents cannot reach these settings. Each line is one click or one paste.

| When            | Where                                               | What                                                                                                                                                 |
| --------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Now             | GitHub → Settings → Code security                   | Turn on Dependabot alerts, Dependabot security updates, secret scanning and push protection, private vulnerability reporting (check it is still on). |
| Now             | Supabase → Authentication → Providers → Email       | Minimum password length 10; require letters and digits; "Secure email change" on.                                                                    |
| Now             | Supabase → Authentication → Multi-Factor            | TOTP: enroll and verify enabled. Phone: off.                                                                                                         |
| Now             | Supabase → Authentication → Rate limits             | Check sign-in and OTP limits are at defaults or lower.                                                                                               |
| Now             | Supabase and Sanity and GitHub accounts             | 2FA on Martin's own accounts (and every other Supabase/Sanity org member).                                                                           |
| Now             | Sanity → project members                            | Remove anyone who no longer edits; everyone signs in with Google or GitHub that has 2FA.                                                             |
| Before S2a ends | Board members                                       | Every admin enrolls two authenticator factors.                                                                                                       |
| S4.1            | Supabase                                            | Wake the project if paused, and approve marking the baseline migration as applied.                                                                   |
| S5.2            | GitHub → Settings → Secrets and variables → Actions | Add `SUPABASE_ACCESS_TOKEN` (an `sbp_` personal access token) and `SUPABASE_PROJECT_REF` as repository secrets.                                      |
| After S4.3/S5.1 | GitHub → Settings → Rules                           | Re-import `.github/rulesets/main.json` with `Database tests` and `CodeQL` as required checks.                                                        |
| S7              | GitHub                                              | Create the private repo `mamf92/sbsk-backups`; add a fine-grained token for it as secret `BACKUP_REPO_TOKEN`.                                        |
| S7              | Supabase → Project settings → Database              | Add the connection string (session pooler) as secret `SUPABASE_DB_URL`.                                                                              |
| S7              | Locally                                             | `age-keygen`; put the public key in repo variable `BACKUP_AGE_RECIPIENT`; keep the private key in the password manager and one offline copy.         |
| Monthly         | Calendar                                            | The 15-minute check in S5.3.                                                                                                                         |
