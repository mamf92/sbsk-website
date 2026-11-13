# Phase 7 — Event community: who is coming, event chat and game tables

Status: planned (2026-11-13). Last phase of roadmap v2.
Base branch: `main` (confirmed by Martin 2026-11-13). One PR per work package, into `main`.
Supersedes `docs/plans/ideas/02-game-tables.md` (on the `redesign` branch). The table design
from that idea plan is folded in here and changed to fit the phases that came after it.

Depends on:

- `01-event-pages.md`: the `event` and `festival` documents, `/arrangementer/:slug`,
  `festivalScopeId()` / `parseFestivalScopeId()` in `src/utils/festival.ts`.
- `phase-2-admin-page.md`: `member_is_active()`, `current_member_id()`, the `member_directory`
  view, the admin page shell.
- `phase-3-members.md`: the slimmed `event_participants`, `getEventAttendees()`,
  `profiles.show_in_attendee_lists`, `requireMember()`.
- `phase-5-pwa-notifications.md`: `notification_outbox`, the category registry and the
  `sanity-event-changed` webhook function.
- `SECURITY_AND_RELIABILITY.md`: `admin_session()`, `admin_audit_log`, pgTAP in CI (S4),
  `safeHref()`, the "Rules for every feature" list.
- `gdpr.md`: the data inventory, `erase_member()` and the export.

Read `CLAUDE.md` and `SECURITY_AND_RELIABILITY.md` §3 first. Use the `sbsk-supabase-query`,
`sbsk-sanity-schema`, `sbsk-component` and `sbsk-release` skills for the work they cover.
Admin means `public.admin_session()` and member means `public.member_is_active()` everywhere
below.

---

## 1. Goal

Today the club's members coordinate in an event chat in Spond: "I'm only in if we play
Terraforming Mars, anyone else keen?" This phase brings that conversation onto the club's own
site, next to the event it is about. It ties the conversation to the two things it is usually
trying to arrange: who is coming, and who is playing what.

For every club event, signed-in members get one place with three parts:

1. **Deltakere (who is coming).** The sign-up list from phase 3, with avatars, visible to
   members and the board only.
2. **Chat.** A simple, text-only conversation for that event that opens before it and closes
   after it.
3. **Spillbord (game tables).** A member proposes a table ("Terraforming Mars, 18:30, needs 3
   players, room for 5"). Others take a seat. The table shows when it has enough players to go
   ahead, and every change appears in the chat as a card with a join button.

### Success looks like

- Kari writes "Noen som vil spille Terraforming Mars?". She taps "Foreslå et bord", picks the
  game, and a card appears in the chat. Two people tap "Bli med". The card turns to "Blir noe
  av!" and Kari gets one notification.
- A newcomer opens Thursday's spillkveld on their phone, sees 14 people are coming and that
  there is a beginner-friendly table with two free seats, and takes a seat.
- Nobody who is not an active member can read the chat, the attendee list or who sits at which
  table, either through the UI or the API. A disabled member loses access within one token
  lifetime.
- The board can hide a message, see reports, and pause a member's posting, and each action
  goes to the audit log.

### Out of scope

- Direct messages between members, group chats outside events, or a club-wide chat.
  (Moderation burden for a volunteer board. Revisit after a season of event chat.)
- Images, files, voice, GIFs, polls, reactions beyond one "👍", threads or replies. Text only
  keeps moderation and XSS simple.
- Tournament seating or pairings, which belong to the BGM programme in `01-event-pages.md`.
- Spond import or sync. During the transition, Spond sign-ups are not in `event_participants`.
  Chat and tables still work for every active member, and the attendee list says "Påmeldinger
  i Spond vises ikke her" when the event's `signup.method` is `spond`.
- Play logging after a table finishes. `docs/plans/ideas/03-play-log.md` picks that up and can
  read `game_tables` directly.

---

## 2. Decisions

| #   | Decision                                                                                                                                                                                                                                                                                                                               | Why                                                                                                                                                                                                                                                            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **Every event and festival gets a member page at `/medlemsportal/arrangementer/:slug`.** Level 2 and 3 pages (`/arrangementer/:slug`) also show a "For medlemmer" section with the same three parts when the visitor is a signed-in member. Level 1 rows in `/kalender` link to the member page ("Se hvem som kommer og chat").        | The biweekly spillkveld is a level 1 event with no public page, yet it is where the chat matters most. A member-only route avoids giving level 1 events public pages, which the event-pages plan forbids (bug 1 there). It also sits inside `requireMember()`. |
| D2  | **Community is on by default** and controlled by one Sanity field, `community` («Medlemsfellesskap»), on `event` and `festival`: `off` / `on` (default `on`).                                                                                                                                                                          | Editors should not have to remember to switch it on for every game night. They can turn it off for, for example, an external event the club only lists.                                                                                                        |
| D3  | **The database keeps a trusted mirror of event times, `event_windows`**, written only by the server from Sanity: by the `sanity-event-changed` webhook from phase 5, plus a nightly backfill.                                                                                                                                          | Chat opening and closing times, table time bounds and notification texts must not come from the browser. The database cannot read Sanity, so the mirror is how SQL learns them. It also closes the "client-supplied times" gap in the idea plan.               |
| D4  | **One chat per event or festival**, not one per festival day. Messages show their date and time, and during a festival the composer can tag a message with the day (`scope_id`), which gives a "Bare dag 2" filter.                                                                                                                    | BGM is three days with the same crowd. Splitting it into three rooms hides messages.                                                                                                                                                                           |
| D5  | **Chat window:** readable and open for posting from 30 days before start (or from publish, if later) until 24 hours after the end. Read-only for 30 days after that. All messages are deleted 90 days after the end.                                                                                                                   | The conversation is about arranging the event. Old chat is personal data with no purpose (`gdpr.md`, data minimisation).                                                                                                                                       |
| D6  | **Every active member can read and post**, whether or not they have signed up.                                                                                                                                                                                                                                                         | "Anyone keen on TM?" is how people decide whether to come. Requiring sign-up first defeats that.                                                                                                                                                               |
| D7  | **Text only, at most 500 characters, plain text.** `https://` URLs are linked through `safeHref()` with `rel="noopener noreferrer nofollow ugc"`. Everything else is a React text child with `whitespace-pre-line`. No Markdown and no HTML.                                                                                           | This removes the XSS surface (Rules 7–9 in the security plan) and the need for an image or embed policy.                                                                                                                                                       |
| D8  | **Realtime with Supabase Realtime `postgres_changes`** on `event_messages` and `game_table_seats`, filtered by `event_id`. RLS applies to these change events. If the socket fails, the page polls every 20 seconds while the tab is visible. The CSP already allows the Supabase websocket origin.                                    | A club event has at most a few hundred messages, which is well within free-tier limits. Supabase's Broadcast-from-database is the scaling path if that ever changes (noted in §11).                                                                            |
| D9  | **Moderation:** any member can report a message. Admins can hide a message (it is replaced by "Skjult av styret" for everyone), and can pause a member's posting for 1, 7 or 30 days. Every admin action writes to `admin_audit_log`. Members can edit their own message for 10 minutes and delete it at any time.                     | This is the smallest set that lets a volunteer board deal with a problem without reading every message.                                                                                                                                                        |
| D10 | **Chat rules accepted once.** The first time a member posts, a dialog shows the club's short chat rules (4 bullets, written by the board, kept in `src/locales/*/community.json`). Accepting stores `profiles.chat_rules_accepted_at`.                                                                                                 | Members can be as young as 13 (phase 3, decision 13). Clear rules give the board something to point to when hiding a message.                                                                                                                                  |
| D11 | **Tables have a minimum and a maximum.** A table is _Forslag_ (fewer than `seats_min` seated), _Blir noe av_ (min reached), _Fullt_ (max reached), _Avlyst_, or _Låst_ (one hour after it starts).                                                                                                                                     | This turns "I'm only in if…" into something the site can track and tell people about.                                                                                                                                                                          |
| D12 | **Tables appear in the chat.** Creating, confirming and cancelling a table each insert a system message (`kind = 'table'`) rendered as a `TableCard` with a join button. The composer has a "Foreslå et bord" button.                                                                                                                  | Tables and chat are one conversation. Members do not need to look in two places.                                                                                                                                                                               |
| D13 | **Names follow the attendee-list setting.** Seats and attendee lists show members with `show_in_attendee_lists = false` as "Et medlem" (and "+n" in avatar stacks), and the board sees names. A chat message always shows its author's name, and the composer says so ("Andre medlemmer ser navnet ditt"). Posting is an explicit act. | This is consistent with phase 3, decision 8. Anonymous chat would make moderation and trust harder.                                                                                                                                                            |
| D14 | **Taking a seat signs you up for the event** (insert into `event_participants` if missing). Leaving the event removes your seats. Spond events skip the coupling.                                                                                                                                                                      | Gives one answer to "who is coming". Check-in, badges and stats rely on it.                                                                                                                                                                                    |
| D15 | **All writes go through `security definer` RPCs**, and no table has a member insert or update policy. Reads are RLS selects.                                                                                                                                                                                                           | Rate limits, windows, capacity, overlap and the system messages must happen in one transaction.                                                                                                                                                                |
| D16 | **Per-member advisory locks for anything with a per-member rule** (posting rate, one table per time slot, tables per event): `pg_advisory_xact_lock(hashtext('<area>:' \|\| auth.uid()))` before the check.                                                                                                                            | Without it, two parallel requests from one member both pass a "count then insert" check (found in review of the idea plans).                                                                                                                                   |

---

## 3. User flows

### Member — the event's member page (`/medlemsportal/arrangementer/:slug`)

Header: title, date and time (Europe/Oslo), place, the member's own status ("Du er påmeldt" /
"Meld deg på"). Below it, underline tabs (decision 10 in the redesign log): **Chat** (default)
· **Spillbord (3)** · **Deltakere (14)**. The selected tab is in `?fane=chat|bord|deltakere` so
links and notifications can open the right tab. On desktop (≥ `lg`), Chat sits on the left and
Spillbord plus Deltakere sit on the right, with no tabs.

**Chat**

1. Shows the newest 50 messages, with older ones loaded on scroll up ("Vis eldre"). Each
   message has an avatar, display name, time, and the text. Own messages have a menu with
   "Rediger" (within 10 minutes) and "Slett". Other members' messages have "Rapporter".
2. The composer is a `Textarea` with a 500-character counter, "Send" (also Ctrl/⌘+Enter), and
   "Foreslå et bord". During a festival there is also a day select.
3. New messages arrive live. If the member has scrolled up, a pill "3 nye meldinger" scrolls
   down when tapped. Unread state is stored per member (`event_chat_reads`), and the calendar
   row and Min side show "Chat (3 nye)".
4. Before the window opens: "Chatten åpner {dato}". After posting closes: "Chatten er stengt.
   Den slettes {dato}."
5. A paused member sees "Du kan ikke skrive i chatten før {dato}." and the composer is
   disabled.

**Spillbord**

1. A list of `TableCard`s sorted by start time, with filters: tag chips (multi-select,
   `aria-pressed`) and "Har ledig plass".
2. Each card shows the game (Sanity image or a dice placeholder), title, time range, tags, a
   status chip, "3 av 4–5 spillere", avatars of seated members, the host's note, and an action
   button: "Bli med" / "Forlat bordet" / "Sett meg på venteliste (plass 2)" / "Låst".
3. "Foreslå et bord" opens `HostTableDialog`:
   - Game: search the catalogue (Sanity `game`, prefilling min and max from
     `playersMin`/`playersMax` and duration from `time`), or "Annet spill" as free text.
   - Day, for festivals.
   - Start time, which must be inside the event or day window.
   - Duration (30–480 minutes).
   - Min and max players (2–12, min ≤ max, the host counts).
   - Up to 3 tags: `beginner` «Nybegynnervennlig», `teaching` «Regler forklares», `quick`
     «Under 1 time», `heavy` «Tungt spill», `english` «Engelsk OK».
   - Note to the players (optional, at most 200 characters).
4. The host can edit (not below the number seated), cancel with a reason, or remove a seat with
   a reason.

**Deltakere**

1. "Kommer (14)" with avatars and names from `getEventAttendees()`. Hidden members are counted
   as "+2 til". Each member shows which table they sit at, if any.
2. Join and leave buttons for the event (phase 3's `joinEvent` / `leaveEvent`), unless the
   event uses Spond, in which case the Spond button and a note are shown instead.

### Visitor or signed-out member

Level 2 and 3 pages show a teaser: "Medlemmer planlegger spillbord og prater om arrangementet
her. Logg inn for å se hvem som kommer." with a "Logg inn" button
(`/login?next=<path>`, through phase 3's `safeNext()`). It shows no counts and no names.

### Board (admin)

1. On the member page, admins see every name, a "Moderering" menu on every message ("Skjul",
   "Pause medlem"), and a "Rapporter (2)" badge.
2. On the admin page (phase 2 shell), a new tab **"Chat og rapporter"** (`/styreportal/chat`)
   lists open reports across events: the message, the reporter's reason, and three actions:
   "Skjul meldingen", "Avvis rapporten", "Pause medlemmet". It also lists active posting pauses
   with a "Fjern pause" action.
3. In the admin event view, the "Spillbord" panel lists all tables with seated names, for the
   welcome desk, with a print view (`@media print`).

---

## 4. Data model

One migration per work package (§7). Names below are final, so other plans can refer to them.

### 4.1 Sanity (WP1)

On `event` and `festival` (`src/sanity/schemaTypes/eventType.ts`, `festivalType.ts`):

```ts
defineField({
  title: 'Medlemsfellesskap',
  name: 'community',
  type: 'string',
  description:
    'Skru av hvis medlemmer ikke skal få chat, deltakerliste og spillbord for dette arrangementet, f.eks. et eksternt arrangement vi bare viser i kalenderen.',
  options: {
    list: [
      { title: 'På', value: 'on' },
      { title: 'Av', value: 'off' },
    ],
    layout: 'radio',
  },
  initialValue: 'on',
}),
```

Treat a missing value as `on`, because existing documents have no value. Add it to the event
and festival GROQ projections and TypeScript types.

### 4.2 `event_windows`, the trusted mirror (WP1)

```sql
create table public.event_windows (
  event_id text primary key,                         -- published Sanity _id (never drafts.)
  kind text not null check (kind in ('event', 'festival')),
  slug text not null,
  title text not null check (char_length(title) <= 200),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  -- festival days: [{ "key": "<dayKey>", "starts_at": "...", "ends_at": "..." }]; [] for events
  days jsonb not null default '[]'::jsonb,
  signup_method text,                                -- from the signup object: spond|lenke|oppmote|stengt|sbsk
  community boolean not null default true,
  cancelled boolean not null default false,
  synced_at timestamptz not null default now()
);
create index event_windows_starts_idx on public.event_windows (starts_at);
alter table public.event_windows enable row level security;
-- Not personal data and already public in Sanity, but only members need it from Supabase.
create policy "Members read event windows" on public.event_windows
  for select to authenticated using (public.member_is_active());
revoke all on public.event_windows from anon;
revoke insert, update, delete on public.event_windows from authenticated;   -- service role only

-- Derived windows, used by every policy and RPC below.
create or replace function public.event_chat_state(p_event_id text)
returns text language sql stable security definer set search_path = public as $$
  select case
    when w.event_id is null or not w.community or w.cancelled then 'none'
    when now() < w.starts_at - interval '30 days' then 'not_open'
    when now() <= w.ends_at + interval '24 hours' then 'open'
    when now() <= w.ends_at + interval '30 days' then 'read_only'
    else 'none'
  end
  from (select 1) d left join event_windows w on w.event_id = p_event_id;
$$;
revoke execute on function public.event_chat_state(text) from public, anon;
grant execute on function public.event_chat_state(text) to authenticated;
```

A cancelled event closes its chat immediately (state `none`). The "Avlyst" banner comes from
Sanity, and the chat's last 24 hours of messages are deleted with the rest by the retention
job.

**Writers:**

- `supabase/functions/sanity-event-changed` (phase 5) also upserts `event_windows` on every
  create, update or publish of `event` / `festival`, and sets `cancelled = true` on unpublish or
  delete. The webhook projection grows to include `slug`, `title`, start and end, festival
  `days[]{_key, date, opens, closes}`, `signup.method` and `community`. The function already
  verifies the Sanity signature. Keep that check first.
- `supabase/functions/event-windows-backfill`, run by pg_cron nightly at 03:30 Oslo through
  `pg_net` with the `PUSH_CRON_SECRET`-style shared secret pattern from phase 5 (its own secret
  `EVENT_SYNC_SECRET` in Vault): queries Sanity's CDN (no token) for all `event` and `festival`
  documents ending after `now() - 90 days` and upserts them. This is a backstop for missed
  webhooks and the first fill.
- Festival day windows come from `days[].date` plus `opens`/`closes` (Oslo local time),
  converted to `timestamptz` in the function with a shared `osloLocalToUtc()` helper in
  `supabase/functions/_shared/time.ts` (Deno tests for both DST switches).

If a webhook is missed and the nightly job has not run yet, a brand-new event has no row and
its member page shows "Chatten åpner snart". This is acceptable, and the board can trigger the
backfill from the admin page ("Synkroniser arrangementer").

### 4.3 Chat (WP3)

```sql
create type public.event_message_kind as enum ('text', 'table', 'system');

create table public.event_messages (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.event_windows (event_id) on delete cascade,
  scope_id text,                                     -- festival day path from festivalScopeId(); null = whole event
  author_id uuid references auth.users (id) on delete cascade,   -- null for system messages
  kind public.event_message_kind not null default 'text',
  body text not null default '' check (char_length(body) <= 500),
  table_id uuid,                                     -- for kind = 'table'; FK added in WP6
  table_event text check (table_event in ('created', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,                            -- author deleted: body cleared, row kept for ordering
  hidden_at timestamptz,                             -- admin hid it
  hidden_by uuid references auth.users (id) on delete set null,
  check (kind <> 'text' or author_id is not null),
  -- table_id may become null later (table deleted, FK on delete set null), so only the event is required
  check (kind <> 'table' or table_event is not null)
);
create index event_messages_event_time_idx on public.event_messages (event_id, created_at desc);

create table public.event_message_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.event_messages (id) on delete cascade,
  reporter_id uuid references auth.users (id) on delete set null,
  reason text not null check (reason in ('harassment', 'spam', 'inappropriate', 'personal_info', 'other')),
  note text not null default '' check (char_length(note) <= 200),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id) on delete set null,
  resolution text check (resolution in ('hidden', 'dismissed')),
  unique (message_id, reporter_id)
);

create table public.event_chat_reads (
  event_id text not null references public.event_windows (event_id) on delete cascade,
  supabase_id uuid not null references auth.users (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  muted boolean not null default false,              -- per-event mute for chat push
  primary key (event_id, supabase_id)
);

create table public.chat_posting_pauses (
  supabase_id uuid primary key references auth.users (id) on delete cascade,
  until timestamptz not null,
  reason text not null check (char_length(reason) between 1 and 200),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.profiles add column chat_rules_accepted_at timestamptz;

alter table public.event_messages enable row level security;
alter table public.event_message_reports enable row level security;
alter table public.event_chat_reads enable row level security;
alter table public.chat_posting_pauses enable row level security;

-- Read messages: active members while the chat is open or read-only. A hidden or deleted
-- message has body = '' in this table (see event_message_moderation below), so a direct
-- API select or a realtime payload can never carry text a member is not allowed to see.
create policy "Members read event chat" on public.event_messages
  for select to authenticated using (
    public.admin_session()
    or (public.member_is_active()
        and public.event_chat_state(event_id) in ('open', 'read_only'))
  );

create policy "Admins read reports" on public.event_message_reports
  for select to authenticated using (public.admin_session());
create policy "Members read own reports" on public.event_message_reports
  for select to authenticated using (reporter_id = auth.uid() and public.member_is_active());

create policy "Own read markers" on public.event_chat_reads
  for all to authenticated
  using (supabase_id = auth.uid() and public.member_is_active())
  with check (supabase_id = auth.uid() and public.member_is_active());

create policy "Own pause, admins all" on public.chat_posting_pauses
  for select to authenticated using (supabase_id = auth.uid() or public.admin_session());

revoke all on public.event_messages, public.event_message_reports,
  public.chat_posting_pauses from anon;
revoke insert, update, delete on public.event_messages, public.event_message_reports,
  public.chat_posting_pauses from authenticated;
revoke all on public.event_chat_reads from anon;

-- Hidden text lives here, never in event_messages. Admin-only, and not in the realtime
-- publication.
create table public.event_message_moderation (
  message_id uuid primary key references public.event_messages (id) on delete cascade,
  original_body text not null check (char_length(original_body) <= 500),
  reason text not null check (char_length(reason) between 1 and 200),
  hidden_at timestamptz not null default now(),
  hidden_by uuid references auth.users (id) on delete set null
);
alter table public.event_message_moderation enable row level security;
create policy "Admins read moderation" on public.event_message_moderation
  for select to authenticated using (public.admin_session());
revoke all on public.event_message_moderation from anon;
revoke insert, update, delete on public.event_message_moderation from authenticated;
```

**Redaction happens in the database, at write time.** Hiding a message moves its text out of
`event_messages`, in one transaction, into `event_message_moderation` (admin-only), and sets
`event_messages.body = ''`. Deleting your own message sets `body = ''` with no copy kept. So the
member-readable table never holds text a member must not see. That holds for direct PostgREST
selects, for realtime `postgres_changes` payloads (which carry the row as stored) and for
exports, without relying on the client. The author also sees "Skjult av styret" rather than
their original text; the board explains the decision through its usual channels if asked.
Un-hiding (`admin_message_unhide`) copies the text back and deletes the moderation row.

**`event_messages_visible` view** (`security_invoker = true`, so the policy above still
applies). This is what the client selects. It adds `hidden = hidden_at is not null`,
`deleted = deleted_at is not null`, and the author's name and avatar from `member_directory`,
so a deleted account's messages are gone (cascade) and a renamed member shows the new name.
It does no redaction of its own: there is nothing left to redact. Admins load original text
for hidden messages from `event_message_moderation` in the moderation queue only.
Realtime subscribes to the base table. The client re-reads the changed row through the view by
id to get the joined name, but even the raw payload is safe because the stored body is already
empty.

**RPCs** (all `language plpgsql security definer set search_path = public`. Each starts with
`if not public.member_is_active() then raise exception 'not_member'`, and raises stable
error codes that the client maps in `communityErrors.ts`):

| Function                                                                                      | Does                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `event_message_post(p_event_id text, p_body text, p_scope_id text default null) returns uuid` | Advisory lock `chat:<uid>`. State must be `open` (`chat_closed`). No active pause (`posting_paused`). `profiles.chat_rules_accepted_at` is set (`rules_not_accepted`). Body is trimmed, 1–500 characters (`bad_length`). Rate limit: at most 6 messages per 60 seconds and 100 per event per day per member (`rate_limited`). `p_scope_id` must parse to a day key in `event_windows.days` (`bad_scope`). Inserts a `text` message. Queues `event_chat` notifications (§6). |
| `event_message_edit(p_message_id uuid, p_body text)`                                          | Author only, within 10 minutes of `created_at`, not hidden or deleted (`cannot_edit`). Same length checks. Sets `edited_at`.                                                                                                                                                                                                                                                                                                                                                |
| `event_message_delete(p_message_id uuid)`                                                     | Author only. Sets `deleted_at = now()`, `body = ''`.                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `event_message_report(p_message_id uuid, p_reason text, p_note text)`                         | Any member who can read the message, except its author (`own_message`). At most one report per member per message (`already_reported`) and 20 per day (`rate_limited`). Queues `admin_message_reported`.                                                                                                                                                                                                                                                                    |
| `event_chat_accept_rules()`                                                                   | Sets `profiles.chat_rules_accepted_at = now()` for the caller.                                                                                                                                                                                                                                                                                                                                                                                                              |
| `event_chat_mark_read(p_event_id text)`                                                       | Upserts `event_chat_reads.last_read_at = now()`.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `event_chat_unread(p_event_ids text[]) returns table(event_id text, unread int)`              | Counts visible `text`/`table` messages by others newer than the caller's marker, capped at 99. Used by the calendar and Min side.                                                                                                                                                                                                                                                                                                                                           |
| `admin_message_hide(p_message_id uuid, p_reason text)`                                        | `admin_session()` only (`forbidden`). In one transaction: inserts `event_message_moderation(message_id, original_body = body, reason)`, sets `body = ''`, `hidden_at`, `hidden_by`. Resolves open reports as `hidden`. Writes `admin_audit_log` (action `chat_hide`, reason; not the text). `admin_message_unhide(p_message_id)` reverses it, also audited.                                                                                                                 |
| `admin_report_dismiss(p_report_id uuid)`                                                      | Admin. Sets `resolution = 'dismissed'`. Audited.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `admin_posting_pause(p_supabase_id uuid, p_days int, p_reason text)`                          | Admin. `p_days` in (1, 7, 30). Upserts `chat_posting_pauses`. Audited.                                                                                                                                                                                                                                                                                                                                                                                                      |
| `admin_posting_unpause(p_supabase_id uuid)`                                                   | Admin. Deletes the row. Audited.                                                                                                                                                                                                                                                                                                                                                                                                                                            |

`revoke execute … from public, anon` on every function above, and `grant execute … to
authenticated` (each checks its own role).

### 4.4 Game tables (WP6)

```sql
create type public.table_tag as enum ('beginner', 'teaching', 'quick', 'heavy', 'english');
create type public.table_seat_status as enum ('seated', 'waitlist');

create table public.game_tables (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.event_windows (event_id) on delete cascade,
  scope_id text,                                     -- festival day path; null for single-day events
  host_id uuid not null references auth.users (id) on delete cascade,
  game_id text,                                      -- Sanity game _id (optional)
  game_title text not null check (char_length(game_title) between 1 and 80),
  starts_at timestamptz not null,
  duration_min int not null check (duration_min between 30 and 480),
  seats_min int not null check (seats_min between 2 and 12),
  seats_max int not null check (seats_max between 2 and 12),
  tags public.table_tag[] not null default '{}' check (cardinality(tags) <= 3),
  note text not null default '' check (char_length(note) <= 200),
  confirmed_at timestamptz,                          -- first time seated >= seats_min
  cancelled_at timestamptz,
  cancel_reason text check (char_length(cancel_reason) <= 200),
  created_at timestamptz not null default now(),
  check (seats_min <= seats_max)
);
create index game_tables_event_idx on public.game_tables (event_id) where cancelled_at is null;

create table public.game_table_seats (
  table_id uuid not null references public.game_tables (id) on delete cascade,
  supabase_id uuid not null references auth.users (id) on delete cascade,
  status public.table_seat_status not null,
  position int not null,                             -- arrival order; waitlist promotion uses it
  created_at timestamptz not null default now(),
  primary key (table_id, supabase_id)
);
create index game_table_seats_member_idx on public.game_table_seats (supabase_id);

alter table public.event_messages
  add constraint event_messages_table_fk foreign key (table_id)
  references public.game_tables (id) on delete set null;
-- A 'table' message whose table is gone renders as "Bordet finnes ikke lenger".

alter table public.game_tables enable row level security;
alter table public.game_table_seats enable row level security;

create policy "Members read tables" on public.game_tables
  for select to authenticated using (
    public.admin_session()
    or (public.member_is_active() and public.event_chat_state(event_id) in ('open', 'read_only'))
  );
create policy "Members read seats" on public.game_table_seats
  for select to authenticated using (
    public.admin_session()
    or (public.member_is_active() and exists (
      select 1 from public.game_tables t
      where t.id = table_id and public.event_chat_state(t.event_id) in ('open', 'read_only')))
  );
revoke all on public.game_tables, public.game_table_seats from anon;
revoke insert, update, delete on public.game_tables, public.game_table_seats from authenticated;
```

The table lock time is `starts_at + interval '1 hour'`, computed in the RPCs and the
`game_tables_visible` view, not stored. A view `game_tables_visible` (`security_invoker`) adds
`seated_count`, `waitlist_count`, `status` (`proposal | confirmed | full | cancelled | locked`),
`locks_at`, and the seated members as a JSON array from `member_directory`. Hidden members
appear as `{ "hidden": true }` unless the caller is an admin or that member.

**RPCs:**

| Function                                                                                                                                                 | Does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `game_table_create(p_event_id, p_scope_id, p_game_id, p_game_title, p_starts_at, p_duration_min, p_seats_min, p_seats_max, p_tags, p_note) returns uuid` | Advisory lock `tables:<uid>`. Chat state `open` (`closed`). `p_starts_at` is in the future and inside the event window, or inside the day window from `event_windows.days` when `p_scope_id` is set (`bad_time`). Host has no overlapping seat (`slot_taken`). At most 5 tables per member per event (`too_many_tables`). Inserts the table and seats the host at position 1. Ensures an `event_participants` row unless `signup_method = 'spond'`. Inserts a `table`/`created` chat message.                                                  |
| `game_table_update(p_table_id, …same fields except event…)`                                                                                              | Host or admin. Not locked (`locked`). `seats_max` ≥ seated (`below_seated`). Time rules as above.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `game_table_join(p_table_id) returns table_seat_status`                                                                                                  | Advisory lock `tables:<uid>`, then `select … for update` on the table. Not cancelled or locked. No overlapping seat (`slot_taken`). Seats the member if seated < `seats_max`, else waitlists them. Ensures `event_participants`. If seated reaches `seats_min` and `confirmed_at` is null: `update … set confirmed_at = now() where id = … and confirmed_at is null returning id`, and only when that returns a row, inserts a `table`/`confirmed` message and queues `table_confirmed`. Queues `table_seat_taken` for the host (batched, §6). |
| `game_table_leave(p_table_id)`                                                                                                                           | Removes the caller's seat. If they were seated, promotes the lowest-position waitlisted member and queues `table_promoted`. A host leaving must cancel instead (`host_must_cancel`). `confirmed_at` is not cleared when the count drops: the table shows "Mangler 1" but does not announce a second confirmation.                                                                                                                                                                                                                              |
| `game_table_remove_seat(p_table_id, p_supabase_id, p_reason)`                                                                                            | Host or admin. Promotes the waitlist. Audited when the actor is an admin who is not the host.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `game_table_cancel(p_table_id, p_reason)`                                                                                                                | Host or admin. Sets `cancelled_at`, inserts a `table`/`cancelled` message, queues `table_cancelled` to the seated and waitlisted members.                                                                                                                                                                                                                                                                                                                                                                                                      |

**Overlap rule:** two tables overlap when `a.starts_at < b.starts_at + b.duration_min *
interval '1 minute'` and `b.starts_at < a.starts_at + a.duration_min * interval '1 minute'`,
counting tables that are not cancelled where the member is seated or waitlisted.

**Leaving the event:** phase 3 dropped `update-event-participants` and made leave a direct RLS
delete. Add an `after delete` trigger on `event_participants` (security definer) that removes
the member's seats for that event and runs the same waitlist promotion. This lives in SQL so no
client path can skip it.

---

## 5. Frontend

### 5.1 Routes (`src/main.tsx`, inside the `memberPortalEnabled` spread)

```ts
{
  path: 'medlemsportal/arrangementer/:slug',
  element: <EventCommunity />,
  loader: eventCommunityLoader,
},
```

The loader runs `requireMember()` (redirects to `/login?reason=not_authenticated&next=…`),
then resolves the slug through Sanity (event or festival, published), then loads the
`event_windows` row, the first page of messages, tables and attendees in parallel with
`settle()`. Each part degrades on its own: a failed chat load shows an `Alert` in the chat
pane only. It 404s when the slug is unknown or `community` is `off`.

### 5.2 Files

| File                                                                                                    | What                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/pages/EventCommunity.tsx`                                                                          | Page: header, tabs on mobile, two columns on desktop.                                                                                                                                                                                                                                                                                                              |
| `src/loaders/event-community-loader.ts` (+ test)                                                        | As above.                                                                                                                                                                                                                                                                                                                                                          |
| `src/supabase/queryHelpers/eventChat.ts`                                                                | `getMessages(eventId, { before?, limit })` from `event_messages_visible`, `postMessage`, `editMessage`, `deleteMessage`, `reportMessage`, `acceptChatRules`, `markRead`, `getUnread(eventIds)`, `subscribeToChat(eventId, onChange)` returning an unsubscribe function. Admin: `hideMessage`, `dismissReport`, `pausePosting`, `unpausePosting`, `getOpenReports`. |
| `src/supabase/queryHelpers/gameTables.ts`                                                               | `getTables(eventId)` from `game_tables_visible`, `createTable`, `updateTable`, `joinTable`, `leaveTable`, `removeSeat`, `cancelTable`, `subscribeToTables(eventId, onChange)`.                                                                                                                                                                                     |
| `src/supabase/queryHelpers/communityErrors.ts` (+ test)                                                 | Every error code above → Norwegian (and English through i18n keys). Unknown → "Noe gikk galt. Prøv igjen."                                                                                                                                                                                                                                                         |
| `src/schemas/community.ts` (+ test)                                                                     | zod: message 1–500 after trim, report reason enum and note ≤ 200, table form (title 1–80, duration 30–480, 2 ≤ min ≤ max ≤ 12, tags ≤ 3, note ≤ 200, start within window).                                                                                                                                                                                         |
| `src/hooks/useEventChat.ts` (+ test)                                                                    | Message list state: initial page, "load older", realtime merge by id (re-reading through the view), optimistic send with a temporary id and rollback, a 20-second polling fallback when the channel status is not `SUBSCRIBED`, and unsubscribe on unmount.                                                                                                        |
| `src/hooks/useGameTables.ts` (+ test)                                                                   | The same pattern for tables and seats, with optimistic join and leave.                                                                                                                                                                                                                                                                                             |
| `src/components/ui/ChatMessage.tsx` (+ test)                                                            | One message: avatar, name, time (`<time dateTime>`), body with `whitespace-pre-line`, https links through `linkifyText()`, "redigert", "slettet" and "skjult" states, and an overflow menu (`Dropdown` or native `<details>`).                                                                                                                                     |
| `src/components/ui/ChatComposer.tsx` (+ test)                                                           | `Textarea`, counter, send `Button` with `loading`, "Foreslå et bord", optional day select.                                                                                                                                                                                                                                                                         |
| `src/components/ui/TableCard.tsx` (+ test)                                                              | As in the idea plan, plus a status chip and "x av min–max". Used in the list and inside chat messages.                                                                                                                                                                                                                                                             |
| `src/utils/linkifyText.ts` (+ test)                                                                     | Splits text into string and `{ href, label }` parts for `https://` URLs only, and runs every href through `safeHref()`. It returns data, not HTML. Tests: `javascript:`, `data:`, `http:`, uppercase scheme, URLs with quotes and angle brackets, trailing punctuation.                                                                                            |
| `src/components/sections/eventCommunity/ChatPane.tsx`                                                   | List with `role="log"` and `aria-live="polite"`, "Vis eldre", "n nye meldinger" pill, rules dialog on the first send, report dialog.                                                                                                                                                                                                                               |
| `src/components/sections/eventCommunity/TablesPane.tsx`, `HostTableDialog.tsx`, `ManageSeatsDialog.tsx` | Tables UI.                                                                                                                                                                                                                                                                                                                                                         |
| `src/components/sections/eventCommunity/AttendeesPane.tsx`                                              | Phase 3's attendee data, plus "ved bord: {spill}".                                                                                                                                                                                                                                                                                                                 |
| `src/components/sections/eventCommunity/MembersTeaser.tsx`                                              | The signed-out teaser for level 2 and 3 pages.                                                                                                                                                                                                                                                                                                                     |
| `src/components/sections/BoardPortalSection/ChatModeration.tsx`                                         | `/styreportal/chat`: reports and pauses.                                                                                                                                                                                                                                                                                                                           |
| `CalendarSection` / Min side calendar                                                                   | "Chat (n nye)" link per row from `getUnread()` (one call per visible month, not per row).                                                                                                                                                                                                                                                                          |
| `src/locales/{nb,en}/community.json`                                                                    | All copy below, plus the chat rules.                                                                                                                                                                                                                                                                                                                               |

### 5.3 Copy (nb; English in `en/community.json`)

- Tabs: "Chat", "Spillbord ({n})", "Deltakere ({n})"
- Composer placeholder: "Skriv til alle som skal på {arrangement} …". Note under it: "Andre
  medlemmer ser navnet ditt." Button "Send". Link "Foreslå et bord".
- Rules dialog title: "Før du skriver". Body: the board's four rules. Button "Jeg forstår".
  Draft rules for the board to adjust:
  1. Hold en vennlig tone, også når du er uenig.
  2. Ikke del andres kontaktinfo eller bilder.
  3. Chatten handler om arrangementet. Reklame og spam fjernes.
  4. Styret kan skjule meldinger og pause kontoer som bryter reglene.
- Message states: "(redigert)", "Meldingen er slettet", "Skjult av styret"
- Report dialog: "Rapporter melding". Reasons: "Trakassering", "Spam", "Upassende innhold",
  "Deler personopplysninger", "Annet". Optional note "Fortell styret mer (valgfritt)". Success:
  "Takk. Styret ser på det."
- Window: "Chatten åpner {dato}", "Chatten er stengt. Den slettes {dato}.", "Du kan ikke skrive
  i chatten før {dato}."
- Tables: "Foreslå et bord", "Forslag — mangler {n}", "Blir noe av!", "Fullt", "Avlyst",
  "Låst", "{seated} av {min}–{max} spillere", "Bli med", "Forlat bordet", "Sett meg på venteliste
  (plass {n})", "Venteliste: {n}"
- Table chat cards: "{navn} foreslår et bord: {spill} kl. {tid}", "{spill} kl. {tid} blir noe
  av!", "{spill} kl. {tid} er avlyst: {grunn}"
- Teaser: "Medlemmer planlegger spillbord og prater om arrangementet her. Logg inn for å se hvem
  som kommer."
- Spond note: "Påmeldinger i Spond vises ikke her ennå."

Run the copy past the `design:ux-copy` skill in WP4 and WP7.

### 5.4 Accessibility

- The message list is `role="log"` with `aria-live="polite"`. New messages are announced
  without moving focus. The "n nye meldinger" pill is a real button.
- Every menu and dialog uses the existing `Dialog` and focus-return pattern. The composer keeps
  focus after sending.
- `TableCard` buttons name the table ("Bli med på Terraforming Mars kl. 18:30").
- Avatar stacks have a text alternative ("Kari, Ola og 2 til").
- Timestamps show relative text ("for 5 min siden") with the absolute Oslo time in `dateTime`
  and a `title`. Relative text updates every minute without re-announcing.
- `axe` checks in the Playwright specs for the member page (WP9).

---

## 6. Notifications (additions to the phase 5 registry)

Add these rows to the category table in `phase-5-pwa-notifications.md` in WP8, so there stays
one registry. All are opt-in under phase 5's rules, follow quiet hours, and never put message
text or other members' names in the notification. The click target is the member page with
the right `?fane=`.

| Key                      | Who                            | Default when enabled | Text (nb)                            | Rule                                                                                                                                                                                                                                                         |
| ------------------------ | ------------------------------ | -------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `event_chat`             | member                         | off                  | "Nye meldinger om {event}"           | Only for events the member joined or posted in, and not muted in `event_chat_reads`. At most one per event per 30 minutes per member (`dedupe_key = 'event_chat:<event>:<uid>:<30-min bucket>'`). Skipped if the member read the chat in the last 2 minutes. |
| `table_seat_taken`       | member (host)                  | on                   | "{seated}/{min} til {game}"          | Batched: at most one per table per 15 minutes.                                                                                                                                                                                                               |
| `table_confirmed`        | member (seated)                | on                   | "{game} kl. {time} blir noe av!"     | Once per table (guarded by `confirmed_at`).                                                                                                                                                                                                                  |
| `table_promoted`         | member                         | on                   | "Du fikk plass på {game} kl. {time}" | Immediately.                                                                                                                                                                                                                                                 |
| `table_cancelled`        | member (seated and waitlisted) | on                   | "{game} kl. {time} er avlyst"        | Immediately.                                                                                                                                                                                                                                                 |
| `admin_message_reported` | admin                          | on                   | "En chatmelding er rapportert"       | At most one per 15 minutes.                                                                                                                                                                                                                                  |

`{game}` is a game title (catalogue or member-entered). Run member-entered titles through the
same plain-text handling as the chat. The service worker shows text, never HTML.

---

## 7. Work packages (one PR each, into `main`)

| WP  | Title                                                                                                         | Depends on                                             | Size | Done when                                                                                                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| WP1 | `community` field in Sanity, `event_windows` table, webhook upsert, nightly backfill, `event_chat_state()`    | Phase 5 webhook function, event-pages WP5 (`festival`) | M    | Publishing an event in Studio upserts its window within a minute. The backfill fills every event ending in the last 90 days. pgTAP covers state transitions around each boundary (fake `now()` via a test helper). |
| WP2 | Member page route, loader, header, `AttendeesPane`, signed-out teaser on level 2/3, calendar link             | WP1, phase 3 step 4                                    | M    | A member opens `/medlemsportal/arrangementer/<slug>` for a level 1 spillkveld and sees who is coming. Signed out redirects to login. `community = off` gives 404.                                                  |
| WP3 | Chat schema, view, RPCs, pgTAP                                                                                | WP1, security S2–S4                                    | M    | All §8 database checks pass.                                                                                                                                                                                       |
| WP4 | Chat UI, realtime, unread counts, rules dialog                                                                | WP3                                                    | L    | Two browsers see each other's messages live. Edit, delete and report work. Polling fallback works with the socket blocked.                                                                                         |
| WP5 | Moderation: admin hide, reports queue, posting pauses, audit entries                                          | WP3, phase 2 shell                                     | M    | An admin hides a reported message from the queue. Members see "Skjult av styret". The audit log has the entry. A paused member cannot post (RPC refuses even if the UI is bypassed).                               |
| WP6 | Tables schema, view, RPCs, the `event_participants` trigger, pgTAP                                            | WP3                                                    | M    | All §8 table checks pass, including the races.                                                                                                                                                                     |
| WP7 | Tables UI, `TableCard` in chat, "Foreslå et bord", host and seat management, admin table panel and print view | WP4, WP6                                               | L    | Martin's example works end to end: post, propose a table, two people join, the card turns "Blir noe av!".                                                                                                          |
| WP8 | Notifications (§6), registry update in phase 5's doc, per-event mute toggle                                   | WP4, WP7, phase 5 Part B                               | M    | Each category fires once under its rule, respects quiet hours and opt-in, and contains no names or message text.                                                                                                   |
| WP9 | GDPR hooks, privacy policy text, retention job, Playwright and axe specs, launch                              | All above, gdpr.md steps 2–4                           | M    | §9 holds. Export includes the new data. `erase_member()` handles it. The e2e suite covers the flows in §10.                                                                                                        |

WP1 and WP2 can ship before the chat to give members the attendee list early. WP3–WP5 can
launch without tables, and WP6–WP7 can follow. Report each green PR to the coordinator before
merging (project merge rule).

---

## 8. Security

Threats: a member (or a stolen member session) reading or writing more than they should; a
non-member reading member-only data; abusive content; XSS through member text; spam and flooding;
privacy leaks through realtime, notifications or exports.

### Checklist (each item is a test or a review point in the WP that introduces it)

- [ ] **RLS on every new table in the creating migration**; `anon` revoked; no member insert,
      update or delete grants on chat or table tables (D15).
- [ ] **Role matrix in pgTAP** for `event_messages`, `event_message_reports`, `event_chat_reads`,
      `chat_posting_pauses`, `game_tables`, `game_table_seats`, `event_windows`: anon, active
      member, other active member, **disabled member** (still has a JWT), admin at `aal1`, admin
      at `aal2`. A disabled member reads nothing and every RPC returns `not_member`. An admin at
      `aal1` gets member rights only.
- [ ] **Windows enforced in SQL**: no read before `not_open` ends (except admins), no post after
      `open`, nothing readable after 30 days. Tested with a time helper around every boundary.
- [ ] **No identity from the client**: no RPC takes the acting member's id; `author_id`,
      `host_id` and seat ids come from `auth.uid()`.
- [ ] **Races** (two connections, `dblink` or a test harness that opens two sessions): a member
      posting from two tabs cannot exceed the rate limit; joining two overlapping tables at once
      gives one `slot_taken`; 10 parallel joins on a table with `seats_max = 4` seat exactly 3
      plus the host and waitlist 7; `table_confirmed` fires once under parallel joins.
- [ ] **Hidden content does not leak**: after hide or delete, no row a non-admin can select
      (base table or view) contains the original text. pgTAP asserts it from the member role
      with a direct `select body from event_messages`. `event_message_moderation` is not in the
      `supabase_realtime` publication, and a realtime test (WP4) shows the hide update arrives
      with an empty body. Notifications and other members' exports never include it.
- [ ] **XSS**: chat bodies, table titles, notes and report notes are React text children. The
      `linkifyText()` tests cover hostile URLs. `react/no-danger` lint is on (event-pages §8).
      A Playwright spec posts `<img src=x onerror=alert(1)>` and `javascript:alert(1)` and
      asserts they render as text with no link and no dialog.
- [ ] **Flooding**: per-member rate limits (6/min, 100/event/day messages; 20 reports/day;
      5 tables/event) enforced in the RPCs under advisory locks. Supabase's API rate limits are
      the outer layer.
- [ ] **Moderation is audited**: every admin hide, dismiss, pause, unpause, seat removal and
      table cancellation by a non-host admin writes `admin_audit_log`.
- [ ] **Realtime authorization**: realtime connects with the member's JWT. Confirm in WP4 (with
      a test project or local stack) that `postgres_changes` events for these tables reach only
      subscribers whose `select` policy passes. Record the result in the PR. If any event leaks,
      switch to private Broadcast channels with RLS on `realtime.messages` before launch.
- [ ] **Notifications**: no message text, no other member's name, same-site URLs only
      (phase 5's `url ~ '^/'` check).
- [ ] **Webhook and backfill**: Sanity signature checked first; backfill secret compared in
      constant time; both functions use the service role only after their check and never
      accept event times from a browser.
- [ ] **No new third-party host**; CSP unchanged (`e2e/csp.spec.ts` stays green).
- [ ] **Supabase advisors** (security and performance) clean after each migration; indexes on
      every column used in an RLS predicate or filter.

### Safeguarding

Members can be 13 or older (phase 3, decision 13). The chat is visible to every active member
of the event, never one-to-one, and the board can see everything and act on reports. The
rules dialog (D10) and the report button are the controls. Direct messages stay out of scope
for this reason as well as the moderation load.

---

## 9. Data and GDPR (rows for the `gdpr.md` inventory, added in WP9)

| Data                             | Where                             | Purpose                                        | Legal basis       | Who sees it                                           | Kept until                                                                                       | On account deletion                                                                                               |
| -------------------------------- | --------------------------------- | ---------------------------------------------- | ----------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Event chat messages              | `event_messages`                  | Arranging an event with other members          | (b) membership    | Active members while the chat is readable; board      | Event end + 90 days                                                                              | Deleted (cascade)                                                                                                 |
| Reports filed                    | `event_message_reports`           | Moderation                                     | (f)               | Board; the reporter sees their own                    | 12 months after resolution                                                                       | Reporter set null; reports on your own messages deleted with the messages                                         |
| Text of hidden messages          | `event_message_moderation`        | Moderation evidence                            | (f)               | Board only                                            | Same as the message: event end + 90 days                                                         | Deleted with the message (cascade)                                                                                |
| Read markers and per-event mutes | `event_chat_reads`                | Unread counts, notification preference         | (b)               | Only you                                              | Event end + 90 days                                                                              | Deleted                                                                                                           |
| Posting pauses                   | `chat_posting_pauses`             | Moderation                                     | (f)               | You (own); board                                      | Until it expires + 30 days                                                                       | Deleted                                                                                                           |
| Chat rules accepted at           | `profiles.chat_rules_accepted_at` | Showing the rules once                         | (b)               | You; board                                            | With the profile                                                                                 | Deleted with the profile                                                                                          |
| Tables you host, seats you take  | `game_tables`, `game_table_seats` | Arranging play at an event                     | (b)               | Active members (hidden members as "Et medlem"); board | Event end + 90 days (or longer once the play log reads them: then that plan's retention applies) | Deleted (cascade); a hosted table disappears for its players, and its chat card shows "Bordet finnes ikke lenger" |
| Event times mirror               | `event_windows`                   | Opening and closing chat, checking table times | Not personal data | Members; server                                       | Event end + 1 year                                                                               | —                                                                                                                 |

- **`erase_member()`** (gdpr.md step 3) needs no new deletes, because every member column above
  cascades from `auth.users` or `members`, except: before deleting, cancel tables the member
  hosts in events that have not ended, so their players get a `table_cancelled` notification,
  and set `event_message_reports.reporter_id = null`. Add both as numbered steps there, and a
  pgTAP test that a deleted member leaves no row with their id in any table above.
- **Export** (gdpr.md step 2): add `event_chat` (your messages: event title, time, text, edited
  or deleted state; not other people's messages), `reports_filed`, `tables_hosted`,
  `table_seats`, `chat_posting_pauses`, `chat_rules_accepted_at`.
- **Retention job** (gdpr.md step 4, nightly): delete `event_messages` (and so `event_message_moderation`), `game_tables` (and so
  seats) and `event_chat_reads` for events where `ends_at < now() - 90 days`; delete resolved
  reports older than 12 months; delete expired pauses older than 30 days; delete
  `event_windows` older than 1 year. Delete in batches of 1,000 to keep the job short.
- **Privacy policy** (`legal.json` → `privacy.*`), new section «Chat og spillbord»: what is
  stored, that other members see your name and messages for that event, that the board can
  read and hide messages, the 90-day deletion, and how to report. Terms (`terms.*`): the chat
  rules and the board's right to hide and pause.

---

## 10. Tests

**pgTAP (`supabase/tests/event_community_*.test.sql`)**: the role matrix and windows (§8),
every RPC's error codes, rate limits, edit window, hidden and deleted view behaviour, report
uniqueness, pauses, table states (proposal → confirmed → full → locked; cancel), waitlist
promotion order, the `event_participants` delete trigger, the races, and the GDPR cascade.

**Deno tests** (`supabase/functions/*/test.ts`): webhook signature rejection, projection to
`event_windows` (event, festival with days, unpublish → cancelled), `osloLocalToUtc()` across
both DST switches, backfill secret check.

**Unit (Vitest)**: `linkifyText`, `communityErrors`, zod schemas, `useEventChat` (merge,
ordering, optimistic send and rollback, polling fallback, unsubscribe), `useGameTables`,
`ChatMessage` states, `TableCard` states, `ChatComposer` counter and disabled states, the
loader's partial-failure handling.

**Playwright (stubbed Supabase through `e2e/fixtures/supabase.ts`, with a fake realtime
channel)**:

1. Signed out: `/medlemsportal/arrangementer/<slug>` redirects to login; a level 2 page shows
   the teaser with no counts.
2. Member posts a message; it appears; rules dialog shows on the first post only.
3. A second fixture member's message arrives through the fake channel and is announced.
4. XSS strings render as text.
5. Member proposes a table from the composer; the card appears in chat and in Spillbord; a
   second member joins; the card shows "Blir noe av!".
6. Full table offers the waitlist.
7. Report flow; admin queue hides it; member sees "Skjult av styret".
8. Paused member sees the disabled composer.
9. `axe` has no serious violations on the member page (mobile and desktop widths).

---

## 11. Later (not in this phase)

- Broadcast-from-database channels if realtime volume or the policy cost per change grows.
- "Spill jeg vil lære" (games I want to learn) on the profile, shown to hosts when they pick a
  game.
- Handing a locked table to the play log in one tap (`docs/plans/ideas/03-play-log.md`).
- A board-only announcement pinned at the top of an event chat (reusing phase 5's
  `club_announcement` text rules).
- Direct messages, if the board decides it can moderate them.
