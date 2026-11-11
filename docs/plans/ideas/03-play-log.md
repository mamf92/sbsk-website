# Plan: Spilloggen — play log and club stats

Status: proposed · Owner: unassigned · Read [README.md](./README.md) first for the shared rules.

## 1. Goal

Members log the games they play at club events: which game, who played, and (optionally) who
won and the scores. From that the site shows each member their own history and stats, shows
the club what gets played most, and gives competitive members an opt-in ladder per game. It is
also the data source the badges feature needs ("played 25 different games", "taught 10 tables").

### Success looks like

- After a game, one player logs it in under 30 seconds from their phone, and the other players
  just confirm.
- The member page shows "Dine mest spilte", games played this year, and favourite opponents.
- `/våre-spill` and the home page can show "Mest spilt i klubben i høst" without exposing anyone.
- Members who opt in see a per-game ladder; everyone else is never ranked.

### Out of scope

- Logging games played at home or outside club events (keeps it a club record; easy to add later).
- Full tournament management (brackets, Swiss pairings) — BGM's programme handles that; this plan
  can import results later.
- Importing from BoardGameGeek or BG Stats (see 11).

## 2. Decisions made

| Decision                 | Choice                                                                                                                                                                                                                                                                          | Why                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| What a "play" is         | One game session at one club event: game, start time, duration, players, outcome.                                                                                                                                                                                               | Matches what members remember and what stats need.                                         |
| Who logs                 | Any member who was in the play. They add the other players from the event's sign-up list (or the table they sat at). Guests (non-members) can be added as a count only, with no name.                                                                                           | Keeps personal data to members who have accounts and can consent.                          |
| Confirmation             | Other players get "Bekreft" / "Jeg var ikke med". A play counts in stats when at least half its member players have confirmed, or 48 hours pass with no dispute. A "Jeg var ikke med" removes that player.                                                                      | Prevents logging people into games they did not play, without making logging a chore.      |
| Outcome                  | Optional. Types: `winner` (one or more winners), `scores` (number per player), `coop` (team won or lost), `none`.                                                                                                                                                               | Many club games are casual; forcing a winner would stop people logging.                    |
| Visibility               | Own history: private to the member. Other members can see plays they were in. Club-wide stats: aggregated only, game-level, minimum 3 distinct players behind any number shown. Ladders: opt-in only.                                                                           | Who played with whom is personal data; aggregates are not.                                 |
| Ladder                   | Opt-in per member ("Vis meg på rangeringer"). Elo per game for 2-player and multiplayer-with-winner games, K = 32, start 1000, multiplayer treated as pairwise wins/losses against each other player with K divided by (n − 1). Shown only for games with ≥ 5 opted-in players. | Simple, well understood, fair enough for a club. Opt-in avoids pressure on casual players. |
| Where stats are computed | SQL views/functions over confirmed plays; Elo computed by a trigger when a play becomes confirmed, stored in `play_ratings`.                                                                                                                                                    | Members' devices should not compute from raw rows they may not read.                       |
| Tie to tables            | If the tables feature (plan 2) is live, a locked table offers "Logg partiet" pre-filled with game and seated members.                                                                                                                                                           | One tap from the natural moment. Not a dependency.                                         |
| Tie to check-in          | When check-in exists, the player picker suggests members checked in at the event first.                                                                                                                                                                                         | Better suggestions; not a dependency.                                                      |

## 3. User stories and flows

**Member — log a play**

1. From the event page (during or up to 7 days after an event) or the member page, "Logg et
   parti" opens a `Dialog`, three short steps on mobile:
   1. Game: search the catalogue (Sanity `game`), or "Annet spill" free text (≤ 80 chars).
   2. Players: themselves pre-selected; add members from the event's participant list
      (`event_participants`, already readable by members) with avatar + name; "+ gjester" stepper
      for non-members (0–10).
   3. Result (optional): "Hvem vant?" (multi-select), or "Poeng" (number per member), or
      "Samarbeidsspill: vant / tapte", or "Ingen resultat". Duration (optional minutes).
2. Save → `Alert` "Partiet er logget. De andre får beskjed om å bekrefte."

**Member — confirm**

1. Member page shows "Bekreft partier (2)". Each item: game, event, who logged it, players,
   result. Buttons "Bekreft" and "Jeg var ikke med".

**Member — stats ("Min statistikk" on the member page)**

- Totals: plays this year, distinct games, events with a logged play.
- "Dine mest spilte" (top 5 games with counts).
- "Spiller ofte med" (top 3 co-players; only members, only from plays both confirmed).
- Win rate per game where outcome is recorded (only shown with ≥ 3 plays of that game).
- Ladder positions for games where the member opted in.

**Visitor / everyone — club stats**

- `/våre-spill` game card: "Spilt 14 ganger i klubben" (only with ≥ 3 distinct players behind it).
- New section on `/våre-spill` or a page `/statistikk`: "Mest spilt siste 90 dager", "Nye i
  klubben" (games first logged this season), "Lengste parti". All game-level, no names.

**Opted-in member — ladder**

- `/statistikk/rangering/:gameId` (member-only): table of opted-in players, rating, plays,
  last played. Own row highlighted.

**Admin**

- Can edit or delete any play (moderation) and see disputes. Deleting a play recomputes ratings
  for that game (function below).
- Admin statistics (admin phase) can use the aggregates: plays per event, distinct players per event.

## 4. Data model

### 4.1 Supabase migration `supabase/migrations/<ts>_play_log.sql`

```sql
-- Play log and club stats (docs/plans/ideas/03-play-log.md).

create type public.play_outcome as enum ('winner', 'scores', 'coop', 'none');
create type public.play_player_status as enum ('pending', 'confirmed');

create table public.plays (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,                      -- Sanity event _id
  table_id uuid references public.game_tables (id) on delete set null, -- only if plan 2 exists; drop the FK otherwise
  game_id text,                                -- Sanity game _id
  game_title text not null check (char_length(game_title) between 1 and 80),
  played_at timestamptz not null,
  duration_min int check (duration_min between 5 and 720),
  outcome public.play_outcome not null default 'none',
  coop_won boolean,                            -- only for outcome = 'coop'
  guest_count int not null default 0 check (guest_count between 0 and 10),
  logged_by uuid references auth.users (id) on delete set null,
  counts_from timestamptz,                     -- set when the play becomes confirmed
  created_at timestamptz not null default now(),
  check ((outcome = 'coop') = (coop_won is not null))
);
create index plays_game_idx on public.plays (game_id) where counts_from is not null;
create index plays_event_idx on public.plays (event_id);

create table public.play_players (
  play_id uuid not null references public.plays (id) on delete cascade,
  supabase_id uuid not null references auth.users (id) on delete cascade,
  status public.play_player_status not null default 'pending',
  is_winner boolean not null default false,
  score numeric(8, 2),
  primary key (play_id, supabase_id)
);
create index play_players_member_idx on public.play_players (supabase_id);

create table public.play_ratings (
  game_id text not null,
  supabase_id uuid not null references auth.users (id) on delete cascade,
  rating numeric(7, 2) not null default 1000,
  plays int not null default 0,
  last_played_at timestamptz,
  primary key (game_id, supabase_id)
);

-- Opt-in flag for ladders lives on profiles (the member already owns that row).
alter table public.profiles add column show_on_ladders boolean not null default false;

alter table public.plays enable row level security;
alter table public.play_players enable row level security;
alter table public.play_ratings enable row level security;

-- A member can read a play only if they are one of its players (or an admin).
create or replace function public.is_play_member(p_play_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from play_players where play_id = p_play_id and supabase_id = auth.uid());
$$;
revoke execute on function public.is_play_member(uuid) from public, anon;
grant execute on function public.is_play_member(uuid) to authenticated;

create policy "Players and admins read plays" on public.plays
  for select to authenticated using (public.is_play_member(id) or public.member_is_admin());
create policy "Players and admins read play players" on public.play_players
  for select to authenticated using (public.is_play_member(play_id) or public.member_is_admin());
-- Ratings: own row always; others only if both caller and target opted in (enforced in the ladder function).
create policy "Members read own ratings" on public.play_ratings
  for select to authenticated using (supabase_id = auth.uid() or public.member_is_admin());

revoke all on public.plays, public.play_players, public.play_ratings from anon;
```

`is_play_member` is `security definer` so the policy on `play_players` does not recurse into itself.

### 4.2 Functions

All `security definer`, `set search_path = public`, check `auth.uid()` and membership, raise stable codes.

| Function                                                                                                                                                                         | Who                     | Does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `play_log(p_event_id, p_game_id, p_game_title, p_played_at, p_duration_min, p_outcome, p_coop_won, p_guest_count, p_players jsonb, p_table_id uuid default null)` returns `uuid` | member                  | `p_players` = `[{ "supabase_id": uuid, "is_winner": bool, "score": number? }]`, 1–12 entries, must include the caller (`caller_not_in_play`). Every listed member must have an `event_participants` row for `p_event_id` (`player_not_at_event`) — this stops logging arbitrary members. `p_played_at` within the last 7 days and not in the future (`bad_time`). Inserts play and players; caller's row `confirmed`, others `pending`. Max 20 plays per member per event (`too_many_plays`). |
| `play_confirm(p_play_id)`                                                                                                                                                        | player                  | Own row → `confirmed`. If ≥ half the member players are confirmed, runs `update plays set counts_from = now() where id = p_play_id and counts_from is null returning id`; only when that update returns a row (the one transaction that made the transition) does it call `play_apply_ratings`. Later confirmations, retries and confirmations after auto-confirm change nothing.                                                                                                             |
| `play_dispute(p_play_id)`                                                                                                                                                        | player                  | Deletes own `play_players` row. If no members remain, deletes the play. If the play already counted, recomputes ratings for the game.                                                                                                                                                                                                                                                                                                                                                         |
| `play_auto_confirm()`                                                                                                                                                            | cron                    | Plays older than 48 h with no `counts_from` → same guarded `update ... where counts_from is null returning id`, applying ratings only for the rows it returned. Hourly.                                                                                                                                                                                                                                                                                                                       |
| `play_apply_ratings(p_play_id)`                                                                                                                                                  | internal                | Elo update for `winner` and `scores` outcomes with ≥ 2 member players. Ties in score = draw (0.5). Not granted to anyone.                                                                                                                                                                                                                                                                                                                                                                     |
| `play_recompute_ratings(p_game_id)`                                                                                                                                              | admin / internal        | Rebuilds `play_ratings` for one game from all counted plays in `played_at` order. Used after edits, deletes and disputes.                                                                                                                                                                                                                                                                                                                                                                     |
| `play_admin_delete(p_play_id)`                                                                                                                                                   | admin                   | Deletes and recomputes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `club_game_stats(p_since timestamptz)` returns `table(game_id, game_title, plays int, distinct_players int, last_played_at)`                                                     | `anon`, `authenticated` | Counted plays only. `having count(distinct supabase_id) >= 3`. Game-level only.                                                                                                                                                                                                                                                                                                                                                                                                               |
| `club_highlights(p_since timestamptz)` returns `jsonb`                                                                                                                           | `anon`, `authenticated` | Most played, new this season, longest play (game + duration, no names). Same ≥ 3 threshold.                                                                                                                                                                                                                                                                                                                                                                                                   |
| `my_play_stats(p_year int)` returns `jsonb`                                                                                                                                      | member                  | Totals, top games, top co-players (only members who also confirmed), win rates (≥ 3 plays).                                                                                                                                                                                                                                                                                                                                                                                                   |
| `game_ladder(p_game_id text)` returns `table(rank int, supabase_id uuid, name text, photo_path text, rating numeric, plays int, last_played_at timestamptz)`                     | member who opted in     | Returns rows only if the caller has `show_on_ladders` (`not_opted_in`), and only opted-in members with ≥ 3 plays of the game; empty unless ≥ 5 such members. First name only.                                                                                                                                                                                                                                                                                                                 |

### 4.3 Elo (in `play_apply_ratings`)

For each pair (i, j) of member players in the play (guests ignored):
`E_i = 1 / (1 + 10^((R_j − R_i) / 400))`, `S_i` = 1 win / 0.5 draw / 0 loss (from `is_winner` or
higher `score`), `ΔR_i += (K / (n − 1)) · (S_i − E_i)` with `K = 32`, `n` = member players.
Apply all deltas after computing them (ratings are read before any update). Increment `plays`,
set `last_played_at`. `coop` and `none` outcomes do not change ratings.

Mirror the formula in `src/utils/elo.ts` (pure, unit-tested) and keep a fixture file
`supabase/tests/fixtures/elo_cases.json` that both the Vitest test and the pgTAP test read, so
the SQL and TS versions cannot drift. The TS version is used only for the "preview" line in the
log dialog ("Ratingen din endres med ca. +12").

## 5. Frontend

### 5.1 Files

| File                                                   | What                                                                                                                                                                                                                                        |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/supabase/queryHelpers/plays.ts`                   | `logPlay()`, `confirmPlay()`, `disputePlay()`, `getMyPendingPlays()`, `getMyPlays({ year })`, `getMyStats(year)`, `getClubGameStats(since)`, `getClubHighlights(since)`, `getLadder(gameId)`, `setLadderOptIn(bool)`, admin `deletePlay()`. |
| `src/supabase/queryHelpers/playErrors.ts`              | Error codes → Norwegian.                                                                                                                                                                                                                    |
| `src/schemas/play.ts`                                  | zod: title 1–80, players 1–12 with caller, guests 0–10, scores finite numbers, outcome rules (winner needs ≥ 1 winner, coop needs won/lost).                                                                                                |
| `src/utils/elo.ts` (+ test)                            | Pure Elo used for preview.                                                                                                                                                                                                                  |
| `src/components/sections/playLog/LogPlayDialog.tsx`    | Three-step form (game, players, result). On mobile, steps; on desktop, one scrolling form. Uses `Dialog`, `Input`, `Checkbox`, `Segmented`/tabs for outcome type, `AvatarStack` for selected players.                                       |
| `src/components/sections/playLog/PendingPlays.tsx`     | Confirm list on the member page.                                                                                                                                                                                                            |
| `src/components/sections/playLog/MyStats.tsx`          | Stat tiles + "Dine mest spilte" list + co-players. Load the `dataviz` skill before building any chart; a simple horizontal bar list is enough for v1.                                                                                       |
| `src/components/sections/playLog/ClubStatsSection.tsx` | Public aggregates for `/statistikk` and a compact variant for `/våre-spill`.                                                                                                                                                                |
| `src/components/ui/StatTile.tsx` (+ test)              | Label + big number + optional sub-text. Shared with the admin statistics view.                                                                                                                                                              |
| `src/pages/Stats.tsx`, `src/loaders/stats-loader.ts`   | `/statistikk` public page (club stats; ladder links for opted-in members).                                                                                                                                                                  |
| `src/pages/Ladder.tsx`, `src/loaders/ladder-loader.ts` | `/statistikk/rangering/:gameId`, member-only, behind the portal flag. Redirect to `/login?reason=not_authenticated` when signed out, as `member-portal-loader.ts` does.                                                                     |
| `src/main.tsx`                                         | Add `{ path: 'statistikk', ... }` publicly and `statistikk/rangering/:gameId` inside the `memberPortalEnabled` spread. Keep slugs byte-identical in every link.                                                                             |

### 5.2 Copy

- "Logg et parti" · steps "Spill", "Spillere", "Resultat" · "Annet spill" · "Gjester (ikke medlemmer)"
- Outcome options: "Hvem vant?", "Poeng", "Samarbeidsspill", "Ingen resultat"
- Confirm list: "{navn} logget {spill} på {arrangement}. Var du med?" · "Bekreft" · "Jeg var ikke med"
- Stats: "Partier i år", "Ulike spill", "Dine mest spilte", "Spiller ofte med", "Vinnerprosent"
- Club: "Mest spilt siste 90 dager", "Nytt i klubben", "Spilt {n} ganger i klubben"
- Ladder opt-in (member page settings): "Vis meg på rangeringer. Andre medlemmer som også har
  skrudd på dette ser fornavnet ditt og ratingen din for spill du har spilt minst tre ganger."
- Empty states: "Ingen partier logget ennå. Spilte du noe sist? Logg det!"

### 5.3 Accessibility

- Stat tiles are text, not images; any chart has a table alternative.
- The player picker is a list of checkboxes with avatar + name, searchable, not a custom combobox.
- Ladder is a real `<table>` with caption and `aria-current="true"` on the caller's row.

## 6. Notifications (PWA phase)

- "{navn} logget {spill} med deg — bekreft?" to pending players (batched daily at 20:00 if
  several).
- Monthly "Din måned i klubben" summary (opt-in) using `my_play_stats`.

Outbox table `play_notifications` written by `play_log`, consumed by the PWA phase's sender.

## 7. Data and GDPR

| Data                              | Where                      | Basis                                                                       | Retention                                      |
| --------------------------------- | -------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------- |
| Plays you logged                  | `plays`                    | Legitimate interest (club records), with the member's own action            | Kept; `logged_by` set null on account deletion |
| Your participation, result, score | `play_players`             | Same; other players confirm or dispute                                      | Cascade-deleted with your account              |
| Ratings                           | `play_ratings`             | Consent (opt-in to ladders); computed for everyone but shown only on opt-in | Cascade-deleted with your account              |
| Ladder opt-in                     | `profiles.show_on_ladders` | Consent                                                                     | With profile                                   |

- **Export:** all plays the member is in (game, event, date, players' first names, result) and own ratings.
- **Delete:** cascades the member's `play_players` and `play_ratings`. Plays with no members left are
  deleted by a trigger on `play_players` delete. After deletion, run `play_recompute_ratings` for
  each affected game (the GDPR delete function calls it).
- **Visibility of others:** a play shows the first names of its member players only to other
  players in it. Aggregates never name anyone and need ≥ 3 distinct players.
- **Privacy policy:** a paragraph on what is logged, who sees it, the ladder opt-in, and that you
  can remove yourself from any play with "Jeg var ikke med".

## 8. Security checklist

- [ ] Only players in a play can read it (`is_play_member`), verified by pgTAP from three users.
- [ ] `play_log` cannot add a member who is not signed up for the event.
- [ ] No member can mark someone else confirmed.
- [ ] Ladder function returns nothing to a non-opted-in caller and never includes non-opted-in members.
- [ ] Public aggregates enforce the ≥ 3 distinct players threshold in SQL, not in the UI.
- [ ] Rating tables are only written by `security definer` functions; no write policies.
- [ ] Text inputs length-limited and rendered as text; scores are numbers (`numeric(8,2)`).
- [ ] Rate limit (`too_many_plays`).

## 9. Tests

**SQL:** visibility per role; ratings applied exactly once per play (several confirmations past the threshold, a confirm after auto-confirm, a retried call); logging non-attendee rejected; confirm threshold and auto-confirm;
dispute removes player and recomputes; Elo cases from the shared fixture; aggregates hide games
with < 3 players; ladder opt-in gating; account deletion cascades and recompute.

**Unit:** `elo.ts` against the fixture; `LogPlayDialog` validation per outcome type; `PendingPlays`
confirm/dispute calls the right helper and removes the item; `MyStats` empty and populated;
`ClubStatsSection` renders nothing on error (settled loader).

**E2E (stubbed):** member logs a play from an event page; pending confirm appears for another
member fixture; `/statistikk` renders public aggregates signed out; ladder redirects signed out.

## 10. Slices

1. **Schema, RLS, `play_log` / confirm / dispute, SQL tests, query helpers.** No UI.
2. **Log dialog + pending confirmations** on the event page and member page.
3. **Elo** (`play_apply_ratings`, recompute, cron auto-confirm), shared fixture, `elo.ts`.
4. **My stats** on the member page.
5. **Public club stats** (`/statistikk`, game card line). Ships publicly when slice 1–2 data exists.
6. **Ladders** with opt-in.
7. **Hooks:** table → "Logg partiet" (if plan 2 is live), check-in suggestions, badge rules read
   from `my_play_stats`, GDPR export/delete, notifications.

## 11. Later

- Season summary ("Klubbåret 2027") page each December from `club_highlights`.
- Import BGM tournament results as plays with `outcome = 'scores'`.
- BG Stats import (JSON file upload, parsed client-side, member reviews before saving).
