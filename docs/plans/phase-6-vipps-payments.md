# Phase 6 — Vipps payments for membership and event sign-up

Status: planned (2026-11-11). Vipps facts below were read from
`developer.vippsmobilepay.com` on 2026-11-11; re-check anything marked _verify_ before coding.
Depends on: Phase 2 (`membership_payments`, manual "paid" tick, admin audit log), Phase 3
(members list, invite-only accounts), `01-event-pages.md` (`event_registrations`, the Sanity
`signup` object), `phase-4-contact-form.md` (`_shared/` Edge Function modules, Turnstile),
`phase-5-pwa-notifications.md` (`notification_outbox`), `gdpr.md`, `security-baseline.md`.

## Goal

1. **Membership sign-up with payment.** Someone fills in name and email on _Bli medlem_, pays in
   Vipps, and is on the member list for the season with status _betalt_ — no admin action needed.
   They get an email to create their login.
2. **Paid event sign-up.** On the Board Game Masters page (and any event/festival whose `signup`
   method is `sbsk` with a `priceNok`), a member or a guest signs up and pays; the seat is
   confirmed when the payment is captured.
3. **Everyone sees the truth.** Members see their own membership and event payment status on
   their page. Admins see all payments, can tick someone off as paid by hand (cash, bank
   transfer — Phase 2 already does this), and can refund Vipps payments.

## Vipps facts this plan relies on

| Topic                 | Fact                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API                   | **ePayment API** (`/epayment/v1`). It replaces the legacy eCom API; do not use eCom.                                                                                                                                                                                                                                                                                                                                                   |
| Hosts                 | Test `https://apitest.vipps.no`, production `https://api.vipps.no`. Separate keys for each.                                                                                                                                                                                                                                                                                                                                            |
| Access token          | `POST /accesstoken/get`, headers `client_id`, `client_secret`, `Ocp-Apim-Subscription-Key`, `Merchant-Serial-Number`. Response `access_token`, `expires_in`, `expires_on`. Valid 1 h in test, 24 h in production. Cache and reuse; refresh ~5 min before `expires_on`.                                                                                                                                                                 |
| Headers on every call | `Authorization: Bearer <token>`, `Ocp-Apim-Subscription-Key`, `Merchant-Serial-Number`, `Content-Type: application/json`, `Vipps-System-Name: sbsk-website`, `Vipps-System-Version: <git sha, ≤30 chars>`, `Vipps-System-Plugin-Name: sbsk-edge`, `Vipps-System-Plugin-Version: 1`. `Idempotency-Key` on create, capture, cancel and refund.                                                                                           |
| Create                | `POST /epayment/v1/payments` with `amount {currency:"NOK", value:<øre>}`, `paymentMethod {type:"WALLET"}`, `reference`, `userFlow:"WEB_REDIRECT"`, `returnUrl`, `paymentDescription`. Response has `redirectUrl` — open it as a top-level navigation, unchanged, never in an iframe. Minimum amount 100 øre.                                                                                                                           |
| Reference             | `^[a-zA-Z0-9-]{8,64}$`, unique per sales unit (MSN), case-sensitive; avoid all-numeric. Send in lowercase.                                                                                                                                                                                                                                                                                                                             |
| States                | `CREATED`, `AUTHORIZED`, `ABORTED`, `EXPIRED`, `TERMINATED` (webhook names add `CAPTURED`, `CANCELLED`, `REFUNDED`). After capture/refund/cancel `state` stays `AUTHORIZED`; read the `aggregate` amounts to know what happened. _Verify_ the full state enum in the OpenAPI spec (`/api/epayment`).                                                                                                                                   |
| Get                   | `GET /epayment/v1/payments/{reference}` → `state`, `amount`, `aggregate {authorizedAmount, capturedAmount, refundedAmount, cancelledAmount}`, `pspReference`, `captureGuaranteedUntil`. Event log: `GET …/{reference}/events`.                                                                                                                                                                                                         |
| Capture               | `POST …/{reference}/capture` `{modificationAmount:{currency,value}}`, `Idempotency-Key` required. Only treat it as done when the response `aggregate.capturedAmount` covers it. Capture must not happen before the service can be delivered — a membership or a confirmed seat is delivered at once, so we capture right after authorization ("reserve, then capture immediately"). Norway capture deadline 180 days.                  |
| Cancel                | `POST …/{reference}/cancel` — releases the uncaptured remainder. Used when a reserved seat can no longer be honoured.                                                                                                                                                                                                                                                                                                                  |
| Refund                | `POST …/{reference}/refund` `{modificationAmount}`; partial and repeated allowed up to `capturedAmount - refundedAmount`; **within 365 days** of reservation (error 6220 after). Money reaches the payer in 2–3 bank days.                                                                                                                                                                                                             |
| Rate limits           | Create/capture/cancel/refund: 5 per minute per reference. Get: 120 per minute per reference. HTTP 429 on excess. Errors are RFC 7807 with `extraDetails`.                                                                                                                                                                                                                                                                              |
| Polling               | Start after 5 s, then every 2 s while the user waits; webhooks can be late, so poll as a backup.                                                                                                                                                                                                                                                                                                                                       |
| Webhooks              | Register with `POST /webhooks/v1/webhooks` `{url, events:[…]}` → `{id, secret}` (secret shown once). Events used here: `epayments.payment.authorized.v1`, `.captured.v1`, `.cancelled.v1`, `.refunded.v1`, `.aborted.v1`, `.expired.v1`, `.terminated.v1`. Payload: `msn`, `reference`, `pspReference`, `name`, `amount`, `timestamp`, `idempotencyKey`, `success`. Ordered per payment; retried on non-2xx or >10 s for up to 7 days. |
| Webhook signature     | Headers `x-ms-date`, `x-ms-content-sha256`, `Authorization: HMAC-SHA256 SignedHeaders=x-ms-date;host;x-ms-content-sha256&Signature=<b64>`. Check `x-ms-content-sha256 == base64(sha256(rawBody))`; string to sign `"POST\n" + pathAndQuery + "\n" + xMsDate + ";" + host + ";" + contentHash`; signature `base64(HMAC-SHA256(utf8(secret), utf8(stringToSign)))`.                                                                      |
| Test                  | Test sales unit in the portal (For developers → API keys → Test). Test users in the portal. **Vipps MT** app (TestFlight / Android), PIN 1236. Magic amounts: 1.51 kr insufficient funds, 1.82 refused, 1.83 fraud, 1.86 expired card. No settlements in test.                                                                                                                                                                         |
| Profile sharing       | `profile.scope` (`name email phoneNumber`) can return payer details. **Not used** — we already collect name and email ourselves (data minimisation, and one fewer consent screen).                                                                                                                                                                                                                                                     |

## Decisions

1. **ePayment one-off payments, not the Recurring API, for membership.** A season is one payment
   per year, many members pay in person at the first club night, and Recurring needs extra
   compliance approval from Vipps and a standing agreement members must manage. Renewal is a
   reminder (email + `membership_renewal` push) with a _Forny medlemskap_ button that runs the
   same flow. Revisit Recurring only if the board asks for automatic renewal.
2. **Every Vipps call happens in Supabase Edge Functions.** Keys live only in Edge Function
   secrets. The browser never sees an access token, a key or an amount it can change.
3. **Prices are server-side.** Membership price per season comes from a `price_list` table that
   admins edit; event prices come from the Sanity `signup.priceNok` at the level the registration
   points at (event, festival, day or session), **re-fetched server-side** at create time and
   stored on the payment row. Whatever amount the browser sends is ignored (it does not send one).
4. **One ledger table `vipps_payments`** records every Vipps payment and its state. The domain
   tables stay the source of truth for "is this person paid": `membership_payments` (from
   `phase-2-admin-page.md`) and `event_registrations` (from `01-event-pages.md`). The ledger
   links to them by `reference` (`membership_payments.provider_reference`,
   `event_registrations.payment_reference`, both unique).
5. **Capture immediately after authorization**, from the webhook (and from the reconciliation job
   if the webhook is late). Fulfilment (member row, paid row, confirmed seat) happens **on
   capture**, never on the return URL and never on authorization alone.
6. **Fulfilment is one idempotent SQL function** `vipps_fulfil(reference)` that checks
   `fulfilled_at is null` under a row lock. Webhooks, polling and reconciliation all call the same
   code path, so duplicates and races are harmless.
7. **Never trust a webhook body for state.** After the HMAC check, the function re-reads the
   payment with `GET /epayment/v1/payments/{reference}` and applies _that_. The body is only a
   trigger. This makes replays and forged-but-valid-looking events harmless.
8. **Seats are held for 15 minutes** while someone pays. A `pending_payment` registration counts
   against capacity until it is confirmed, or until a job cancels it (and cancels the Vipps
   payment if it was authorized but not captured).
9. **Refunds are admin-only, from the admin page**, require the admin's second factor (`aal2`,
   from the security plan), and are written to the admin audit log. Refund policy (for the board
   to confirm, shown in the terms): membership refundable in full within 14 days of payment;
   event tickets refundable until 7 days before the event; full automatic refund to everyone if
   the club cancels an event. Event tickets for a specific date are exempt from the 14-day
   withdrawal right (angrerettloven § 22 bokstav m) — _verify with the board_, but the terms
   must state the rule either way.
10. **Guests can pay for events** (BGM is open to non-members): name + email, no account.
    Members signed in get the form pre-filled and the registration linked to their `supabase_id`.
11. **No Vipps profile sharing, no phone number.** Name and email come from our form.

## Prerequisites (Martin / the board)

The club is a Vipps merchant already, but a **Vipps-nummer** or QR sales unit does not by
itself give API access (_verify in the portal_: if the sales unit has no "API keys" under
_For utviklere_, it is not an API sales unit).

- [ ] In `portal.vippsmobilepay.com`, order **"Betaling på nett"/"Payment integration"** (the
      ePayment product) on the club's merchant agreement, as a new sales unit named
      "Stavanger Brettspillklubb – nettside". Vipps sets it up in up to 10 working days. Check the
      transaction fee on the agreement; non-profit pricing may apply.
- [ ] _For utviklere → API-nøkler → Test → Legg til test-salgssted_ (no direct capture, no
      Recurring). Gives test `client_id`, `client_secret`, `Ocp-Apim-Subscription-Key`, MSN.
- [ ] Add 1–2 test users (portal → Developer → Test users) and install **Vipps MT**.
- [ ] Put keys in Supabase Edge Function secrets (agents never paste keys in chat, issues or
      commits):
      `VIPPS_ENV=test|production`, `VIPPS_CLIENT_ID`, `VIPPS_CLIENT_SECRET`,
      `VIPPS_SUBSCRIPTION_KEY`, `VIPPS_MSN`, `VIPPS_WEBHOOK_SECRET` (after step below),
      `SITE_URL` (e.g. `https://sbsk.no`).
- [ ] Decide the membership price for the season and enter it in the admin page (`price_list`).
- [ ] Board approves the refund policy text (decision 9) and the terms page.

## Data model — migration `…_vipps_payments.sql`

```sql
create table public.price_list (
  key text primary key,                         -- 'membership:2027'
  amount_nok int not null check (amount_nok between 1 and 20000),
  label text not null,                          -- 'Medlemskap 2027'
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);
alter table public.price_list enable row level security;
create policy "Anyone reads active prices" on public.price_list for select to anon, authenticated using (active);
create policy "Admins manage prices" on public.price_list for all to authenticated
  using (public.member_is_admin()) with check (public.member_is_admin());

create table public.vipps_payments (
  reference text primary key check (reference ~ '^[a-z0-9-]{8,64}$'),
  purpose text not null check (purpose in ('membership', 'event')),
  -- what is being paid for
  season int,                                   -- membership
  event_id text,                                -- Sanity _id of event/festival
  session_id text,                              -- '{dayKey}' or '{dayKey}/{sessionKey}', null = whole event (01-event-pages.md §5)
  registration_id uuid references public.event_registrations (id) on delete set null,
  -- who pays (snapshot; the person may not have an account)
  supabase_id uuid references auth.users (id) on delete set null,
  payer_name text not null check (char_length(payer_name) between 2 and 200),
  payer_email text not null check (char_length(payer_email) <= 320),
  -- money, in øre
  amount_ore int not null check (amount_ore >= 100),
  authorized_ore int not null default 0,
  captured_ore int not null default 0,
  refunded_ore int not null default 0,
  cancelled_ore int not null default 0,
  -- Vipps state
  state text not null default 'CREATED',        -- last state from GET payment
  psp_reference text,
  redirect_url text,
  capture_attempted_at timestamptz,             -- last attempt; a retry hint, never a completion flag
  capture_attempts int not null default 0,
  fulfilled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((purpose = 'membership' and season is not null) or (purpose = 'event' and event_id is not null))
);
create index on public.vipps_payments (state, created_at);
create index on public.vipps_payments (supabase_id);
alter table public.vipps_payments enable row level security;
create policy "Admins read payments" on public.vipps_payments for select to authenticated using (public.member_is_admin());
create policy "Payers read own payments" on public.vipps_payments for select to authenticated using (auth.uid() = supabase_id);
-- No insert/update/delete policies: only Edge Functions (service role) write.

create table public.vipps_payment_events (
  id bigint generated always as identity primary key,
  reference text not null references public.vipps_payments (reference) on delete cascade,
  source text not null check (source in ('webhook', 'poll', 'reconcile', 'admin')),
  name text not null,                           -- AUTHORIZED, CAPTURED, …
  psp_reference text,
  amount_ore int,
  vipps_timestamp timestamptz,
  received_at timestamptz not null default now(),
  unique (reference, name, psp_reference, source)
);
alter table public.vipps_payment_events enable row level security;
create policy "Admins read payment events" on public.vipps_payment_events for select to authenticated using (public.member_is_admin());

create table public.vipps_refunds (
  id uuid primary key default gen_random_uuid(),
  reference text not null references public.vipps_payments (reference),
  amount_ore int not null check (amount_ore >= 100),
  reason text not null check (char_length(reason) between 3 and 500),
  requested_by uuid not null references auth.users (id),
  idempotency_key text not null unique,
  status text not null default 'requested' check (status in ('requested', 'succeeded', 'failed')),
  error_code text,
  created_at timestamptz not null default now()
);
alter table public.vipps_refunds enable row level security;
create policy "Admins read refunds" on public.vipps_refunds for select to authenticated using (public.member_is_admin());
```

Also, in this migration, if the sibling phases have not already:

- `membership_payments.provider_reference` unique where not null.
- `event_registrations.payment_reference` unique where not null.

Retention: `vipps_payments`, `vipps_refunds`, `membership_payments` are bookkeeping and kept 5
years (bokføringsloven), detached from the account on deletion (`on delete set null`), per
`gdpr.md`. `vipps_payment_events` older than 18 months are deleted by cron (the ledger keeps the
outcome).

### `vipps_fulfil(p_reference text)` — security definer, service role only

```sql
-- Pseudocode; write it in plpgsql, `set search_path = public`, revoke execute from public/anon/authenticated.
select * into p from vipps_payments where reference = p_reference for update;
if p.fulfilled_at is not null then return 'already'; end if;
if p.captured_ore < p.amount_ore then return 'not_captured'; end if;

if p.purpose = 'membership' then
  -- 1. find or create the member by lower(email)
  insert into members (email, name, …) values (lower(p.payer_email), p.payer_name, …)
    on conflict (lower(email)) do nothing;      -- needs the unique index from phase 3
  -- 2. paid row for the season
  insert into membership_payments (member_id, season, amount_nok, method, status, paid_at, provider_reference, payer_name)
    values (<member id>, p.season, p.amount_ore / 100, 'vipps', 'paid', now(), p.reference, p.payer_name)
    on conflict (provider_reference) do nothing;
elsif p.purpose = 'event' then
  update event_registrations set status = 'confirmed' where id = p.registration_id and status = 'pending_payment';
  -- if the hold had already expired and the seat was released: re-check capacity; if full, return 'needs_refund'
end if;

update vipps_payments set fulfilled_at = now() where reference = p_reference;
insert into notification_outbox (…admin_payment…, dedupe_key = 'admin_payment:' || p_reference) on conflict do nothing;
return 'fulfilled';
```

Match the real column names of `members` and `membership_payments` from Phase 2/3 before
writing it; the shape above is from the admin plan as agreed on 2026-11-11.

## Edge Functions

Shared modules (`supabase/functions/_shared/`):

- `vipps/config.ts` — reads env, picks the base URL from `VIPPS_ENV`, throws at startup if any
  secret is missing.
- `vipps/client.ts` — `getToken()` (module-level cache with `expires_on`), `createPayment`,
  `getPayment`, `capture`, `cancel`, `refund`. Every call sets the headers in the facts table, a
  10 s timeout, retries **only** on network errors / 5xx / 429 with the **same**
  `Idempotency-Key` (max 3, backoff 1 s, 2 s, 4 s), parses RFC 7807 errors into
  `VippsError {status, code, title}`. `fetch` is injected so Deno tests run offline.
- `vipps/signature.ts` — `verifyWebhook(req, rawBody, secret)` per the facts table, using Web
  Crypto (`crypto.subtle.importKey('raw', utf8(secret), {name:'HMAC', hash:'SHA-256'}…)`),
  constant-time comparison of the decoded signature bytes. Test it with the docs' example vector.
- `vipps/apply.ts` — `applyPayment(reference, source)`: `getPayment` → upsert state and
  aggregate amounts into `vipps_payments` → insert `vipps_payment_events` (ignore unique
  conflicts) → if `authorized_ore > captured_ore + cancelled_ore` (money still reserved) and the
  registration is still valid, and either no attempt yet or the last attempt is older than
  2 minutes: set `capture_attempted_at = now()`, `capture_attempts++`, then `capture` with the
  stable key `cap-<reference>` (Vipps de-duplicates on it, so a retry after an unknown outcome is
  safe). Completion is decided only by Vipps' `aggregate.capturedAmount`, never by the attempt
  columns; webhooks, polls and reconcile keep retrying until it is captured, the capture
  deadline (`captureGuaranteedUntil`) passes, or 10 attempts fail, at which point admins get an
  alert → if captured: `rpc
vipps_fulfil` → if it returns `needs_refund`: refund in full with reason "Fullt — plass ikke
  tilgjengelig" and notify admins. If the registration is no longer valid before capture:
  `cancel`. Every branch is idempotent.
- `references.ts` — `newReference(purpose)`: `sbsk-m-2027-<10 random base36>` /
  `sbsk-e-<10 random base36>`, lowercase, regex-checked.

### `vipps-create-payment` (public; JWT optional)

Body (Zod-validated; `sessionId` is `'{dayKey}'`, `'{dayKey}/{sessionKey}'` or `null`):

```ts
type CreateBody =
  | {
      purpose: 'membership';
      name: string;
      email: string;
      acceptTerms: true;
      turnstileToken: string;
    }
  | {
      purpose: 'event';
      eventId: string;
      sessionId: string | null;
      name: string;
      email: string;
      acceptTerms: true;
      turnstileToken: string;
    };
```

1. CORS allow-list, body ≤ 8 KB, Turnstile check (`_shared/turnstile.ts`), per-IP rate limit
   (5 creates / 10 min, same salted-hash approach as Phase 4).
2. If a JWT is present, resolve the user; take name/email from their profile (ignore the body's).
3. **Membership:** season = current season (the year, or next year from 1 November — confirm
   the cut-off with the board and keep it in one function `currentSeason()`). Reject with
   `409 already_paid` if a `paid` `membership_payments` row exists for that email and season.
   Price from `price_list` key `membership:<season>`; 503 `price_missing` if none.
4. **Event:** fetch the event/festival from Sanity server-side
   (`https://85tc4tb0.apicdn.sanity.io/v2025-02-19/data/query/production`, GROQ by `_id`,
   resolve `signup` at the session/day/event level per `01-event-pages.md`). Require
   `signup.method == 'sbsk'`, `priceNok > 0`, sign-up still open, event in the future. In one
   transaction (SQL function `event_hold_seat`): lock, count `confirmed` +
   `pending_payment` younger than 15 min, compare with `capacity`, reject `409 full`, reject
   `409 already_registered` for the same email + event + session, else insert
   `event_registrations` row `pending_payment` and return its id.
5. Insert `vipps_payments` row (`CREATED`, amount in øre, snapshot fields).
6. `createPayment` with `Idempotency-Key: create-<reference>`:
   - `paymentDescription`: `Medlemskap 2027` / `BGM 2027 – lørdag` (short; no merchant name).
   - `returnUrl`: `${SITE_URL}/betaling/${reference}` (must be an exact page we own; the
     reference is random so the URL is not guessable, and it carries no PII).
7. Store `redirect_url`, respond `{ reference, redirectUrl }`.
8. On a Vipps error: mark the row `state='FAILED_TO_CREATE'`, release the seat, respond 502
   with a generic message. Log the Vipps error code only.

### `vipps-webhook` (public, `verify_jwt = false`)

1. Read the raw body as text **before** parsing. Reject if > 16 KB.
2. `verifyWebhook` — on failure respond 401 and log `signature_invalid` (no body).
3. Parse, require `msn == VIPPS_MSN` and a `reference` that exists in `vipps_payments`; unknown
   references → 200 (so Vipps stops retrying) and a log line.
4. `applyPayment(reference, 'webhook')`.
5. Respond 200 within 10 s. If `applyPayment` throws, respond 500 so Vipps retries (ordering is
   per payment, so a failed AUTHORIZED holds back CAPTURED until it succeeds — that is fine).

Register the webhook once per environment with a small script
`supabase/functions/vipps-webhook/register.ts` run by an agent with the keys in its env (Deno
task, not deployed). It lists existing webhooks first and does nothing if the URL is already
registered. Store the returned secret as `VIPPS_WEBHOOK_SECRET` immediately; it is shown once.

### `vipps-payment-status` (public)

`GET ?reference=…` → `{ state: 'pending' | 'paid' | 'failed' | 'cancelled', purpose, season?,
eventTitle? }`. No names, emails or amounts beyond what the page shows. If the stored row is
still `CREATED`/`AUTHORIZED` and older than 5 s, call `applyPayment(reference, 'poll')` first —
throttled to once per 2 s per reference with an `updated_at` check, which keeps us under
Vipps' 120/min. 404 for unknown references.

### `vipps-reconcile` (cron, every 5 min, secret header like `push-send`)

- Rows `CREATED` older than 2 min and younger than 2 days, and rows with
  `authorized_ore > captured_ore` or `captured_ore > 0 and fulfilled_at is null`:
  `applyPayment(…, 'reconcile')`, max 50 per run.
- Expired seat holds (`pending_payment` older than 15 min): if Vipps state is still `CREATED`,
  mark the registration `cancelled` (Vipps expires the payment itself); if `AUTHORIZED` and not
  captured, `cancel` it.
- Nightly: list rows where `captured_ore - refunded_ore` disagrees with the domain table
  (paid row missing, or registration not confirmed) and insert an admin alert into the outbox.

### `vipps-refund` (JWT, admin, `aal2`)

Body `{ reference, amountNok, reason }`. Checks `member_is_admin()` with the caller's JWT
**and** `aal == 'aal2'` in the JWT claims. Remaining = `captured_ore - refunded_ore`;
reject if the request exceeds it or the payment is older than 365 days. Insert
`vipps_refunds` (`idempotency_key = 'ref-' || reference || '-' || <count+1>`), call `refund`,
update status, `applyPayment(reference,'admin')`. Full refund of a membership → set its
`membership_payments.status = 'refunded'` (the member stays on the list, unpaid, until an admin
removes them). Full refund of an event → registration `refunded`, seat freed. Write the admin
audit log entry. Email the payer a short receipt (Resend, plain text).

`vipps-refund-event` (same guards): refunds every captured payment for one event/session with
a single reason, for when the club cancels. Runs in batches of 4 per second to respect the per-
reference limits; resumable (skips references with a succeeded refund).

## Frontend

Routes (Norwegian, byte-identical everywhere — check `main.tsx`):

- `/bli-medlem` — replaces the placeholder. Signed out: name, email, checkbox
  _"Jeg godtar vilkårene og har lest personvernerklæringen"_ (links), Turnstile, price from
  `price_list` (`Medlemskap 2027: 200 kr`), button _Betal med Vipps_ (`Button` with a new
  `'vipps'` icon key: add the official Vipps logo SVG under `src/assets/icons/` per the
  design-system rules; follow Vipps' button guidelines for colour/wording). Signed in and paid:
  "Du er medlem for 2027" and a link to the member page (the roadmap's "Bli medlem → member
  page" behaviour). Signed in and unpaid: _Forny medlemskap_.
- Event sign-up component on festival/event pages (`01-event-pages.md` owns the layout; this
  phase supplies `PaidSignupForm` in `src/components/sections/`): seat count left, price, same
  fields, _Betal med Vipps_.
- `/betaling/:reference` — return page. Calls `vipps-payment-status` after 2 s, then every 2 s
  up to 60 s (polling guideline). States: _Venter på bekreftelse…_ (spinner, `aria-live`),
  _Betalingen er gjennomført_ (with what was bought and the next step: "Sjekk e-posten din for å
  lage innlogging" or "Du er påmeldt"), _Betalingen ble avbrutt_ (button to try again, which
  creates a new reference), _Vi venter fortsatt på Vipps_ after 60 s ("Du får e-post når
  betalingen er bekreftet"). The page never changes state itself; it only displays.
- Starting payment: `window.location.assign(redirectUrl)` after a strict check that the URL's
  host is one of `pay.vipps.no`, `pay-mt.vipps.no`, `api.vipps.no`, `apitest.vipps.no`
  (the documented landing domains). No CSP change is needed for a top-level navigation;
  `connect-src` already covers the Supabase functions. Confirm with `e2e/csp.spec.ts`.
- Member page **Betalinger** section: membership status per season (_Betalt_, _Ikke betalt_,
  _Refundert_, method Vipps/manuell), event registrations with status, and a _Betal nå_ button
  when unpaid. Data via RLS (own rows).
- Admin page **Betalinger** section (in Phase 2's layout): table of Vipps payments (date,
  purpose, payer, amount, state chip, fulfilled), filters, CSV export for the treasurer
  (date, reference, purpose, amount, refunded, Vipps pspReference), and _Refunder_ dialog
  (amount pre-filled with remaining, reason required, confirm, triggers `aal2` step-up if
  needed). The members list (Phase 2) shows method `Vipps` on paid rows and does not let an
  admin un-tick a Vipps-paid row (only refund).
- Admin **Priser**: edit `price_list`.
- Copy in `nb` and `en` via `i18n.md`.

After fulfilment of a new membership: call Supabase `auth.admin.inviteUserByEmail(email,
{ redirectTo: SITE_URL + '/logg-inn' })` from `applyPayment` (service role), unless an auth
user already exists for that email. The invite-only signup hook already allows it because the
email is now on the member list. Requires custom SMTP (Resend) to be configured for Auth.

## Security checklist

- [ ] Keys only in Edge Function secrets; none in `VITE_*`, repo, logs, issues or chat.
- [ ] Amount and price always computed server-side; client sends no amount.
- [ ] Webhook: raw-body HMAC, content hash, constant-time compare, MSN check, state re-read with
      `GET` before acting.
- [ ] Fulfilment idempotent under row lock; webhook, poll and reconcile share one code path.
- [ ] `Idempotency-Key` on create/capture/cancel/refund, stable across retries.
- [ ] Clients can read only their own payment rows; only service role writes.
- [ ] Refunds: admin + `aal2` + audit log + remaining-amount check + 365-day check.
- [ ] Redirect URL host allow-listed before navigating; return page only displays status.
- [ ] Turnstile + per-IP rate limit on create; CORS allow-list.
- [ ] Logs carry references and error codes only — no names, emails, tokens.
- [ ] `get_advisors` clean after the migration.
- [ ] Threat model reviewed in the PR: forged webhook, replayed webhook, tampered return URL,
      changed price in devtools, double click on _Betal_, seat oversell race, admin account
      takeover (mitigated by `aal2`).

## Tests

Deno (`deno test supabase/functions`), all offline with injected `fetch`, db and clock:

- `signature.test.ts`: the docs' example vector passes; changed body, changed path, wrong
  secret, missing header all fail.
- `client.test.ts`: token cached until 5 min before expiry; retries reuse the same
  Idempotency-Key; 4xx not retried; RFC 7807 parsed.
- `apply.test.ts` — table-driven state machine: CREATED→nothing; AUTHORIZED→capture→fulfil;
  AUTHORIZED with expired hold→cancel; captured but already fulfilled→no-op; CAPTURED delivered
  twice→one membership row; capture 4xx→no fulfil, alert; `needs_refund`→refund.
- `create.test.ts`: price from `price_list`/Sanity not body; already-paid 409; full 409; Sanity
  `method != 'sbsk'` 400; Vipps error releases the seat.
- `refund.test.ts`: non-admin 403; admin without aal2 403; over-refund 400; >365 days 400.

SQL (on a Supabase branch via `create_branch`, never production): `vipps_fulfil` idempotency
under two concurrent calls; `event_hold_seat` under 20 concurrent holds for 10 seats → exactly
10 succeed; RLS: a member cannot read another member's payments; anon reads nothing.

Vitest: `/betaling/:reference` page states with mocked status; redirect-host allow-list;
`PaidSignupForm` validation and errors; member **Betalinger** rendering; admin refund dialog.

Playwright e2e (route-mocked functions): sign up → mocked `redirectUrl` to a local stub page →
back to `/betaling/x` → shows paid; aborted path; 60 s timeout path (use `page.clock`).

**Live test plan in Vipps test** (manual, recorded in the PR, using the Vipps MT app):

1. Membership 2 kr → pay → member row + paid row + invite email.
2. Pay with 1.51 kr → insufficient funds → return page shows failure; no member row.
3. Abort in the app → `ABORTED` → failure state; seat released for an event.
4. Close the browser before returning → webhook still fulfils; reconcile catches it if the
   webhook is disabled.
5. Event with capacity 1: two people start at once → second gets "full".
6. Partial refund then full refund from the admin page; statuses update; receipts sent.
7. Re-send a captured webhook with a tool (replay) → no duplicate rows.

## Rollout

1. Build and test entirely against `apitest.vipps.no` on the `redesign` preview with
   `VITE_ENABLE_VIPPS=true` there only.
2. Production keys in, webhook registered in production, one real 1 kr payment by Martin, then
   refund it from the admin page.
3. Turn on for the BGM sign-up first (if timing allows before late January), then membership
   for the new season.
4. Monthly: the treasurer compares the admin CSV with the Vipps settlement report in the portal.

## Definition of done

- A new person can become a paid member with Vipps and receives a login invite, with no admin
  action.
- A guest or member can buy a BGM seat; capacity is never exceeded.
- Members see their own payment status; admins see all, tick manual payments (Phase 2), and
  refund Vipps payments with 2FA.
- Webhooks are verified; missed webhooks are reconciled within 5 minutes.
- Terms and privacy pages updated (Vipps MobilePay as payment processor, what we store, 5-year
  bookkeeping retention, refund policy).
- All checks green: lint, unit, build, e2e, Deno; live test plan executed in test.

## Suggested PR split

1. Migration + `_shared/vipps/*` + Deno tests (no endpoints deployed).
2. `vipps-create-payment`, `vipps-webhook`, `vipps-payment-status`, `vipps-reconcile` +
   registration script; deploy to test.
3. `/bli-medlem`, `/betaling/:reference`, member **Betalinger**.
4. `PaidSignupForm` on the event pages.
5. Admin **Betalinger**, **Priser**, refunds.
6. Production go-live (keys, webhook, flag) — a checklist PR, mostly docs.
