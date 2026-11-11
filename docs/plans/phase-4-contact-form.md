# Phase 4 — Contact form that reaches the club's inbox

Status: planned (2026-11-11). Owner: next agent that picks it up.
Depends on: Phase 2 (admin page) for the inbox view only. Everything else can ship first.
Related plans: `phase-2-admin-page.md`, `gdpr.md`, `security-baseline.md` (security thread),
`phase-5-pwa-notifications.md` (admin push on new message).

## Goal

A visitor fills in **Kontakt oss**, and the club gets an email in `sbsklubb@hotmail.com` they can
answer with one click on "Reply". Spam does not get through in any volume, nothing the sender
types can inject markup or headers into that email, and every message is also stored so the
board can see it in the admin page and so nothing is lost if email delivery fails.

## What exists today (read before you start)

| Piece                                                     | State                                                                                         |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `src/components/sections/ContactSection.tsx`              | Finished form: Zod validation on submit, honeypot, success/error alerts, autofill sync.       |
| `src/schemas/contact.ts`                                  | `contactSchema` (name ≥2, email regex, message ≥1). Norwegian copy.                           |
| `src/supabase/queryHelpers/createContactMessage.ts`       | Inserts straight into `public.contact_messages` with the anon key.                            |
| `supabase/migrations/20260823120000_contact_messages.sql` | Table + RLS: `anon, authenticated` may insert with `check (true)`; admins may select.         |
| `…20260824180000_contact_messages_email_format.sql`       | Server-side email regex check.                                                                |
| `src/utils/featureFlags.ts` → `contactFormEnabled`        | Off in production (#254) because nobody reads the table. Page shows the club address instead. |
| `CLUB_EMAIL` in `src/utils/contact.ts`                    | `sbsklubb@hotmail.com`, the inbox the board reads.                                            |

The gap is delivery and abuse resistance. Today anyone can POST to
`/rest/v1/contact_messages` with the public key, at any rate, bypassing the honeypot.

## Decisions (made, do not re-open without Martin)

1. **Delivery goes through one Supabase Edge Function, `contact-submit`.** The browser never writes
   to `contact_messages` again. The function validates, checks the captcha, rate limits, stores the
   row with the service role, then sends the email. Reason: the only place we can hold a secret
   (email API key, captcha secret) and enforce a rate limit is server-side, and Edge Functions are
   already in use (`update-event-participants`).
2. **Email provider: Resend** (EU region, `eu-west-1`), the same provider the hosting plan picked
   as Supabase Auth's SMTP sender. One account, one verified sending domain. Sender
   `Stavanger Brettspillklubb <kontakt@<club domain>>`, `To: sbsklubb@hotmail.com`,
   `Reply-To: <visitor's address>`. If the club domain is not verified in Resend yet, the phase is
   blocked on that (see Prerequisites); do not send from `onboarding@resend.dev` in production.
3. **Captcha: Cloudflare Turnstile, managed mode.** Free, no puzzle for most people, no tracking
   cookies, and the site is moving to Cloudflare anyway. The honeypot stays as a first, free filter.
   hCaptcha is the fallback if Turnstile is ever unacceptable; the function's `verifyCaptcha` is the
   only thing that changes.
4. **Rate limit: 3 messages per IP per 10 minutes, 20 per IP per day, 200 per day site-wide.**
   Stored as a salted SHA-256 of the IP (never the raw IP) in `contact_messages.ip_hash`, and
   counted with a query. Above the global cap the function stores the message but does not email
   it, and flags it `held` — a flood cannot run up the Resend quota or bury the inbox.
5. **Plain-text email only.** No HTML body at all, so there is nothing to inject into. The subject
   is built from a fixed prefix plus the sender's name with CR/LF and control characters stripped
   and truncated to 80 chars.
6. **Messages are kept 12 months, then deleted** by a daily `pg_cron` job. Stated in the privacy
   policy (`gdpr.md`). A member who deletes their account does not delete contact messages
   (those are the club's correspondence), but a deletion request by email covers them; the admin
   page gets a delete button per message.
7. **The form gets a "what happens with this" line** under the submit button:
   _"Vi lagrer meldingen i inntil 12 måneder for å kunne svare deg. Les mer i personvernerklæringen."_
   with a link to the privacy page from `gdpr.md`.

## Prerequisites (Martin / the board, not code)

- [ ] Resend account under the club email; add the club domain and its DNS records (SPF/DKIM via
      Cloudflare DNS). Produces `RESEND_API_KEY`.
- [ ] Turnstile widget in the Cloudflare dashboard for the production hostname, the
      `mamf92.github.io` preview and `localhost`. Produces a public **site key** and a **secret key**.
- [ ] Supabase Edge Function secrets (Dashboard → Edge Functions → Secrets, or
      `supabase secrets set`): `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`,
      `CONTACT_TO_EMAIL=sbsklubb@hotmail.com`, `CONTACT_FROM_EMAIL`, `IP_HASH_SALT` (32 random bytes,
      base64), `ALLOWED_ORIGINS` (comma-separated).
- [ ] GitHub Actions variable/secret `VITE_TURNSTILE_SITE_KEY` (public, safe in the bundle) for the
      build in `.github/actions/build-site`.

An agent can do everything else. Turnstile publishes test keys that always pass
(`1x00000000000000000000AA` site / `1x0000000000000000000000000000000AA` secret) and always
fail (`2x…`): use them in unit tests, e2e and local dev.

## Data model — migration `YYYYMMDDHHMMSS_contact_form_delivery.sql`

```sql
-- The form now writes through the contact-submit Edge Function with the service role.
-- Remove the public insert path so the captcha and rate limit cannot be bypassed.
drop policy if exists "Anyone can send a contact message" on public.contact_messages;
revoke insert on public.contact_messages from anon, authenticated;

alter table public.contact_messages
  add column ip_hash text,                       -- salted sha256, hex; null for old rows
  add column user_agent text check (char_length(user_agent) <= 300),
  add column status text not null default 'new'
    check (status in ('new', 'emailed', 'held', 'email_failed', 'handled', 'spam')),
  add column emailed_at timestamptz,
  add column handled_at timestamptz,
  add column handled_by uuid references auth.users (id) on delete set null,
  add column sender_supabase_id uuid references auth.users (id) on delete set null;

create index contact_messages_ip_hash_created_idx on public.contact_messages (ip_hash, created_at desc);
create index contact_messages_created_idx on public.contact_messages (created_at desc);

-- Admins triage in the admin page: mark handled / spam, delete.
create policy "Admins can update contact messages"
  on public.contact_messages for update to authenticated
  using (public.member_is_admin()) with check (public.member_is_admin());
create policy "Admins can delete contact messages"
  on public.contact_messages for delete to authenticated
  using (public.member_is_admin());

-- Retention: 12 months.
select cron.schedule(
  'contact-messages-retention',
  '17 3 * * *',
  $$delete from public.contact_messages where created_at < now() - interval '12 months'$$
);
```

Notes:

- `pg_cron` must be enabled (Dashboard → Database → Extensions). Check with
  `select * from pg_extension where extname = 'pg_cron'` via the Supabase MCP before applying.
- Name the file after the version `apply_migration` reports (see the integrations memory:
  repo migration names match remote versions).
- Status flow: `new` → `emailed` | `held` | `email_failed` → `handled` | `spam`.
- Run the security advisors (`get_advisors`) after applying; expect no new findings.

## Edge Function `supabase/functions/contact-submit/index.ts`

Create a shared folder first, because Phases 5 and 6 reuse it:

```
supabase/functions/_shared/cors.ts        # origin allow-list from ALLOWED_ORIGINS, OPTIONS handling
supabase/functions/_shared/http.ts        # json() / error() helpers, request size cap
supabase/functions/_shared/ipHash.ts      # salted sha256 of the client IP
supabase/functions/_shared/turnstile.ts   # verifyCaptcha(token, ip)
supabase/functions/_shared/email.ts       # sendEmail({to, from, replyTo, subject, text}) via Resend
supabase/functions/_shared/adminClient.ts # service-role client (SUPABASE_SERVICE_ROLE_KEY is injected by Supabase)
```

Move the hardcoded `allowedOrigins` set out of `update-event-participants` into `_shared/cors.ts`
in the same PR, so there is one list. Never echo an unknown `Origin` back; fall back to the
production origin like the existing function does.

Request (`POST`, JSON, `Content-Type: application/json`, max 16 KB body — reject larger with 413
before parsing):

```ts
type ContactSubmitBody = {
  name: string;
  email: string;
  message: string;
  website: string; // the honeypot; must be ''
  turnstileToken: string;
  renderedAt: number; // Date.now() when the form mounted
};
```

Steps, in this order (cheapest rejection first):

1. CORS + method check. `verify_jwt = false` for this function in `supabase/config.toml`
   (anonymous visitors use it); if an `Authorization` header with a user JWT is present, resolve
   the user and store `sender_supabase_id`, but never require it.
2. Parse with a Zod schema that mirrors `contactSchema` **plus upper bounds** matching the table
   checks (name ≤ 200, email ≤ 320, message ≤ 5000). Import Zod as `npm:zod@4`. Keep the
   client schema and this one in sync by a unit test that runs both on the same fixtures
   (`src/schemas/contact.test.ts` can import a JSON fixture file the Deno test also reads).
3. Honeypot non-empty, or `Date.now() - renderedAt < 3000` → respond `200 {ok:true}` and do
   nothing (same response as success; do not tell a bot it was caught).
4. `verifyCaptcha(turnstileToken, ip)` → POST
   `https://challenges.cloudflare.com/turnstile/v0/siteverify` with `secret`, `response`,
   `remoteip`. Require `success === true` and `hostname` in the allow-list. Failure → `400
{error:'captcha'}`.
5. IP: `x-forwarded-for` first entry (Supabase sets it). `ip_hash = sha256(IP_HASH_SALT + ip)`.
   Rate-limit counts against `contact_messages` (10 min, 24 h, site-wide 24 h). Over the
   per-IP limit → `429 {error:'rate_limited'}`.
6. Insert the row with the service-role client, `status = 'new'` (or `'held'` over the
   site-wide cap). `user_agent` truncated to 300.
7. If not held: `sendEmail`. Subject: `Kontaktskjema: ${safeName}`. Body (plain text):

   ```
   Ny melding fra kontaktskjemaet på nettsiden.

   Navn: {name}
   E-post: {email}
   Sendt: {Europe/Oslo timestamp}

   {message}

   —
   Svar direkte på denne e-posten for å svare avsenderen.
   Meldingen er også lagret i adminsiden: {SITE_URL}/admin#meldinger
   ```

   `safeName` = name with `/[\r\n\t\u0000-\u001f\u007f]/g` removed, collapsed whitespace,
   max 80 chars. `replyTo` is the validated email (the regex already forbids whitespace, so no
   header injection; still strip CR/LF defensively in `_shared/email.ts` for every header field).
   Success → `status='emailed', emailed_at=now()`. Failure → `status='email_failed'`, log the
   Resend status code only (no message content in logs), still return `200` — the message is
   saved and the admin page shows failed ones.

8. Response `200 {ok:true}`.

After the email works, also insert a row into Phase 5's `notification_outbox`
(`kind='admin_contact_message'`) if that table exists. Write the call behind a guard so Phase 4
can ship before Phase 5.

Logging rule for every Edge Function from here on: log ids, status codes and error codes, never
names, emails, message bodies, tokens or IPs.

## Frontend changes

- `src/supabase/queryHelpers/createContactMessage.ts` → call
  `supabase.functions.invoke('contact-submit', { body })` instead of the table insert. Map
  `429` to _"Du har sendt mange meldinger på kort tid. Prøv igjen om litt."_, `captcha` to
  _"Vi klarte ikke å bekrefte at du er et menneske. Last inn siden og prøv igjen."_, anything
  else to the existing `GENERIC_ERROR`.
- New `src/components/ui/Turnstile.tsx` (design-system primitive, follow the `sbsk-component`
  skill): loads `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit` once,
  renders into a ref with `theme` from `useTheme()` and `language: 'nb'`, exposes the token via
  `onToken`, resets after each submit. No `dangerouslySetInnerHTML`. Renders nothing and calls
  `onToken('test')` when `import.meta.env.MODE === 'test'`.
- `ContactSection.tsx`: keep the honeypot (rename the state field to `website` to match the
  body), add `renderedAt` from a ref set on mount, add the Turnstile widget above the submit
  button, disable submit until a token exists, add the privacy line from decision 7.
- **CSP** (`src/security/csp.ts`) — add with a comment, and update `e2e/csp.spec.ts`:
  - `script-src`: `https://challenges.cloudflare.com`
  - `frame-src`: `https://challenges.cloudflare.com` (currently `'none'`; Turnstile renders an iframe)
  - `connect-src`: no change (the function is on the Supabase origin already).
- Flip `VITE_ENABLE_CONTACT_FORM=true` in the build action once the live check below passes.
  Leave the flag in code for one release, then remove it in a follow-up issue.

## Admin page integration (lands with or after Phase 2)

Section **Meldinger** on the admin page: list newest first (name, email, first 140 chars,
status chip, date), filter by status, open a message in a dialog, buttons _Markér som
håndtert_, _Marker som spam_, _Slett_, and _Svar på e-post_ (`mailto:` with subject
`Sv: Kontaktskjema`). Messages with `email_failed` or `held` are listed first with a warning
alert. Render all user text as React text nodes only.

## Security checklist for this phase

- [ ] No anon/authenticated insert grant on `contact_messages` (verify with a REST call using
      the publishable key: expect 401/403).
- [ ] Service role key used only inside the function; never logged.
- [ ] Email is text/plain; header fields stripped of CR/LF; subject length capped.
- [ ] Captcha verified server-side including `hostname`.
- [ ] Rate limits enforced server-side; IP stored only as a salted hash.
- [ ] CORS allow-list, no wildcard.
- [ ] Body size cap before JSON parse.
- [ ] User text rendered as text in the admin page (no HTML rendering anywhere).
- [ ] Retention job scheduled and visible in `cron.job`.

## Tests

Unit (Vitest, `npm run test`):

- `contact.test.ts`: shared fixtures pass/fail identically for client schema and server schema.
- `ContactSection.test.tsx`: mocked `createContactMessage`; submit disabled until token; maps
  429/captcha/generic errors to the right copy; honeypot path shows success without calling the
  helper; privacy link present.
- `Turnstile.test.tsx`: test-mode stub calls `onToken`.

Edge Function (Deno, `deno test supabase/functions/contact-submit`): extract the handler as
`handle(req, deps)` with injected `verifyCaptcha`, `sendEmail`, `db`, `now` so it runs with no
network. Cases: oversized body 413; bad JSON 400; schema failure 400; honeypot 200 no insert;
too-fast 200 no insert; captcha fail 400; per-IP 429; site-wide cap → `held`, no email; email
failure → `email_failed` and 200; CR/LF in name never reaches the subject; unknown origin not
echoed. Add a CI job step `deno test supabase/functions` to `.github/workflows/ci.yml` (install
with `denoland/setup-deno@v2`, pinned).

E2E (Playwright, `e2e/contact.spec.ts`): route `**/functions/v1/contact-submit` with
`page.route` to return 200 / 429 / 400 and assert the alerts; assert the Turnstile iframe origin
is allowed by CSP (no CSP violation in the console).

Live check (manual, once, on the preview): send one message with test keys swapped for real
ones, confirm it arrives in `sbsklubb@hotmail.com` not in junk, that Reply goes to the sender,
and that the row shows `emailed`.

## Definition of done

- Form enabled in production; a real message reaches the club inbox with a working Reply-To.
- Direct REST insert is impossible; captcha and rate limit are enforced server-side.
- Admin page lists, triages and deletes messages (or a follow-up issue exists if Phase 2 is not
  merged yet).
- `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e`, Deno tests all green.
- `docs/HOSTING.md`/`csp.ts` comments updated for the Turnstile hosts.
- Privacy policy (from `gdpr.md`) lists Resend and Cloudflare Turnstile as processors with
  their locations.

## Suggested PR split

1. `_shared/` modules + migration + `contact-submit` + Deno tests + CI step (flag still off).
2. Frontend: Turnstile primitive, ContactSection wiring, CSP, e2e. Flag on after the live check.
3. Admin **Meldinger** section (in Phase 2's branch if that is still open).
