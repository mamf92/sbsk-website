# Phase 5 — Installable app (PWA) with push notifications

Status: planned (2026-11-11).
Depends on: Phase 3 (members sign in; `profiles.locale` from `i18n.md`), Phase 2 (admin role
in the UI). The manifest/offline half (Part A) has no dependencies and can ship first.
Related: `phase-4-contact-form.md` (`_shared/` Edge Function modules), `phase-6-vipps-payments.md`
(payment notifications), `01-event-pages.md` (event and festival data in Sanity), `gdpr.md`.

## Goal

Members can add the site to their home screen and get it as an app: own icon, opens full
screen, loads fast and shows something useful offline. Members and admins can opt in to push
notifications for the things they care about, and turn each kind off again. Admins hear about
new sign-ups, payments and contact messages without checking the site.

## Platform facts that shape the design

- Web Push works in Chrome, Edge, Firefox and Samsung Internet on Android and desktop, and in
  Safari on macOS. **On iPhone/iPad it only works after the site is added to the Home Screen**
  (iOS/iPadOS 16.4+), and only from a user gesture inside the installed app. The UI must
  explain that, not just hide the button.
- Push needs a service worker, HTTPS and a VAPID key pair. The browser vendor's push service
  (FCM, Mozilla autopush, Apple) delivers the message; our server POSTs an encrypted payload to
  the subscription's `endpoint`. Payloads are end-to-end encrypted to the browser, but the
  notification itself shows on a lock screen, so **no personal data in notification text**.
- The site is currently served under `/sbsk-website/` on GitHub Pages and is moving to its own
  domain on Cloudflare Pages. A service worker's scope is its path; everything below derives
  scope and URLs from `import.meta.env.BASE_URL` so both work. A move of origin means members
  must re-subscribe (subscriptions are per-origin) — do Part B after the domain move if it is
  close, or accept one re-subscribe prompt.

## Decisions

1. **`vite-plugin-pwa` with the `injectManifest` strategy** and our own `src/sw.ts` using
   Workbox modules (`workbox-precaching`, `workbox-routing`, `workbox-strategies`,
   `workbox-expiration`). `injectManifest` because we need our own `push` and
   `notificationclick` handlers. Declare every `workbox-*` package we import in
   `package.json` (CLAUDE.md: no transitive imports).
2. **Precache the app shell only**, never the Studio. `globIgnores` the Studio chunks (find the
   chunk names in `dist/assets` after a build; the Studio is multi-MB) and anything over 2 MB.
3. **Runtime caching:**
   - Navigations: `NetworkFirst` (3 s timeout) falling back to the precached `index.html`, then
     to `offline.html` if that also fails.
   - Sanity content API (`*.api.sanity.io` / `apicdn.sanity.io` GET queries): `NetworkFirst`,
     24 h, 50 entries — lets the calendar and event pages work offline with yesterday's data.
   - Sanity images (`cdn.sanity.io`): `StaleWhileRevalidate`, 7 days, 150 entries, only
     `opaque`-free (status 200) responses.
   - **Supabase (`*.supabase.co`) is never cached** — it carries personal data and auth. Same
     for `/functions/v1/*`. Add an explicit `NetworkOnly` route so nobody adds caching later
     without seeing it.
4. **Update flow: prompt, not silent.** `registerType: 'prompt'`. When a new worker is waiting,
   show a non-blocking toast _"Ny versjon av nettsiden er klar."_ with button _Oppdater_
   (`updateSW(true)`). Keep `recoverFromStaleChunks()` as the safety net.
5. **Web Push via VAPID, sent from Edge Functions with `jsr:@negrel/webpush`** (Deno-native,
   implements RFC 8291/8292). If it fails on the Edge runtime, fall back to `npm:web-push`
   with `node:crypto`; the sending code lives behind `sendPush(subscription, payload)` so only
   one file changes.
6. **All sends go through an outbox table**, written by database triggers and other Edge
   Functions, drained by one function on a 1-minute `pg_cron` schedule plus an immediate kick.
   Reason: retries, de-duplication and per-member preferences live in one place, and a failed
   push never fails the action that caused it (a sign-up, a payment).
7. **Notification categories and defaults** (all opt-in — nothing is sent until the member
   presses _Slå på varsler_ and the browser permission is granted):

   | Key                      | Who    | Default when enabled | Text (nb)                                    |
   | ------------------------ | ------ | -------------------- | -------------------------------------------- |
   | `event_reminder`         | member | on                   | "I morgen: {event} kl. {time}"               |
   | `event_changed`          | member | on                   | "Endring: {event} — {what changed}"          |
   | `new_event`              | member | off                  | "Nytt arrangement: {event}"                  |
   | `membership_renewal`     | member | on                   | "Medlemskapet for {season} kan fornyes nå"   |
   | `payment_receipt`        | member | on                   | "Betaling mottatt: {purpose}"                |
   | `club_announcement`      | member | on                   | Admin-written title/body                     |
   | `admin_new_registration` | admin  | on                   | "Ny påmelding til {event} ({n}/{capacity})"  |
   | `admin_new_member`       | admin  | on                   | "Nytt medlem registrert"                     |
   | `admin_payment`          | admin  | on                   | "Ny betaling via Vipps: {kr} kr ({purpose})" |
   | `admin_contact_message`  | admin  | on                   | "Ny melding via kontaktskjemaet"             |

   Admin texts never contain names, emails or message content; the click target is the admin
   page section where the details are behind sign-in. Each text has an `en` variant; pick by
   `profiles.locale`.

8. **Announcements**: admins can send a `club_announcement` to all opted-in members from the
   admin page (title ≤ 60, body ≤ 160, link optional and must be a same-site path). Preview
   before send, confirm dialog, max 3 per day enforced server-side, logged in the admin audit
   log from `phase-2-admin-page.md`.
9. **Quiet hours 22:00–08:00 Europe/Oslo** for everything except `admin_payment`: queued items
   wait until 08:00.

## Part A — Installable app and offline (no backend)

Files:

- `vite.config.ts`: add `VitePWA({ strategies: 'injectManifest', srcDir: 'src', filename: 'sw.ts',
registerType: 'prompt', injectRegister: false, manifest: {...}, injectManifest: { globPatterns:
['**/*.{js,css,html,svg,png,woff2,ttf,avif}'], globIgnores: [<studio chunks>], maximumFileSizeToCacheInBytes: 2_000_000 } })`.
- Manifest (Norwegian, from `@theme` tokens — read the hex values from `src/index.css`, do not
  invent them):

  ```json
  {
    "name": "Stavanger Brettspillklubb",
    "short_name": "SBSK",
    "lang": "nb",
    "start_url": "<BASE_URL>?source=pwa",
    "scope": "<BASE_URL>",
    "display": "standalone",
    "background_color": "<--color-darkestblue>",
    "theme_color": "<--color-darkblue>",
    "icons": [
      { "src": "pwa-192.png", "sizes": "192x192", "type": "image/png" },
      { "src": "pwa-512.png", "sizes": "512x512", "type": "image/png" },
      {
        "src": "pwa-maskable-512.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "maskable"
      }
    ],
    "shortcuts": [
      { "name": "Kalender", "url": "<BASE_URL>kalender" },
      { "name": "Min side", "url": "<BASE_URL>min-side" }
    ]
  }
  ```

  Generate icons from the dice logo SVG in `src/assets/logos/` with
  `@vite-pwa/assets-generator` (devDependency) and commit the PNGs to `public/`. Add
  `apple-touch-icon.png` (180×180) and `<link rel="apple-touch-icon">`,
  `<meta name="theme-color">` (two, with `media="(prefers-color-scheme: …)"`) to `index.html`.
  Check the real member-page route slug in `src/main.tsx` before writing the shortcut.

- `src/sw.ts`: precache, routes from decision 3, `offline.html` fallback, `skipWaiting` only on
  a `{type:'SKIP_WAITING'}` message, plus the push handlers from Part B (stubbed here).
- `public/offline.html`: standalone page with inline-free CSS file, logo, _"Du er frakoblet.
  Kalenderen og arrangementene du har åpnet før, er fortsatt tilgjengelige."_ and a link to
  `./kalender`. Must pass the CSP (no inline script/style beyond what `csp.ts` allows).
- `src/utils/pwa.ts`: `registerServiceWorker()` using `virtual:pwa-register`, called from
  `main.tsx` only in production builds and **not** when the path starts with `/studio`.
  Exports `onNeedRefresh` for the toast.
- `src/components/ui/UpdateToast.tsx` (design-system primitive) using the `Alert` tone `info`.
- `src/components/sections/InstallPrompt.tsx`: on Android/desktop capture
  `beforeinstallprompt` and show a small _Installer appen_ button on the member page; on iOS
  Safari (not standalone) show the three-step hint _Del → Legg til på Hjem-skjerm → Åpne fra
  Hjem-skjermen_. Never on first visit to the public site; only on the member page.
- GitHub Pages: the SW's navigation fallback replaces the `404.html` trick for installed users;
  keep `restoreGithubPagesRoute()` for first visits. Test a deep link (`/våre-spill`) offline.
- CSP: `worker-src 'self'` and `manifest-src 'self'` are already present. Nothing new for Part A.
  Update the `worker-src` comment: app code now does create a worker.

Tests for Part A:

- Unit: `pwa.test.ts` — no registration on `/studio`, none in dev.
- E2E `e2e/pwa.spec.ts` (production build): manifest is linked and parses, has 192/512 and a
  maskable icon; `navigator.serviceWorker.ready` resolves; after `context.setOffline(true)` a
  reload of `/kalender` renders the shell, and an unknown page renders `offline.html`; no
  request to the Supabase origin is served from the SW cache (inspect `response.fromServiceWorker()`).
- Lighthouse PWA installability check in the PR description (manual, screenshot).

## Part B — Push notifications

### Prerequisites

- [ ] Generate a VAPID key pair once (`npx web-push generate-vapid-keys`, run locally by
      Martin or an agent; the private key never touches the repo). Store `VAPID_PRIVATE_KEY`,
      `VAPID_PUBLIC_KEY` and `VAPID_SUBJECT=mailto:sbsklubb@hotmail.com` as Edge Function
      secrets, and the public key as GitHub variable `VITE_VAPID_PUBLIC_KEY`.
- [ ] `pg_cron` and `pg_net` extensions enabled.

### Data model — migration `…_push_notifications.sql`

```sql
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  supabase_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique check (endpoint ~ '^https://'),
  p256dh text not null,
  auth text not null,
  user_agent text check (char_length(user_agent) <= 300),
  created_at timestamptz not null default now(),
  last_success_at timestamptz,
  failure_count int not null default 0
);
create index on public.push_subscriptions (supabase_id);
alter table public.push_subscriptions enable row level security;
create policy "Own subscriptions: read"   on public.push_subscriptions for select to authenticated using (auth.uid() = supabase_id);
-- No insert or update policy, on purpose: the push-subscribe Edge Function (service role) is the
-- only writer, because it enforces the push-service host allow-list. A direct REST insert would
-- let a member point push-send at any HTTPS host (SSRF). Revoke the grants too:
revoke insert, update on public.push_subscriptions from anon, authenticated;
create policy "Own subscriptions: remove" on public.push_subscriptions for delete to authenticated using (auth.uid() = supabase_id);

create table public.notification_preferences (
  supabase_id uuid primary key references auth.users (id) on delete cascade,
  categories jsonb not null default '{}'::jsonb,   -- { "event_reminder": true, ... }; missing key = default from the table above
  updated_at timestamptz not null default now()
);
alter table public.notification_preferences enable row level security;
create policy "Own preferences" on public.notification_preferences for all to authenticated
  using (auth.uid() = supabase_id) with check (auth.uid() = supabase_id);

create table public.notification_outbox (
  id bigint generated always as identity primary key,
  kind text not null,                                  -- a category key from the table above
  audience text not null check (audience in ('member', 'admins', 'all_members')),
  supabase_id uuid references auth.users (id) on delete cascade,   -- when audience = 'member'
  params jsonb not null default '{}'::jsonb,           -- template params, no free-text PII
  url text not null check (url ~ '^/'),                -- same-site path only
  dedupe_key text unique,                              -- e.g. 'event_reminder:<eventId>:<uid>'
  not_before timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','sending','sent','failed','skipped')),
  attempts int not null default 0,
  claimed_at timestamptz,                              -- lease: set when a sender claims the row
  last_error text,
  created_at timestamptz not null default now()
);
alter table public.notification_outbox enable row level security;   -- no policies: service role only
create index on public.notification_outbox (status, not_before);
```

Plus a retention job: delete outbox rows older than 30 days.

Triggers (security definer, fixed `search_path`, `revoke execute … from public, anon,
authenticated` like `20260809200650_harden_rls_admin_boundary.sql`) that insert outbox rows:

- `event_registrations` insert with `status='confirmed'` → `admin_new_registration`.
- `members` insert → `admin_new_member`.
- `membership_payments` insert/update to `paid` with `method='vipps'` → `admin_payment` +
  `payment_receipt` to the member (Phase 6 may instead write these from its function; pick one
  and note it in that phase).
- `contact_messages` insert → `admin_contact_message` (Phase 4 can then drop its own guard).

After each insert, kick the sender with `pg_net.http_post` to the `push-send` function URL using
a dedicated `PUSH_CRON_SECRET` header (store it in Vault, read it with
`vault.decrypted_secrets`); the 1-minute cron is the backstop.

### Edge Functions

`push-subscribe` (JWT required): body `{ endpoint, keys: { p256dh, auth } }`. Validates the
endpoint is `https://` and its host ends with one of the known push services
(`fcm.googleapis.com`, `updates.push.services.mozilla.com`, `web.push.apple.com`,
`*.notify.windows.com`) — rejects anything else so the sender can never be turned into an SSRF
proxy. Upserts on `endpoint` (a re-subscribe on the same device moves it to the current user).
`push-unsubscribe` deletes by endpoint for the caller. Clients must not write the table
directly: it has no insert/update policy and those grants are revoked, so the allow-list cannot
be bypassed. `push-send` re-checks the host allow-list before every send as a second guard.

`push-send` (no JWT; requires `x-push-secret` = `PUSH_CRON_SECRET`, constant-time compare):

1. `update notification_outbox set status='sending', claimed_at=now() … where id in (select id
… where ((status='pending' and not_before <= now()) or (status='sending' and claimed_at <
now() - interval '5 minutes')) order by id limit 100 for update skip locked) returning *`.
   The second branch is the lease: a run that crashed or hit the execution limit after claiming
   leaves rows in `sending`, and the next cron run reclaims them after 5 minutes. A reclaimed
   row may re-send to devices that already got it once; the notification `tag` makes the
   browser replace rather than stack it, which is acceptable.
2. Resolve recipients: `member` → that user; `admins` → users with `members.is_admin`;
   `all_members` → active members. Filter by preferences (missing key → default) and drop
   disabled members (Phase 3's disabled flag).
3. Quiet hours: if now is 22–08 Oslo and kind ≠ `admin_payment`, set `not_before` to next
   08:00 and `status='pending'`.
4. Render title/body from `supabase/functions/_shared/notificationTemplates.ts` by
   `profiles.locale` (`nb` fallback). Payload JSON:
   `{ title, body, url, tag: kind + ':' + (params.eventId ?? id), badgeCount? }` — keep < 3 KB.
5. `sendPush` to each subscription with `TTL: 86400` (reminders `TTL: 3600`), `urgency: 'normal'`
   (`'high'` for `admin_payment`). 404/410 → delete the subscription. Other errors →
   `failure_count++`; delete after 5 consecutive failures.
6. Mark `sent` / `failed` (`attempts++`, back to `pending` with `not_before = now() + 2^attempts
min` until 5 attempts).

`push-reminders` (cron, daily 10:00 Oslo): query Sanity server-side (project `85tc4tb0`,
dataset `production`, CDN, no token) for events and festival sessions starting tomorrow; for
each registration (`event_registrations` confirmed, plus Phase 3's "joined" table) insert an
`event_reminder` outbox row with `dedupe_key` so a rerun never double-sends.

`event_changed`: a Sanity webhook (Sanity → API → Webhooks, filter `_type in ["event",
"festival"]`, projection of time/location/cancelled, secret header) to a `sanity-event-changed`
function that verifies the Sanity signature (`@sanity/webhook` `isValidSignature`) and, when
start time, location or cancelled changed, inserts outbox rows for registered members.
`new_event`: same webhook on create/publish.

### Service worker handlers (`src/sw.ts`)

```ts
self.addEventListener('push', (event) => {
  const data = parsePushPayload(event.data?.json()); // zod-validated, returns null on junk
  if (!data) return;
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: data.tag,
      icon: `${BASE}pwa-192.png`,
      badge: `${BASE}badge-72.png`,   // monochrome
      data: { url: data.url },
      lang: data.lang,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = safeSameOriginUrl(event.notification.data?.url); // resolve against scope; anything off-origin → scope root
  event.waitUntil(focusOrOpen(target));
});

self.addEventListener('pushsubscriptionchange', ...); // re-subscribe and POST to push-subscribe
```

Put `parsePushPayload`, `safeSameOriginUrl` in `src/utils/pushPayload.ts` so Vitest covers them.

### Member and admin UI

New section **Varsler** on the member page (and the admin's own profile page):

- State machine: `unsupported` (no `PushManager`) → copy explains; `ios-needs-install` → the
  install hint from Part A; `denied` → how to re-enable in browser settings; `default` → button
  _Slå på varsler_; `granted+subscribed` → toggles per category (member ones; admins also see
  the admin group), and _Slå av varsler på denne enheten_.
- `Notification.requestPermission()` only inside the click handler. Never on page load.
- Toggles write `notification_preferences.categories` directly (RLS covers it).
- _Send en testvarsling_ button → `push-send-test` function (JWT, sends to the caller's own
  subscriptions only, 3/hour).
- Admin page: **Kunngjøring** card (decision 8) calling `push-announce` (JWT + `member_is_admin()`
  - `aal2` once the security plan's admin 2FA lands).

All copy in `nb` and `en` via the i18n setup from `i18n.md`.

### GDPR

Subscriptions and preferences cascade-delete with the auth user. The data export from
`gdpr.md` includes `notification_preferences` and the list of subscribed devices (user agent and
created date, not keys). The privacy policy names the push services (Google, Mozilla, Apple,
Microsoft) as the transport, and states no personal data is put in notification text.

## Tests for Part B

- Vitest: `pushPayload.test.ts` (junk payload ignored; `javascript:` and off-origin URLs map to
  the scope root; paths under base kept); `NotificationSettings.test.tsx` covering every state in
  the machine with `Notification`/`PushManager` stubs; preference toggles call the helper.
- Deno: `push-send` with injected `sendPush`, clock and db: preferences filter, quiet hours
  reschedule, 410 deletes, backoff, dedupe; `push-subscribe` rejects non-allow-listed hosts;
  template rendering in both locales never includes `params.name`/email.
- SQL: triggers insert exactly one outbox row per event (run against a Supabase branch with
  `create_branch`, never production).
- E2E: Playwright with `permissions: ['notifications']` in Chromium; subscribe flow posts to
  `push-subscribe` (route-mocked); then dispatch a synthetic push via CDP
  (`ServiceWorker.deliverPushMessage`) and assert `registration.getNotifications()` contains it.
- Manual matrix before turning on: Android Chrome, desktop Chrome, desktop Firefox, macOS
  Safari, iPhone (installed PWA, iOS ≥ 16.4). Record results in the PR.

## Rollout

1. Part A behind no flag (it is invisible until someone installs) — but ship to the `redesign`
   preview first and run the offline e2e.
2. Part B behind `VITE_ENABLE_PUSH`. Turn on for admins first (UI gated on `isAdmin`) for two
   weeks, then members.
3. Measure: count of subscriptions, send failures per day (a SQL view for the admin page).

## Definition of done

- Lighthouse reports installable; icons and splash correct on Android and iOS.
- Offline: shell, calendar and previously opened event pages load; personal data never cached.
- A member can opt in, choose categories, receive a reminder the day before an event they joined,
  and opt out; an admin receives payment, sign-up, member and contact notifications.
- No personal data in any notification text. Expired subscriptions are cleaned up.
- All checks green including Deno tests and the new e2e specs.
