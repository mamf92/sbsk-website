# Plan: Spillbiblioteket — game library lending

Status: proposed · Owner: unassigned · Read [README.md](./README.md) first for the shared rules.

## 1. Goal

Members can see which of the club's games are on the shelf, reserve one online, pick it up at
the next game night and return it at a later one. The board checks games out and in from the
admin page and can see what is overdue. Today this is done by memory and messages, if at all.

### Success looks like

- A member reserves _Brass: Birmingham_ on Tuesday, picks it up Thursday, and the board marks it
  out in under 10 seconds from a phone.
- `/våre-spill` shows "Ledig" / "Utlånt" on every game in the library, also to visitors.
- The board sees a list of overdue loans with who has them, and the member is reminded.
- No member can see who else has borrowed what. No member can check a game out to themselves.

### Out of scope

- Lending to non-members, deposits or fees (can come with Vipps later; see section 11).
- Barcode or QR scanning (search is fast enough for a collection this size; see 11).
- Games owned by individual members (only the club's copies).

## 2. Decisions made

| Decision                           | Choice                                                                                                                                                                                    | Why                                                                                                              |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Where the catalogue lives          | Stays in Sanity (`game` type). Add one boolean field `inLibrary`.                                                                                                                         | Editors already maintain titles, images and descriptions there. Duplicating them in Supabase would drift.        |
| Where copies and loans live        | Supabase: `library_copies`, `library_loans`.                                                                                                                                              | Operational, changes nightly, ties to members. Must not be public.                                               |
| One game, many copies              | Yes, `library_copies` row per physical box.                                                                                                                                               | The club may own two copies of a popular game; condition is per box.                                             |
| How a loan starts                  | Member reserves online and picks a pickup event (a game night in the next 14 days). The board confirms the handover. The board can also check out directly with no reservation (walk-up). | Keeps the board in control of the physical box but removes the "is it free?" back-and-forth.                     |
| Loan length                        | 14 days from pickup, due at the end of the due day (Oslo time). One self-service extension of 14 days if nobody is waiting.                                                               | Two game nights is a natural cycle.                                                                              |
| Limits                             | Max 2 active loans (reserved or out) per member.                                                                                                                                          | Keeps the shelf stocked. A single setting, easy to change.                                                       |
| Reservation expiry                 | A reservation not picked up by the end of the pickup event's day expires automatically.                                                                                                   | Stops a game being blocked by a no-show.                                                                         |
| Queue                              | No waitlist in v1. "Varsle meg når ledig" (notify me) instead, once PWA notifications exist.                                                                                              | A queue adds fairness rules nobody asked for yet.                                                                |
| Writes                             | Only through `security definer` SQL functions (RPC). No insert/update policies for members.                                                                                               | Double-booking and limit checks must happen in one transaction with row locks. RLS alone cannot express "max 2". |
| Public availability                | A `security definer` function returns counts only, callable by `anon`.                                                                                                                    | Visitors see what the club has without any personal data.                                                        |
| Deleted member with an active loan | GDPR deletion is blocked until the game is returned (or the board marks it lost). Finished loans are anonymised.                                                                          | The club needs to know where its property is; history is useful for stats without a name.                        |

## 3. User stories and flows

**Visitor**

1. Opens `/våre-spill`. Library games show a chip: "Ledig", "1 av 2 ledig" or "Utlånt". A filter
   chip "Kan lånes" shows only library games. Clicking "Lån" asks them to log in or become a member.

**Member**

1. On a game card, presses "Lån spillet". A `Dialog` opens: choose the game night to pick it up at
   (select of upcoming `spillkveld` events in the next 14 days), read the rules (2 loans max,
   14 days), confirm.
2. Sees the reservation in the member portal under "Mine lån" with status "Reservert — hentes
   torsdag 13. nov.". Can cancel.
3. After pickup the status becomes "Utlånt — leveres innen 27. nov.". Can press "Forleng" once
   if nobody has asked to be notified.
4. Gets reminders 2 days before due and the day after due (portal banner always; push once the
   PWA phase lands; email via the contact-form mail provider if that phase chose one).

**Board member (admin)**

1. Opens the admin page tab "Bibliotek". Default view: "I kveld" — reservations for tonight's
   event, each with member name, game and copy, and a "Lever ut" button.
2. Walk-up: "Nytt utlån" → search member (reuse `useMemberSearch`) → search game → pick copy →
   confirm.
3. Return: "Utlånt" list sorted by due date, search by member or game, "Mottatt" → condition
   select (OK / mangler deler / skadet) + optional note → done.
4. "Inventar": list of copies per game, add a copy, edit label/condition/notes, retire a copy
   (soft delete; history stays).
5. "Forfalt": overdue list with days overdue; "Marker som tapt" closes the loan and retires the copy.

## 4. Data model

### 4.1 Sanity

`src/sanity/schemaTypes/gameType.ts`, add after `videoUrl`:

```ts
defineField({
  title: 'Kan lånes fra klubbens bibliotek',
  name: 'inLibrary',
  type: 'boolean',
  description:
    'Skru på hvis klubben eier spillet og medlemmer kan låne det. Eksemplarer og utlån styres fra styreportalen, ikke her.',
  initialValue: false,
}),
```

Update `src/sanity/queryHelpers/games.ts`: add `inLibrary` to `GameTypes` (`inLibrary?: boolean`)
and to the GROQ projection. Follow the `sbsk-sanity-schema` skill.

### 4.2 Supabase migration `supabase/migrations/<ts>_game_library.sql`

```sql
-- Game library lending (docs/plans/ideas/01-game-library.md).

create type public.library_copy_condition as enum ('ok', 'missing_parts', 'damaged');
create type public.library_loan_status as enum ('reserved', 'out', 'returned', 'cancelled', 'expired', 'lost');

create table public.library_copies (
  id uuid primary key default gen_random_uuid(),
  game_id text not null,                         -- Sanity game _id
  label text not null default 'Eksemplar 1' check (char_length(label) between 1 and 40),
  condition public.library_copy_condition not null default 'ok',
  notes text not null default '' check (char_length(notes) <= 500),
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  unique (game_id, label)
);
create index library_copies_game_id_idx on public.library_copies (game_id) where retired_at is null;

create table public.library_loans (
  id uuid primary key default gen_random_uuid(),
  copy_id uuid not null references public.library_copies (id),
  -- null after the member is deleted (GDPR): history stays, the person does not.
  supabase_id uuid references auth.users (id) on delete set null,
  status public.library_loan_status not null,
  pickup_event_id text,                          -- Sanity event _id, null for walk-ups
  reserved_at timestamptz,
  pickup_deadline timestamptz,                   -- end of the pickup event's day, Oslo time
  checked_out_at timestamptz,
  checked_out_by uuid references auth.users (id) on delete set null,
  due_at timestamptz,
  extended boolean not null default false,
  returned_at timestamptz,
  returned_by uuid references auth.users (id) on delete set null,
  return_condition public.library_copy_condition,
  return_note text not null default '' check (char_length(return_note) <= 500),
  created_at timestamptz not null default now(),
  check (status <> 'out' or (checked_out_at is not null and due_at is not null))
);

-- The core invariant: a copy has at most one live loan.
create unique index library_loans_one_live_per_copy
  on public.library_loans (copy_id) where status in ('reserved', 'out');
create index library_loans_member_idx on public.library_loans (supabase_id) where status in ('reserved', 'out');
create index library_loans_due_idx on public.library_loans (due_at) where status = 'out';

create table public.library_watchers (             -- "varsle meg når ledig"
  game_id text not null,
  supabase_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (game_id, supabase_id)
);

alter table public.library_copies enable row level security;
alter table public.library_loans enable row level security;
alter table public.library_watchers enable row level security;

-- Copies: admins only (members see availability through the function below).
create policy "Admins manage copies" on public.library_copies
  for all to authenticated using (public.member_is_admin()) with check (public.member_is_admin());

-- Loans: members read their own, admins read all. No write policies: writes go through functions.
create policy "Members read own loans, admins read all" on public.library_loans
  for select to authenticated using (supabase_id = auth.uid() or public.member_is_admin());

-- Watchers: members manage their own rows.
create policy "Members manage own watches" on public.library_watchers
  for all to authenticated using (supabase_id = auth.uid()) with check (supabase_id = auth.uid());

revoke all on public.library_copies, public.library_loans, public.library_watchers from anon;
```

Settings live as SQL constants inside the functions (`max_active := 2`, `loan_days := 14`) for v1.
If the board wants to change them from the UI later, move them to a one-row `library_settings` table.

### 4.3 Functions (same migration)

All are `language plpgsql security definer set search_path = public`, start with
`if auth.uid() is null then raise exception 'not_authenticated'; end if;`, and raise
**stable error codes** (as the exception message) that the client maps to Norwegian text.

| Function                                                                                                | Who                     | Does                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `library_availability()` returns `table(game_id text, copies_total int, copies_available int)`          | `anon`, `authenticated` | Counts non-retired copies and those without a live loan. Returns no personal data.                                                                                                                                                                                                                                                                                                |
| `library_reserve(p_game_id text, p_pickup_event_id text, p_pickup_deadline timestamptz)` returns `uuid` | member                  | Checks caller is in `members`; counts caller's live loans (`>= 2` → `limit_reached`); rejects if caller already has a live loan for that game (`already_borrowing`); picks a free copy with `select ... for update skip locked` (none → `none_available`); validates `p_pickup_deadline` is in the future and within 15 days (`bad_pickup`); inserts `reserved`. Returns loan id. |
| `library_cancel(p_loan_id uuid)`                                                                        | owner                   | Only own `reserved` loan → `cancelled`.                                                                                                                                                                                                                                                                                                                                           |
| `library_extend(p_loan_id uuid)`                                                                        | owner                   | Only own `out` loan, `extended = false`, no watchers for the game, not overdue → `due_at += 14 days`, `extended = true`. Else `cannot_extend`.                                                                                                                                                                                                                                    |
| `library_check_out(p_loan_id uuid)`                                                                     | admin                   | `reserved` → `out`, sets `checked_out_at = now()`, `checked_out_by = auth.uid()`, `due_at` = end of day (Oslo) 14 days ahead.                                                                                                                                                                                                                                                     |
| `library_walk_up(p_copy_id uuid, p_member_supabase_id uuid)` returns `uuid`                             | admin                   | Creates an `out` loan directly. Enforces the same per-member limit (admin can override with `p_force boolean default false`).                                                                                                                                                                                                                                                     |
| `library_check_in(p_loan_id uuid, p_condition library_copy_condition, p_note text)`                     | admin                   | `out` → `returned`, sets return fields, copies `p_condition` onto the copy. Fires the "available" notification for watchers (see 6).                                                                                                                                                                                                                                              |
| `library_mark_lost(p_loan_id uuid)`                                                                     | admin                   | `out` → `lost`, sets copy `retired_at = now()`.                                                                                                                                                                                                                                                                                                                                   |
| `library_expire_reservations()`                                                                         | cron only               | `reserved` with `pickup_deadline < now()` → `expired`.                                                                                                                                                                                                                                                                                                                            |

Why the pickup deadline comes from the client: the event's date lives in Sanity, which the
database cannot read. The function bounds it (future, ≤ 15 days) so a forged value can at most
hold a game for 15 days, which the board can see and cancel. If that is not acceptable, move
`library_reserve` into an edge function that fetches the event from Sanity's CDN by id and
derives the deadline itself; note that in the PR.

Admin check inside admin functions: `if not public.member_is_admin() then raise exception 'forbidden'; end if;`.

Grants:

```sql
revoke execute on all functions in schema public from public; -- only if the security plan has not already set default privileges; otherwise revoke per function
grant execute on function public.library_availability() to anon, authenticated;
grant execute on function public.library_reserve(text, text, timestamptz),
  public.library_cancel(uuid), public.library_extend(uuid) to authenticated;
grant execute on function public.library_check_out(uuid), public.library_walk_up(uuid, uuid, boolean),
  public.library_check_in(uuid, public.library_copy_condition, text), public.library_mark_lost(uuid)
  to authenticated; -- each checks member_is_admin() itself
revoke execute on function public.library_expire_reservations() from public, anon, authenticated;
```

Do **not** use the blanket `revoke ... on all functions` line if it would strip
`member_is_admin()`'s grant; revoke per function instead.

### 4.4 Scheduled job

Enable `pg_cron` (Supabase dashboard → Database → Extensions; needs Martin's OK if it is not on)
and schedule hourly:

```sql
select cron.schedule('library-expire-reservations', '5 * * * *', $$select public.library_expire_reservations()$$);
```

Overdue state is computed at read time (`status = 'out' and due_at < now()`), so it needs no job.
Reminder sending is a second job, added in slice 5.

## 5. Frontend

### 5.1 Files

| File                                                      | What                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/supabase/queryHelpers/library.ts`                    | Typed helpers: `getLibraryAvailability()`, `getMyLoans()`, `reserveGame()`, `cancelLoan()`, `extendLoan()`, admin: `getLibraryCopies()`, `getLiveLoans()`, `checkOut()`, `walkUp()`, `checkIn()`, `markLost()`, `upsertCopy()`, `retireCopy()`, `watchGame()`, `unwatchGame()`. Each calls `supabase.rpc(...)` or `.from(...)` and throws on error. |
| `src/supabase/queryHelpers/libraryErrors.ts`              | Maps error codes (`limit_reached`, `none_available`, `already_borrowing`, `bad_pickup`, `cannot_extend`, `forbidden`, `not_authenticated`) to Norwegian messages; unknown → "Noe gikk galt. Prøv igjen, eller si ifra til styret."                                                                                                                  |
| `src/schemas/library.ts`                                  | `zod` schemas: copy form (`label` 1–40, `notes` ≤ 500), check-in form (`condition` enum, `note` ≤ 500).                                                                                                                                                                                                                                             |
| `src/components/ui/AvailabilityChip.tsx` (+ test)         | Wraps `Chip`: "Ledig", "1 av 2 ledig", "Utlånt". Tinted success / neutral tone per redesign step 4.                                                                                                                                                                                                                                                 |
| `src/components/sections/OurGamesSection.tsx`             | Fetches availability in the loader (see below), passes to `GameCard`. Adds filter chip "Kan lånes".                                                                                                                                                                                                                                                 |
| `src/components/ui/GameCard.tsx`                          | Optional `availability` and `onBorrow` props. Shows `AvailabilityChip` and a secondary `Button` "Lån spillet" when `inLibrary`.                                                                                                                                                                                                                     |
| `src/components/sections/library/BorrowDialog.tsx`        | `Dialog` with pickup-event `<select>`, rules text, confirm. Pending state on the button (`aria-busy`).                                                                                                                                                                                                                                              |
| `src/components/sections/MemberPortalSection/MyLoans.tsx` | "Mine lån" list with status lines, cancel/extend buttons, overdue `Alert`.                                                                                                                                                                                                                                                                          |
| `src/components/sections/BoardPortalSection/library/*`    | `LibraryTonight.tsx`, `LibraryLoans.tsx`, `LibraryInventory.tsx`, `WalkUpDialog.tsx`, `CheckInDialog.tsx`. Placed wherever the admin phase puts admin tabs; if it has not landed, under the current `BoardPortalSection`.                                                                                                                           |
| `src/loaders/our-games-loader.ts`                         | Add `getLibraryAvailability()` in parallel with Sanity, using the existing `settle.ts` pattern so a Supabase failure (or a paused project) still renders the games without chips.                                                                                                                                                                   |

### 5.2 Pickup events

The borrow dialog needs upcoming game nights. Reuse the events query helper in
`src/sanity/queryHelpers/events.ts`: filter `category == "spillkveld" && eventStartTime > now()
&& eventStartTime < now() + 14 days`. The deadline sent to `library_reserve` is the end of that
event's day in Oslo: compute with a small `endOfOsloDay(date)` util in `src/utils/time.ts`
(unit-tested across the DST change in late March and late October). If no game night is in the
next 14 days, the dialog says "Ingen spillkvelder de neste to ukene — ta kontakt med styret" and
offers no confirm.

### 5.3 Copy (Norwegian)

- Chip: "Ledig" · "{n} av {m} ledig" · "Utlånt"
- Button: "Lån spillet" · signed out: "Logg inn for å låne"
- Dialog title: "Lån {tittel}" · body: "Hent spillet på spillkvelden du velger. Du kan låne det i
  14 dager, og ha to spill ute samtidig." · confirm: "Reserver" · success: "Reservert! Hent det
  {dato}."
- Errors: `limit_reached` → "Du har allerede to spill ute eller reservert. Lever ett tilbake
  først."; `none_available` → "Noen kom deg i forkjøpet — spillet er ikke ledig lenger.";
  `already_borrowing` → "Du har allerede dette spillet."
- Portal: "Reservert — hentes {dato}" · "Utlånt — leveres innen {dato}" · "Forfalt for {n} dager
  siden" · buttons "Avbryt reservasjon", "Forleng 14 dager", "Varsle meg når ledig".

Run copy past the `design:ux-copy` skill before merging.

### 5.4 Accessibility

- The availability chip is text, not colour alone.
- Dialogs use the existing `Dialog` (focus trap and return already tested).
- Admin lists are real tables with `<th scope="col">` on desktop and stacked cards on mobile;
  action buttons name the row ("Lever ut Brass til Kari").
- After a successful action, a `role="status"` `Alert` announces it.

## 6. Notifications

| Trigger                                        | To       | Channel                                                               |
| ---------------------------------------------- | -------- | --------------------------------------------------------------------- |
| Reservation made                               | Member   | In-page success; portal list                                          |
| Due in 2 days, overdue +1 day, overdue +7 days | Member   | Portal banner always; push when PWA phase is live                     |
| Game watched becomes available                 | Watchers | Push (PWA phase); otherwise a dot on "Mine lån"                       |
| Reservation for tonight                        | Admins   | Shown in "I kveld" tab; push digest at 16:00 on event day (PWA phase) |

Implementation: a `library_notifications_due()` SQL function returns the rows to notify, and a
cron-invoked edge function (built by the PWA phase's notification sender) sends them. Record
sends in a `library_notifications_sent(loan_id, kind, sent_at)` table so nothing is sent twice.
Until the PWA phase lands, ship the portal banner only.

## 7. Data and GDPR

| Data                            | Where              | Lawful basis                                 | Retention                                                   |
| ------------------------------- | ------------------ | -------------------------------------------- | ----------------------------------------------------------- |
| Live loans (who has which copy) | `library_loans`    | Contract (membership benefit)                | While live                                                  |
| Finished loans                  | `library_loans`    | Legitimate interest (collection care, stats) | 24 months, then `supabase_id` set to null by a monthly cron |
| Watches                         | `library_watchers` | Consent (member opts in)                     | Until removed or member deleted                             |

- **Export:** the GDPR export function adds `library_loans` (own rows: game title from Sanity,
  dates, status) and `library_watchers`.
- **Delete:** the GDPR delete flow first checks for `status in ('reserved','out')`. Reserved →
  cancel automatically. Out → block with "Du har {spill} utlånt. Lever det tilbake før du sletter
  kontoen." Then `on delete set null` anonymises history and `on delete cascade` removes watches.
- **Privacy policy:** add a paragraph to the privacy page the GDPR phase writes: "Når du låner et
  spill lagrer vi hvilket spill, når du hentet og leverte det. Etter 24 måneder fjerner vi navnet
  ditt fra historikken."
- Members never see each other's loans; admins see names because they hand out the boxes.

## 8. Security checklist

- [ ] RLS enabled on all three tables; `anon` revoked.
- [ ] No insert/update/delete policy on `library_loans` for non-admins.
- [ ] Every `security definer` function sets `search_path` and checks `auth.uid()` / `member_is_admin()`.
- [ ] `library_reserve` cannot be used to reserve for someone else (no member id parameter).
- [ ] Concurrency: two members reserving the last copy at once → one gets `none_available`
      (unique partial index + `skip locked`). Covered by a pgTAP test.
- [ ] Free text (`label`, `notes`, `return_note`) length-checked in zod and SQL, rendered as text.
- [ ] Supabase advisors (`get_advisors` security) clean after the migration.
- [ ] No new CSP hosts.

## 9. Tests

**SQL (pgTAP, `supabase/tests/library.test.sql`)**

- anon can call `library_availability()` and gets counts only; anon cannot select any table.
- member A cannot select member B's loans; admin can.
- reserve: limit 2 enforced; `already_borrowing`; `none_available` when all copies live;
  `bad_pickup` for past or > 15 days.
- non-admin calling `library_check_out` → `forbidden`.
- check-in sets copy condition; retired copies are not counted.
- `library_expire_reservations()` expires only past-deadline reservations.

**Unit (Vitest)**

- `libraryErrors` maps each code and the fallback.
- `endOfOsloDay` across both DST changes.
- `AvailabilityChip` text for 0/1/many copies.
- `BorrowDialog`: no events → no confirm; error code shows the right `Alert`; success closes.
- `MyLoans`: extend hidden when `extended`; overdue `Alert` shown.
- `our-games-loader`: availability failure still returns games.

**E2E (Playwright, stubbed Supabase)**

- Visitor sees chips and "Logg inn for å låne".
- Member reserves → appears in `/medlemsportal` "Mine lån".
- Admin "I kveld" → "Lever ut" → loan moves to "Utlånt".

## 10. Slices (one PR each)

1. **Catalogue flag.** Sanity `inLibrary` field + query + type. Editors can start tagging. No UI.
2. **Schema and RPC.** Migration, functions, pgTAP tests, `library.ts` helpers with mocked unit
   tests. Apply the migration with Supabase MCP `apply_migration` after the PR is green.
3. **Public availability.** `AvailabilityChip`, loader change, `GameCard` props, "Kan lånes"
   filter. Ships publicly (no session needed).
4. **Admin desk.** Inventory, walk-up, tonight, check-in, overdue, mark lost. Needs the admin page
   (or the current board portal). The board can run the library from here even before step 5.
5. **Member self-service.** Borrow dialog, "Mine lån", cancel, extend, watch. Behind the portal flag.
6. **Reminders and expiry.** `pg_cron` jobs, portal banner, then push once the PWA phase is live.
7. **GDPR hooks.** Export/delete extensions and privacy-policy text (do it in slice 2 if the GDPR
   phase has already landed).

## 11. Later (not v1)

- **Innkjøpsønsker (what should the club buy).** Members suggest a game (title + BoardGameGeek
  link, only `https://boardgamegeek.com/...` accepted) and upvote; the board marks "Kjøpt" and
  the suggestion links to the new `game` document. Tables `library_wishes`, `library_wish_votes`
  (one vote per member per wish, RLS: read all authenticated, write own). Gives the sponsor
  relationship a concrete list to work from.
- QR sticker per copy that opens the admin check-in screen for that copy.
- Deposit for expensive games via Vipps (Vipps phase).
- Waitlist with automatic reservation for the next in line.
