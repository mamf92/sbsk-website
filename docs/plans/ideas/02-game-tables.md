# Plan: Spillbord — find a table at game night

Status: proposed · Owner: unassigned · Read [README.md](./README.md) first for the shared rules.

## 1. Goal

Before a game night, members can announce a table ("Jeg tar med _Ark Nova_, 3 ledige plasser,
nybegynnervennlig, starter 18:30") and others can take a seat. Newcomers can see in advance that
there is a table that will teach them, and hosts know whether to bring a long or a short game.
At the event, the board can see at a glance who is at which table.

### Success looks like

- A first-time visitor who has just become a member opens the event page, filters "Nybegynnervennlig",
  takes a seat, and walks in knowing who to look for.
- A host posts a table from their phone in under 30 seconds, picking the game from the club's
  catalogue or typing a title.
- Tables fill to capacity, never beyond it, even when two people tap "Bli med" at the same moment.
- Signed-out visitors see that tables exist and how many seats are free, but not who is sitting there.

### Out of scope

- Tournament seating and pairings (that belongs to event pages / BGM programme).
- Chat between table members (privacy, moderation; use the seat note instead).
- Tables outside a club event ("meetups at someone's home") — not a club activity the board
  wants to be responsible for.

## 2. Decisions made

| Decision                  | Choice                                                                                                                                                                              | Why                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Name in UI                | "Spillbord" (table), action "Bli med" (join), "Sett opp et bord" (host)                                                                                                             | Plain Norwegian, matches how members talk.                                                    |
| Tied to                   | One Sanity event (`event._id`), optionally one `schedule` entry (session) for multi-day events like BGM via `session_key` = the schedule item's `_key`                              | Tables only make sense at a time and place the club runs. BGM has several sessions per day.   |
| Game                      | Either a Sanity `game` `_id` (preferred, gets image and player count) or a free-text title (≤ 80 chars)                                                                             | Members bring their own games too.                                                            |
| Capacity                  | `seats_total` (host included), `2..12`. Defaults from the game's `playersMax` when picked from the catalogue.                                                                       | Prevents over-booking, and the catalogue already knows the player count.                      |
| Labels                    | Fixed set of tags: `beginner` ("Nybegynnervennlig"), `teaching` ("Regler forklares"), `quick` ("Under 1 time"), `heavy` ("Tungt spill"), `english` ("Engelsk OK"). Max 3 per table. | Free-form tags invite inconsistency and abuse; a fixed set filters well and translates later. |
| Who can host / join       | Members only (signed in).                                                                                                                                                           | Accountability; the club knows who is coming.                                                 |
| Visibility                | Signed out: game, time, tags, seats free. Signed in: also host and seated members' first names + avatars.                                                                           | Members' names are personal data; visitors only need to know there is room.                   |
| Joining                   | Instant (no host approval). Host can remove a seat with a reason.                                                                                                                   | Approval adds a waiting state and notifications for little gain at a club night.              |
| Waitlist                  | Yes, simple: when full, "Sett meg på venteliste"; first in line is promoted automatically when a seat frees.                                                                        | Popular games fill instantly; promotion is easy to reason about.                              |
| Limit                     | A member can be seated (or waitlisted) at one table per time slot. Hosting counts as seated.                                                                                        | Stops people holding seats at three tables. Overlap is computed on start time + duration.     |
| Relation to event sign-up | Taking a seat also signs the member up for the event (`event_participants`) if not already. Leaving the event removes their seats.                                                  | One source for "who is coming", which check-in and stats rely on.                             |
| Lock time                 | Tables lock 1 hour after `starts_at`; no joins/leaves after that. Then they become history for the play log.                                                                        | Keeps history stable; the play log plan picks up from here.                                   |
| Writes                    | Through `security definer` SQL functions.                                                                                                                                           | Capacity and the one-table rule need a transaction with locks.                                |

## 3. User stories and flows

**Visitor**

1. On `/arrangementer/:id` (event page), a "Spillbord" section lists tables: game image/title,
   start time, tags, "2 av 4 plasser ledige". Button: "Logg inn for å bli med".

**Member — join**

1. Same list, also shows host name and avatars of seated members (`AvatarStack`).
2. Filters: tag chips (multi-select, per redesign step 10) and "Har ledig plass".
3. "Bli med" → confirm inline (no dialog) → seat appears with their avatar, button becomes
   "Forlat bordet". If the slot conflicts with another seat: `Alert` "Du sitter allerede på
   {spill} kl. {tid}. Forlat det bordet først."
4. Full table → "Sett meg på venteliste (plass {n})".

**Member — host**

1. "Sett opp et bord" → `Dialog`: game (searchable list from the catalogue with "Annet spill"
   free-text fallback), session (for multi-session events), start time (defaults to event or
   session start, must fall inside it), expected duration (30–480 min, default from game `time`
   upper bound), seats total, up to 3 tags, a short note (≤ 200 chars, e.g. "Ta med egen kopp").
2. Host can edit (not below current seated count), cancel the table (seated members are notified),
   or remove a seat (reason select: "Feil bord", "Ikke møtt", "Annet").

**Board (admin)**

1. On the admin page's event view, a "Spillbord" tab: all tables with seated names, for the
   welcome desk. Can remove any table or seat (moderation), with a reason logged.
2. Seat counts feed the admin's attendance estimate next to event sign-ups.

## 4. Data model

### 4.1 Supabase migration `supabase/migrations/<ts>_game_tables.sql`

```sql
-- Game tables at club events (docs/plans/ideas/02-game-tables.md).

create type public.table_tag as enum ('beginner', 'teaching', 'quick', 'heavy', 'english');
create type public.table_seat_status as enum ('seated', 'waitlist');

create table public.game_tables (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,                    -- Sanity event _id
  session_key text,                          -- Sanity schedule item _key, null for single-session events
  host_id uuid references auth.users (id) on delete cascade,
  game_id text,                              -- Sanity game _id
  game_title text not null check (char_length(game_title) between 1 and 80),
  starts_at timestamptz not null,
  duration_min int not null check (duration_min between 30 and 480),
  seats_total int not null check (seats_total between 2 and 12),
  tags public.table_tag[] not null default '{}' check (cardinality(tags) <= 3),
  note text not null default '' check (char_length(note) <= 200),
  locks_at timestamptz generated always as (starts_at + interval '1 hour') stored,
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);
create index game_tables_event_idx on public.game_tables (event_id) where cancelled_at is null;

create table public.game_table_seats (
  table_id uuid not null references public.game_tables (id) on delete cascade,
  supabase_id uuid not null references auth.users (id) on delete cascade,
  status public.table_seat_status not null,
  position int not null,                     -- order of arrival; waitlist promotion uses it
  -- snapshot like event_participants, so members never need to read each other's profiles
  name text not null default '',
  photo_url text not null default '',
  created_at timestamptz not null default now(),
  primary key (table_id, supabase_id)
);

create table public.game_table_moderation_log (
  id bigint generated always as identity primary key,
  table_id uuid not null,
  target_supabase_id uuid references auth.users (id) on delete set null,
  actor_supabase_id uuid references auth.users (id) on delete set null,
  action text not null check (action in ('remove_seat', 'cancel_table')),
  reason text not null check (char_length(reason) <= 200),
  created_at timestamptz not null default now()
);

alter table public.game_tables enable row level security;
alter table public.game_table_seats enable row level security;
alter table public.game_table_moderation_log enable row level security;

-- Tables: members read all live tables. (Visitors use the public function below.)
create policy "Members read tables" on public.game_tables
  for select to authenticated using (true);
-- Seats: members read all seats (first name + avatar snapshot only).
create policy "Members read seats" on public.game_table_seats
  for select to authenticated using (true);
create policy "Admins read moderation log" on public.game_table_moderation_log
  for select to authenticated using (public.member_is_admin());

revoke all on public.game_tables, public.game_table_seats, public.game_table_moderation_log from anon;
```

Snapshot `name` holds the first name only (`profiles.name`), not the surname, to keep what other
members see minimal. `photo_url` holds the bucket-relative path, resolved to a signed URL on read
exactly as `src/supabase/queryHelpers/eventParticipants.ts` does.

### 4.2 Functions

All `security definer`, `set search_path = public`, check `auth.uid()` and membership
(`exists (select 1 from members where supabase_id = auth.uid())`), raise stable error codes.

| Function                                                                                                                                                                       | Does                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `game_tables_public(p_event_id text)` returns `table(id, session_key, game_id, game_title, starts_at, duration_min, seats_total, seats_taken, tags)`                           | Granted to `anon`. Counts only, no names.                                                                                                                                                                                                                           |
| `game_table_create(p_event_id, p_session_key, p_game_id, p_game_title, p_starts_at, p_duration_min, p_seats_total, p_tags, p_note, p_event_start, p_event_end)` returns `uuid` | Validates `p_starts_at` within `[p_event_start, p_event_end]` and in the future (`bad_time`); overlap check for the host (`slot_taken`); inserts table with `host_id = auth.uid()`; seats the host at position 1; ensures an `event_participants` row for the host. |
| `game_table_update(p_table_id, ...)`                                                                                                                                           | Host or admin; not after `locks_at` (`locked`); `seats_total` ≥ seated count (`below_seated`).                                                                                                                                                                      |
| `game_table_join(p_table_id)` returns `table_seat_status`                                                                                                                      | Locks the table row `for update`; not cancelled/locked; overlap check (`slot_taken`); seats if `seated < seats_total` else waitlists; snapshots name/photo from caller's `profiles`; ensures `event_participants`.                                                  |
| `game_table_leave(p_table_id)`                                                                                                                                                 | Removes own seat; if the leaver was seated, promotes the lowest-position waitlisted member. Host leaving = cancel (`host_must_cancel` unless admin).                                                                                                                |
| `game_table_remove_seat(p_table_id, p_supabase_id, p_reason)`                                                                                                                  | Host or admin; logs to moderation log; promotes waitlist.                                                                                                                                                                                                           |
| `game_table_cancel(p_table_id, p_reason)`                                                                                                                                      | Host or admin; sets `cancelled_at`; logs; seats stay for notification then are deleted by cron after 7 days.                                                                                                                                                        |

**Event times come from the client** (Sanity is not readable from SQL). The function accepts
them, but the cost of a forged value is small: a member can create a table at a wrong time on a
real event, which is visible to everyone and removable by admins. If the board wants it airtight,
move `game_table_create`/`update` into an edge function that fetches the event from
`https://85tc4tb0.apicdn.sanity.io` by `_id` and derives the bounds; the CDN is already reachable
from edge functions. Recommendation: start with the SQL version, log the decision in the PR.

**Overlap rule (one table per slot):** two tables overlap if
`a.starts_at < b.starts_at + b.duration_min * interval '1 minute'` and vice versa, among tables
the member is seated or waitlisted at that are not cancelled.

**Leaving the event:** extend `supabase/functions/update-event-participants/index.ts` so `leave`
also deletes the caller's seats for that event (and promotes waitlists via `game_table_leave`).
Keep it user-scoped as it is now.

### 4.3 Realtime

Seat counts change quickly on event day. Subscribe to `postgres_changes` on `game_table_seats`
filtered by the visible table ids while the section is mounted (signed-in only; RLS applies to
realtime). The CSP already allows the Supabase websocket origin (`src/security/csp.ts`). For
visitors, re-fetch `game_tables_public` every 60 s while the tab is visible instead.

## 5. Frontend

### 5.1 Files

| File                                                                 | What                                                                                                                                                                                                                                                    |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/supabase/queryHelpers/gameTables.ts`                            | `getPublicTables(eventId)`, `getTables(eventId)` (with seats, signed URLs resolved), `createTable()`, `updateTable()`, `joinTable()`, `leaveTable()`, `removeSeat()`, `cancelTable()`, `subscribeToSeats(tableIds, onChange)` returning an unsubscribe. |
| `src/supabase/queryHelpers/gameTableErrors.ts`                       | Error code → Norwegian: `slot_taken`, `bad_time`, `locked`, `below_seated`, `host_must_cancel`, `not_member`, `forbidden`.                                                                                                                              |
| `src/schemas/gameTable.ts`                                           | zod: title 1–80, duration 30–480, seats 2–12, tags ≤ 3 from enum, note ≤ 200, start within event bounds.                                                                                                                                                |
| `src/components/ui/TableCard.tsx` (+ test)                           | Card: game image (Sanity) or dice placeholder, title, time range, tags as `Chip`s, "x av y plasser ledige", `AvatarStack` of seated (signed in), action `Button`.                                                                                       |
| `src/components/sections/gameTables/GameTablesSection.tsx`           | The list + filters + "Sett opp et bord". Renders on the event page when `event.enableTables` is true (see 5.2).                                                                                                                                         |
| `src/components/sections/gameTables/HostTableDialog.tsx`             | Create/edit form using `Input`, native `<select>`, `Checkbox` tags, `Textarea`.                                                                                                                                                                         |
| `src/components/sections/gameTables/ManageSeatsDialog.tsx`           | Host/admin: list seats, remove with reason.                                                                                                                                                                                                             |
| `src/loaders/event-loader` (whatever the event-pages phase names it) | Load public tables or member tables in parallel, `settle` so failures degrade to "Spillbord er ikke tilgjengelig akkurat nå".                                                                                                                           |
| `src/hooks/useGameTables.ts`                                         | Owns list state, optimistic join/leave with rollback on error, realtime subscription lifecycle.                                                                                                                                                         |

### 5.2 Sanity

`src/sanity/schemaTypes/eventType.ts`, add:

```ts
defineField({
  title: 'Spillbord',
  name: 'enableTables',
  type: 'boolean',
  description:
    'Skru på for å la medlemmer sette opp og melde seg på spillbord på arrangementssiden. Passer for spillkvelder og BGM.',
  initialValue: false,
}),
```

Keep the default `false` so nothing changes on existing events; editors switch it on per event.
Add `enableTables` to the event GROQ projection and type.

### 5.3 Copy

- Section title: "Spillbord" · intro: "Se hva som spilles, og ta en plass før du kommer."
- Empty: "Ingen bord ennå. Sett opp det første!" (`EmptyState` with dice icon).
- Card: "{ledige} av {totalt} plasser ledige" · "Fullt" · "Venteliste: {n}"
- Buttons: "Bli med" · "Forlat bordet" · "Sett meg på venteliste" · "Sett opp et bord" ·
  "Logg inn for å bli med"
- Host dialog labels: "Spill", "Annet spill (skriv navnet)", "Økt", "Starter", "Varighet
  (minutter)", "Antall plasser (inkludert deg)", "Passer for", "Melding til spillerne (valgfritt)".
- Errors as in `gameTableErrors.ts`, e.g. `slot_taken` → "Du har allerede plass på et bord som
  overlapper. Forlat det først."

### 5.4 Accessibility

- Joining announces "Du er med på {spill}" via `role="status"`.
- `AvatarStack` has a text alternative "Kari, Ola og 1 til".
- Tag filter chips use `aria-pressed`; result count is live (`aria-live="polite"`).
- Optimistic UI must not move focus; after a rollback show an error `Alert` and keep focus on the button.

## 6. Notifications (PWA phase)

| Trigger                         | To                                                    |
| ------------------------------- | ----------------------------------------------------- |
| Someone joins your table        | Host (batched: max one push per 15 min per table)     |
| Promoted from waitlist          | That member (always, immediately)                     |
| Table cancelled or seat removed | Affected members                                      |
| 2 hours before start            | Everyone seated ("{spill} starter kl. {tid}, {sted}") |

Add a `game_table_events` outbox table written by the functions, consumed by the PWA phase's
sender. Before PWA lands, nothing is sent; members see the state on the page.

## 7. Data and GDPR

| Data                                       | Where                       | Retention                                                                                                                    |
| ------------------------------------------ | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Tables hosted                              | `game_tables`               | Cascade-deleted with the host's account. Kept after the event for the play log (plan 3) for 24 months, then deleted by cron. |
| Seats (incl. first-name + avatar snapshot) | `game_table_seats`          | Cascade with the account; deleted with the table.                                                                            |
| Moderation log                             | `game_table_moderation_log` | 12 months; ids `set null` on account deletion.                                                                               |

- Export: own hosted tables and own seats (event title, game, time, status).
- Delete: cascades; no blocking conditions.
- Other members see only first name and avatar. State this in the privacy policy section the
  GDPR phase writes ("Når du tar plass ved et spillbord ser andre medlemmer fornavnet ditt og
  profilbildet ditt.").
- A member can hide their avatar from tables via the existing profile (no photo → initials).

## 8. Security checklist

- [ ] Visitors get counts only (`game_tables_public`); direct table selects are revoked for `anon`.
- [ ] No member can seat someone else (no member id parameter on join).
- [ ] Capacity race: 10 parallel `game_table_join` calls on a 4-seat table → exactly 3 seated
      (host is 1) and 6 waitlisted. pgTAP test with `dblink` or a loop of transactions; at
      minimum a test that `for update` is taken.
- [ ] Host/admin checks in every mutating function; moderation is logged.
- [ ] `game_title`, `note`, `reason` length-limited both sides and rendered as text.
- [ ] Realtime: confirm RLS applies (Supabase realtime respects select policies for
      `postgres_changes`); visitors do not subscribe.
- [ ] Rate limit: max 5 tables created per member per event (check in `game_table_create`,
      `too_many_tables`) to stop spam.

## 9. Tests

**SQL:** create/join/leave/waitlist promotion order; overlap rejection; lock after `locks_at`;
anon cannot select tables; host cannot lower seats below seated; admin can remove any seat and it
is logged; leaving the event removes seats.

**Unit:** `TableCard` states (free, full, waitlisted, seated, locked, signed out); `HostTableDialog`
validation; `useGameTables` optimistic join rolls back on error; error code mapping.

**E2E (stubbed):** visitor sees counts and no names; member joins and sees avatar; full table
offers waitlist; host creates a table and it appears in the list.

## 10. Slices

1. **Schema + functions + SQL tests + query helpers** (no UI). `enableTables` Sanity field.
2. **Read-only section** on the event page: public counts for visitors, names for members.
3. **Join / leave / waitlist** with optimistic UI and realtime.
4. **Host flow:** create, edit, cancel, manage seats.
5. **Admin view + moderation log.**
6. **Event sign-up coupling** (edge function change) and **GDPR hooks**.
7. **Notifications** once the PWA phase is live.

## 11. Later

- "Spill jeg vil lære" — members mark games they want to learn; hosts see "3 members want to
  learn this" when picking a game.
- Print view for the welcome desk (A4 list of tables and names).
- Hand the finished table to the play log with one tap ("Logg partiet") — see plan 3.
