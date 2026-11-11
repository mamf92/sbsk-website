# New feature ideas — beyond the v2 roadmap

Three features that are not on the v2 roadmap (event pages, admin, members, badges, check-in,
GDPR, contact form, PWA, Vipps, security) but fit a board game club. Each plan is written to be
picked up by an agent and built slice by slice, with the same level of detail as the phase plans.

| #   | Plan                                                            | One line                                                                                                                                       | Builds on                                                |
| --- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 1   | [Spillbiblioteket — game library lending](./01-game-library.md) | Members reserve a club game online and pick it up at the next game night; the board checks it out and in.                                      | Auth, admin page, members list                           |
| 2   | [Spillbord — find a table at game night](./02-game-tables.md)   | Members post "I'm bringing X, 3 seats free" for an event; others take a seat. Newcomers can find a beginner-friendly table before they arrive. | Auth, event pages, (PWA for notifications)               |
| 3   | [Spilloggen — play log and club stats](./03-play-log.md)        | Log who played what (and who won); members get personal stats, the club gets "most played" lists and an optional ladder.                       | Auth, members list, tables (optional), badges consume it |

## Why these three

- **They use the club's real assets.** The club owns games (the `game` documents behind
  `/våre-spill`) and runs game nights. Lending the collection out and filling tables at game
  nights are things the board does by hand today.
- **They feed the roadmap rather than duplicate it.** Check-ins say _that_ a member came; the play
  log says _what_ they played. Badges ("played 25 different games", "taught a table") need that
  data, and so does the admin statistics view.
- **They are low-risk with the current stack.** All three are Supabase tables behind RLS plus
  React pages, with no new third-party host, no new payment flow and no new secret.

Ideas considered and dropped: a marketplace for members to sell games (moderation and liability
with no payment rails we control yet), a rules Q&A forum (moderation burden for a volunteer
board), and BoardGameGeek collection sync (BGG's XML API now requires registration and an API
token, and the value is small next to the club's own catalogue). The game library plan carries
a smaller version of the "what should the club buy" idea as its last slice.

## Suggested order

1 → 3 → 2. The library has the clearest win for the board and needs only the admin page. The
play log is useful on its own and gives badges their data. The table finder is the most social
feature but leans on event pages being live and works best once PWA notifications exist.

## Shared rules for all three

These apply to every slice in every plan. They restate the repo's conventions where it matters.

1. **Behind the portal flag.** Every member-only route sits inside the
   `memberPortalEnabled` spread in `src/main.tsx` until the auth phase removes the flag. Public
   read-only parts (library availability, club stats) may ship earlier if they need no session.
2. **Supabase is the source of truth for anything a member writes; Sanity for anything an editor
   writes.** Sanity documents are public through the CDN, so personal data never goes there
   (see `supabase/migrations/20260903120000_event_participants.sql`, which moved participants
   out of Sanity for exactly that reason). Rows reference Sanity documents by `_id` as `text`.
3. **One admin boundary.** Admin checks use `public.member_is_admin()` and nothing else. Never
   trust a client-sent role, id or name. Writes that touch more than the caller's own row go
   through a `security definer` SQL function with `set search_path = public` that reads
   `auth.uid()` itself, or through an edge function with a user-scoped client, following
   `supabase/functions/update-event-participants/index.ts`.
4. **RLS on every table, deny by default.** `enable row level security` in the same migration
   that creates the table. Add `revoke all ... from anon` where anonymous access is not intended,
   and revoke `execute` on functions from `public, anon` unless the plan says otherwise.
5. **XSS.** React escapes text; keep it that way. No `dangerouslySetInnerHTML`, no Markdown or
   HTML rendering of member text. Free text gets a length limit twice: a `zod` schema in
   `src/schemas/` on the client and a `check` constraint in the database. URLs are validated to
   `https:` and rendered with `rel="noopener noreferrer"`.
6. **GDPR.** Each plan has a "Data and GDPR" section listing what it stores, the export shape and
   what deletion does. The GDPR phase's export and delete functions must be extended with these
   tables in the same PR that creates them. Default: personal rows `on delete cascade` from
   `auth.users`; shared history (a loan, a play other people were in) is kept but anonymised.
7. **Tests.** Unit tests with mocked query helpers (sandboxed sessions may have no backend). RLS
   is tested in SQL (pgTAP under `supabase/tests/`, run with `supabase test db`) using the
   harness the security plan sets up; if it is not there yet, the first slice that needs it adds
   it. Playwright tests stub Supabase via `e2e/fixtures/supabase.ts`.
8. **Design system.** Build from `src/components/ui/*` (`Button`, `Card`, `Chip`, `Dialog`,
   `Input`, `Alert`, `EmptyState`, …) and the redesign decisions in
   `/mnt/project-files/redesign/decisions.md` (or the redesign branch). New shared UI goes in
   `src/components/ui/` with a test. Norwegian copy and Norwegian route slugs.
9. **Times.** Store `timestamptz`; display in `Europe/Oslo` with `Intl.DateTimeFormat('nb-NO')`.
10. **Verify before finishing:** `npm run lint`, `npm run test`, `npm run build`, and
    `npm run test:e2e` when a route changes.
