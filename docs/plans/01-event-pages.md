# Phase 1 — Event pages at three levels, and Board Game Masters

Status: **planned** (2026-11-11). Target: Board Game Masters, late January 2027.
Base branch: `redesign`. Every PR below goes into `redesign`, never `main`.

This plan is written so an agent can pick up one work package (WP) at a time and ship it as
one PR. Read `CLAUDE.md`, `docs/DESIGN_LANGUAGE.md` and the redesign decision log
(`/mnt/project-files/redesign/decisions.md`) first. Use the `sbsk-sanity-schema`,
`sbsk-component` and `sbsk-release` skills for the work they cover.

---

## 1. Goal

A visitor can find any club event, see exactly when and where to show up, and sign up. Events
come in three sizes, and the editor picks the size in Sanity:

| Level | Name in Studio       | What the visitor gets                                                                                                                                    | Example                        |
| ----- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| 1     | **Kun i kalenderen** | A row in `/kalender` that expands in place. No page.                                                                                                     | Biweekly spillkveld            |
| 2     | **Egen side**        | A page at `/arrangementer/:slug` with practical info, sign-up, program, prices, sponsors.                                                                | Høstturnering, a release party |
| 3     | **Storarrangement**  | A multi-day festival page with a day-by-day program of many sessions, per-session sign-up, sponsor tiers, and a printable program that replaces the PDF. | Board Game Masters             |

Posts already have their own page at `/innlegg/:id` (decision 9), so "some posts get pages"
is done. This phase only links posts and events to each other (WP7).

Sign-up in this phase is **a link out to Spond** (or any https link). Our own sign-up and Vipps
payment arrive with the members phase; the data model and the `SignupBlock` component below
are shaped so that phase adds a method rather than rewriting the page.

### Non-goals for this phase

- Our own sign-up form, payment, waiting lists, check-in. (Members/Vipps phases.)
- Full-site translation. This phase lays the i18n foundation and translates the event pages
  only (WP2). The rest of the site follows in its own phase.
- Embedding Spond or a map. The CSP has `frame-src 'none'` on purpose (see §8); we link out.

---

## 2. What already exists (verified on `redesign`, 2026-11-11)

- `src/sanity/schemaTypes/eventType.ts` — `event` document with `hasDetailPage`, `slug`,
  `signupUrl {label,url}`, `programInfo`, `pricingInfo`, `schedule[]`, `showSponsors`,
  `sponsors[]`. Norwegian Studio labels already follow the editor conventions.
- `src/pages/SingleEventPage.tsx` — level 2 template; every section is conditional.
- `src/sanity/queryHelpers/events.ts` — `EVENT_ROW_PROJECTION`, `CALENDAR_EVENTS_QUERY`,
  `EVENT_BY_SLUG_QUERY`, `eventDetailLoader`.
- `src/pages/BoardGameMasters.tsx` — a `PagePlaceholder`. Route `/board-game-masters` exists and
  is linked from the footer.
- `src/components/ui/` — `Tabs`, `Chip`, `Tag`, `EventScheduleCard` (with .ics download),
  `Button`, `Link`, `SanityImage`, `EmptyState`, `Skeleton`, `Alert`, `Divider`.
- `src/utils/ics.ts` (`buildIcs`, `downloadIcs`), `src/utils/eventDateFormat.ts`.
- `src/sanity/editors/portableTextComponents.tsx` — already rejects non-http(s) link marks.
- Sanity content: one placeholder BGM event, `Fiktiv: Stavanger Board Game Masters XIX!`
  (`event`, 2027-02-26, Tasta bydelshus). All events have slugs; none has `hasDetailPage` set.
- No `i18next` or any i18n library. All copy is hardcoded Norwegian.
- No Figma file is linked anywhere in the repo or project memory. **Ask Martin for the Figma
  link** before WP5; until then follow the decisions log and the existing redesign components.

### Bugs found while planning (fix in WP1)

1. **Level 1 events leak a page.** `eventDetailLoader` fetches by slug without checking
   `hasDetailPage`, and every event has a slug, so `/arrangementer/spillkveld-torsdag-10-desember`
   renders a page that the editor never asked for. The loader must 404 unless
   `hasDetailPage == true`.
2. **Times follow the visitor's time zone.** `eventDateFormat.ts` calls `toLocale*String` with a
   locale but no `timeZone`, so a visitor abroad (or a CI runner in UTC) sees shifted times.
   All event formatting must pass `timeZone: 'Europe/Oslo'`.
3. **Sponsor/sign-up URLs are only validated in the Studio.** `SingleEventPage` passes
   `signupUrl.url`, `sponsor.link` and `sponsor.ctaLink` straight to `window.open`/`href`.
   Studio validation does not cover API writes, so a `javascript:` URL is possible (§8).

---

## 3. Decisions (made in this plan; Martin can overrule any)

| #   | Decision                                                                                                                                                                                                                                                                                                                                           | Why                                                                                                                                                                                         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Level is chosen with one radio field **«Hvor skal arrangementet vises?»** on `event`: `kalender` / `side`. Level 3 is its own document type `festival` («Storarrangement»).                                                                                                                                                                        | A 3-day program with 30+ sessions does not fit in the `event` form; the level 1/2 form stays short. `hasDetailPage` stays as the stored field (API name stable) and the radio writes to it. |
| D2  | Festivals live at **`/arrangementer/:slug`** like events. `/board-game-masters` shows the **current BGM edition** (nearest upcoming festival in series `bgm`, else the latest past one).                                                                                                                                                           | One URL space for everything with a date. The footer link keeps working and always points at this year's edition; old editions stay reachable by slug.                                      |
| D3  | A festival is **days → sessions**. A session has time, title, optional game (reference), format, room/table, seats, optional sign-up, optional sponsor.                                                                                                                                                                                            | Matches "3 days, each a full day of different games at different times".                                                                                                                    |
| D4  | Festival days appear in `/kalender` as **one row per day**, linking to `/arrangementer/:slug?dag=N`. No separate `event` docs are needed.                                                                                                                                                                                                          | Editors enter dates once. Visitors see each day where they look for it.                                                                                                                     |
| D5  | Program UI: **underline tabs per day** (decision 10), `?dag=N` in the URL, a vertical timeline grouped by start time, **format chips** as a filter. Default tab = today during the festival, else day 1.                                                                                                                                           | Shareable ("join us on day 2"), works on a phone, matches existing `Tabs`/`Chip`.                                                                                                           |
| D6  | **"Nå / Neste"** marker on the timeline while the festival runs (Europe/Oslo clock).                                                                                                                                                                                                                                                               | The page doubles as the on-site program, which is what replacing the PDF means.                                                                                                             |
| D7  | **Print stylesheet** + «Skriv ut programmet» button and «Legg hele programmet i kalenderen» (.ics with one VEVENT per session).                                                                                                                                                                                                                    | Replaces the PDF with no separate artefact to maintain.                                                                                                                                     |
| D8  | Sign-up is one reusable object **`signup`** with `method`: `spond` / `lenke` / `oppmote` (drop-in, no sign-up) / `stengt`. `sbsk` (own sign-up) is reserved for the members phase and hidden. Used on event, festival and session.                                                                                                                 | One component (`SignupBlock`) renders all; phase 3 adds a method.                                                                                                                           |
| D9  | Sponsors become one shared object type **`sponsor`** with `tier`: `hovedsponsor` / `sponsor` / `partner`. Main sponsors get a band under the hero; all sponsors get a section near the bottom; a session can be «presentert av» one sponsor.                                                                                                       | "Sponsor spacing is needed": three placements, graded by tier, no ad-hoc layouts.                                                                                                           |
| D10 | Practical info is a shared object **`venue`** («Oppmøte»): name, address, meeting-point text, «dørene åpner» time, directions (bus/parking), accessibility, map link generated from the address (OpenStreetMap search URL). No map embed.                                                                                                          | No new CSP origin, no third-party tracking, works offline from a screenshot.                                                                                                                |
| D11 | i18n: **i18next + react-i18next**, `nb` default, `en` second. Language in a header toggle, stored in `localStorage`, reflected in `<html lang>`. **No `/en/` URL prefix**; Norwegian slugs stay. Sanity text that visitors read on event/festival pages is a `{nb, en}` object; `en` is optional and falls back to `nb` rendered with `lang="nb"`. | Smallest change that gives a full English page. URL prefixes would double every route in a Pages SPA for no SEO gain the club needs.                                                        |
| D12 | Times are always shown in **Europe/Oslo**, and every time is a `<time dateTime=…>`.                                                                                                                                                                                                                                                                | Fixes bug 2; correct for tourists at BGM.                                                                                                                                                   |

---

## 4. Work packages (one PR each, in this order)

| WP  | Title                                                                             | Depends on | Size |
| --- | --------------------------------------------------------------------------------- | ---------- | ---- |
| WP1 | Harden level 1/2: 404 guard, Oslo time zone, safe URLs                            | –          | S    |
| WP2 | i18n foundation (`nb`/`en`)                                                       | –          | M    |
| WP3 | Shared Sanity objects: `signup`, `sponsor`, `venue`, `localeString`, `localeText` | WP1        | M    |
| WP4 | Level 2 page upgrade: facts bar, `SignupBlock`, `VenueCard`, sponsor tiers        | WP2, WP3   | M    |
| WP5 | `festival` schema, Studio structure, query helpers, loaders                       | WP3        | M    |
| WP6 | Festival page UI (BGM)                                                            | WP4, WP5   | L    |
| WP7 | Calendar + home + posts integration                                               | WP5        | S    |
| WP8 | E2E suite, a11y and print checks; enter real BGM content                          | WP6, WP7   | M    |

WP1 and WP2 can run in parallel. Report each green PR to the coordinator before merging
(project merge rule).

---

### WP1 — Harden level 1/2

**Files:** `src/sanity/queryHelpers/events.ts`, `src/utils/eventDateFormat.ts`,
new `src/utils/safeUrl.ts` (+ test), `src/pages/SingleEventPage.tsx`,
`src/sanity/editors/portableTextComponents.tsx`.

1. `EVENT_BY_SLUG_QUERY`: add `&& hasDetailPage == true` to the filter. The loader then 404s for
   level 1 events. Unit test in `events.test.ts` with a mocked `client.fetch` asserting the
   query string contains the guard and that `null` → `Response` 404.
2. `eventDateFormat.ts`: add `const TIME_ZONE = 'Europe/Oslo'` and pass it to every
   `toLocale*String`. `sameDay` comparisons must compare Oslo calendar dates, not
   `toDateString()` (which uses the runtime zone): add `osloDateKey(date) =>
date.toLocaleDateString('sv-SE', { timeZone: TIME_ZONE })` (gives `YYYY-MM-DD`). Tests run
   with `TZ=America/New_York` for this file (`vi.stubEnv` won't do it; set `process.env.TZ` at
   the top of the test file before any Date is created, or add a `test:tz` script) and assert
   `clockTime(new Date('2027-01-29T17:00:00Z')) === '18:00'`.
3. `src/utils/safeUrl.ts`:
   ```ts
   /** The URL if it is absolute http(s), else null. Never trust CMS URLs at render time. */
   export function safeExternalUrl(url: unknown): string | null;
   export function openExternal(url: unknown): void; // no-op when unsafe; noopener,noreferrer
   ```
   Reject `javascript:`, `data:`, `vbscript:`, protocol-relative `//x`, whitespace/control-char
   tricks (`' javascript:'`, `'java\tscript:'`) — parse with `new URL()` and check
   `protocol === 'https:' || 'http:'`. Move `isSafeExternalUrl` out of
   `portableTextComponents.tsx` to use this. Unit tests for each bad case.
4. `SingleEventPage`: route every CMS URL (`signupUrl.url`, `sponsor.link`, `sponsor.ctaLink`,
   `links[].url`) through `safeExternalUrl`; render nothing for `null`. Replace the local
   `openExternal`.

**Done when:** a level 1 slug 404s; time tests pass under a foreign `TZ`; no CMS URL reaches
`href`/`window.open` unchecked (grep for `window.open` and `href={` in `src/pages` and
`src/components` to confirm).

---

### WP2 — i18n foundation

**New deps:** `i18next`, `react-i18next` (declare in `package.json`; no CSP change, bundled).

**Files:** `src/i18n/index.ts`, `src/i18n/locales/nb/*.json`, `src/i18n/locales/en/*.json`,
`src/i18n/useLocale.ts`, `src/utils/locale.ts` (owns reading/writing the preference, like
`theme.ts` owns the theme), `src/main.tsx`, `src/components/layout/Header.tsx`,
`src/utils/eventDateFormat.ts`.

1. Namespaces: `common` (header/footer/buttons), `events` (everything in this phase). Keys are
   English camelCase (`events.signup.openSpond`), values per locale. Start with
   `nb` as the source of truth; `en` must have the same key set.
2. `initLocale()` runs next to `initTheme()` in `main.tsx`: read `localStorage['sbsk-locale']`,
   else `navigator.language` starting with `nb|nn|no` → `nb`, else `en`... **but default to `nb`
   when unsure** (club audience is Norwegian). Set `document.documentElement.lang`.
3. Language toggle in the header next to the theme toggle: a `Button variant="ghost"`-style
   control labelled `EN` / `NO`, `aria-label` «Change language to English» /
   «Bytt språk til norsk», each label in its own target language with `lang` attribute.
4. Date formatting reads the active locale (`nb-NO` / `en-GB`) from one place
   (`currentDateLocale()`), still with `timeZone: 'Europe/Oslo'`.
5. Content helper `pickLocale(value: {nb?: string; en?: string} | undefined, locale)` returns
   `{ text, lang }` so the caller can set `lang="nb"` on fallback text (screen readers then
   pronounce it correctly). Same for Portable Text arrays.
6. Tests: a unit test that loads both JSON trees and asserts identical key sets (fails the build
   if a key is missing in `en`); a Testing Library test that toggling the language changes
   `<html lang>` and a visible label; `useLocale` hook test.
7. Unit test setup: initialise i18n in `src/test/setup.ts` with `nb` so existing tests that
   assert Norwegian text keep passing.

**Out of scope:** translating other pages. Only strings touched by WP4/WP6/WP7 move into JSON.
Do not translate route slugs.

---

### WP3 — Shared Sanity objects

**Files:** `src/sanity/schemaTypes/objects/{signup,sponsor,venue,localeString,localeText}.ts`,
`src/sanity/schemaTypes/index` (wherever types are registered), `eventType.ts`,
`src/sanity/queryHelpers/fragments.ts` (new, GROQ fragments shared by event and festival).

Follow `sharedFields.ts` wording: Norwegian title, plain help text that says where on the
site it shows, no jargon.

**`localeString` / `localeText`** («Tekst på norsk og engelsk»)

```
nb: string, required   title «Norsk»
en: string             title «Engelsk (valgfritt)», description «Står det tomt, vises den norske teksten også på den engelske siden.»
```

`localeBlock` likewise with `nb`/`en` arrays of `richTextBlock`. Use these only for new
visitor-facing fields in this phase. Existing `title`/`content` on `event` stay plain to avoid
a data migration; level 2 pages show them in Norwegian with `lang="nb"` in English mode.
(Migrating them is a follow-up issue for the full-site i18n phase.)

**`signup`** («Påmelding»)

```
method: 'spond' | 'lenke' | 'oppmote' | 'stengt'     radio, required
        titles: «Påmelding i Spond» / «Påmelding på en annen nettside» /
                «Ingen påmelding – bare møt opp» / «Påmeldingen er stengt»
url: url (https only)        hidden unless spond|lenke; required then.
                             For spond, warn (not error) if host is not spond.com / *.spond.com.
label: localeString          «Knappetekst», default nb «Meld deg på», en «Sign up»
opens: datetime              «Påmeldingen åpner» (optional) – before this, show «Åpner {dato}»
closes: datetime             «Påmeldingsfrist» (optional) – after this, treat as stengt
price: localeString          «Pris (tekst)», e.g. «150 kr, gratis for medlemmer» – shown to visitors
priceNok: number             «Pris i kroner» (optional, integer ≥ 0; empty = free). Unused in
                             this phase; the Vipps phase charges this amount. Hidden until
                             method 'sbsk' is enabled.
capacity: number             «Antall plasser» (informational now; enforced by own sign-up later)
note: localeText             «Mer om påmeldingen» (e.g. «Meld på hver dag for seg»)
```

The render rule lives in one pure function, `signupState(signup, now)` →
`'open' | 'notYetOpen' | 'closed' | 'dropIn' | 'none'`, unit tested at each boundary.

**`sponsor`** («Sponsor») — replaces the inline object in `eventType.ts`. Keep the existing
field names (`logo`, `altText`, `link`, `ctaLabel`, `ctaLink`) so data stays valid, add:

```
tier: 'hovedsponsor' | 'sponsor' | 'partner'   radio, default 'sponsor'
logoOnDark: image   «Logo for mørk bakgrunn» (optional; used in dark mode)
```

Logos are images; require `altText`. For reuse across years, sponsors are an **object**, not a
document, in this phase (simpler for editors); a `sponsor` document with references is a
follow-up only if Martin wants one sponsor list across events.

**`venue`** («Oppmøte»)

```
name: string            «Sted», required (e.g. «Tasta bydelshus»)
address: string         «Adresse» (e.g. «Tastarustå 6, 4027 Stavanger») → map link
meetingPoint: localeText «Hvor møter vi?» (e.g. «Inngang fra parkeringsplassen, 2. etasje»)
doorsOpen: string       «Dørene åpner» as HH:MM (validated /^\d{2}:\d{2}$/), per day on festival
directions: localeBlock «Slik kommer du deg dit» (buss, parkering)
accessibility: localeText «Tilgjengelighet» (trinnfri inngang, HC-toalett …)
contact: string         «Kontaktperson på stedet» – name only; phone numbers are public data,
                        so the help text says «Ikke skriv telefonnummer her».
```

Map link built in code: `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`
— no CSP change (it is a navigation, not a fetch or frame).

**`event` changes**

- Add `level` radio «Hvor skal arrangementet vises?» (`kalender` | `side`) as a _derived UI_ for
  `hasDetailPage`? Sanity can't bind two fields, so: keep `hasDetailPage` as the field and only
  change its title to «Egen side for arrangementet» and its description to explain the three
  levels (and that big events are made under «Storarrangementer»). Do not add a second field.
- Add `signup` (object above) and `venue` (optional; when empty, `location` is used).
- Mark `signupUrl` `hidden: true` and `deprecated` with reason «Bruk Påmelding»; the query
  coalesces: `"signup": coalesce(signup, select(defined(signupUrl.url) => {"method":"lenke",
"url": signupUrl.url, "label": {"nb": signupUrl.label}}))`. No content uses it today
  (checked 2026-11-11), so removal can follow later.
- Sponsors array `of: [{type: 'sponsor'}]`.

Deploy the schema (`npx sanity schema deploy` via the Studio build, or the Sanity MCP
`deploy_schema`) only after the PR merges into `redesign` — the production dataset is shared
with the live site, so changes must be additive.

---

### WP4 — Level 2 page upgrade

**New components in `src/components/ui/`** (use the `sbsk-component` skill; each with a test):

- **`EventFacts`** — a definition list (`<dl>`) row under the title: Når (date + time range,
  `<time>`), Hvor (venue name, map link), Pris (from `signup.price`), Påmelding (state text).
  Wraps to two columns on mobile.
- **`SignupBlock`** — props `{ signup, now?, compact? }`. Renders per `signupState`:
  - `open`: primary `Button` (orange) with `icon="right"`, label from `signup.label`, plus a
    small muted line «Åpner spond.com i en ny fane» (host from the URL). Uses
    `openExternal`. If `closes` is set: «Frist {dato kl}».
  - `notYetOpen`: disabled button + «Påmeldingen åpner {dato kl}».
  - `closed`: `Alert tone="info"` «Påmeldingen er stengt».
  - `dropIn`: info text «Ingen påmelding – bare møt opp».
  - `none`: nothing.
    `compact` (for session rows) renders a secondary, `size="sm"` button.
- **`VenueCard`** — name, address with map link («Vis i kart», external), meeting point,
  doors-open time, directions (Portable Text), accessibility.
- **`SponsorStrip`** / **`SponsorGrid`** — strip: main sponsors, large logos, one row, «Med støtte
  fra»; grid: all tiers, grouped by tier heading («Hovedsponsor», «Sponsorer», «Partnere»),
  logos sized by tier (hovedsponsor `h-24`, sponsor `h-16`, partner `h-12`), fixed aspect boxes
  so logos of odd shapes align. Dark mode uses `logoOnDark` when present, else puts the logo
  on a light `bg-surface` tile (many sponsor logos are dark-on-transparent).
  Links get `rel="noopener noreferrer sponsored"`.

**Page layout (`SingleEventPage`)**, top to bottom:

1. Back link («Alle arrangementer» → `/kalender`)
2. Tag + `h1`
3. `EventFacts`
4. Hero image (16:9, `SanityImage`, alt from image field or empty if decorative)
5. `SignupBlock` (primary action — one orange button per page, decision 4)
6. Main sponsor strip (only `hovedsponsor`)
7. Description (Portable Text)
8. Program / Priser panels (existing)
9. Schedule (existing `EventScheduleCard` list)
10. `VenueCard`
11. `SponsorGrid` (all tiers)
12. Related posts (WP7)

All strings via `t()`. Keep each section conditional on its data, as today.

---

### WP5 — `festival` schema, Studio, queries

**`src/sanity/schemaTypes/festivalType.ts`** — `title: 'Storarrangement'`, groups:
«Grunninfo», «Program», «Påmelding og priser», «Oppmøte», «Sponsorer», «Bilder og tekst».

```
title: localeString            «Navn», e.g. «Stavanger Board Game Masters XIX»
series: 'bgm' | 'annet'        «Hvilken serie?» radio, default 'bgm'
                               (decides what /board-game-masters shows)
edition: string                «Utgave», e.g. «XIX» or «2027» (optional, shown as a tag)
slug: slug                     «Nettadresse», source: title.nb, required
tagline: localeText            «Kort om arrangementet» (max 160) – under the title, and in
                               the calendar and on cards
heroImage: image (hotspot)     «Toppbilde», alt text required
intro: localeBlock             «Om arrangementet»
startDate / endDate            derived, not stored: computed from days in GROQ
days: array of festivalDay     «Dagene», min 1, max 7, validation: dates strictly ascending,
                               no duplicate dates
signup: signup                 «Påmelding for hele arrangementet» (optional)
pricing: localeBlock           «Priser»
venue: venue                   «Oppmøte» (default for all days)
sponsors: sponsor[]            «Sponsorer»
faq: array {question: localeString, answer: localeBlock}  «Spørsmål og svar»
rules: localeBlock             «Regler og praktisk» (e.g. tournament rules, what to bring)
contactEmail: string (email)   «E-post for spørsmål», default the club email
gallery: image[]               «Bilder fra tidligere år» (optional, max 12)
```

**`festivalDay`** (object, «Dag»)

```
date: date                     «Dato», required
label: localeString            «Navn på dagen», optional (default «Dag 1/2/3» in code,
                               e.g. «Fredag – oppvarming»)
opens / closes: string HH:MM   «Dørene åpner» / «Vi stenger», required
venue: venue                   «Annet oppmøtested denne dagen» (optional override)
summary: localeText            «Kort om dagen»
signup: signup                 «Påmelding for denne dagen» (optional; overrides festival)
sessions: array of festivalSession  «Programmet», sorted by start in the preview
```

**`festivalSession`** (object, «Programpost»)

```
start / end: string HH:MM      «Starter» / «Slutter», required, end > start
                               (times are on the day's date, Oslo time; avoids editors
                               picking a datetime on the wrong day)
title: localeString            «Tittel», e.g. «Innledende runder: Catan»
game: reference → game         «Spill» (optional; gives image + player count). If the game
                               type has no documents yet, use gameName: string instead.
gameName: string               «Spillets navn» (used when no reference)
format: 'turnering' | 'finale' | 'laer-a-spille' | 'fri-spilling' | 'demo' | 'pause' | 'annet'
                               «Type», radio. Drives the tag colour and the filter chips.
room: string                   «Rom eller bord», e.g. «Sal 2, bord 1–8»
seats: number                  «Antall plasser»
level: 'nybegynner' | 'alle' | 'erfaren'  «Passer for»
description: localeText        «Beskrivelse» (max 300)
signup: signup                 «Egen påmelding» (optional)
sponsor: string                «Presentert av» – must match a sponsor altText on the
                               festival (custom validation lists the names); rendered
                               as a small logo + name on the session.
```

Previews in Studio: day → `«Fre 29. jan · 12 programposter»`; session →
`«10:00–13:00 · Catan · Turnering»`. Use `orderings`/`preview.prepare`.

**Studio structure (`src/sanity/structure.ts`)**: add «Storarrangementer» list above
«Arrangementer», ordered by first day desc. Add `festivalType` to the registered types.

**Query helpers — `src/sanity/queryHelpers/festivals.ts`**

```groq
// FESTIVAL_BY_SLUG_QUERY
*[_type == "festival" && slug.current == $slug][0]{
  _id, title, series, edition, "slug": slug.current, tagline, heroImage, intro,
  "startDate": days[0].date, "endDate": days[count(days) - 1].date,
  days[]{ _key, date, label, opens, closes, summary, signup, venue,
    sessions[] | order(start asc){ _key, start, end, title, format, room, seats, level,
      description, signup, sponsor,
      "game": coalesce(game->{ name, image, minPlayers, maxPlayers }, { "name": gameName }) } },
  signup, pricing, venue, sponsors[]{ ..., "logo": logo, "logoOnDark": logoOnDark },
  faq, rules, contactEmail, gallery
}

// CURRENT_BGM_QUERY – nearest upcoming, else latest
coalesce(
  *[_type == "festival" && series == "bgm" && days[count(days)-1].date >= $today]
    | order(days[0].date asc)[0],
  *[_type == "festival" && series == "bgm"] | order(days[0].date desc)[0]
){ ...same projection... }
```

Pass `$today` from the client as the Oslo date (`osloDateKey(new Date())`), not GROQ `now()`
(which is UTC and compares against a datetime, not a date). Verify the `days[count(days)-1]`
indexing against the live API with the Sanity MCP before relying on it; if unsupported,
compute `endDate` client-side.

Types: `FestivalTypes`, `FestivalDayTypes`, `FestivalSessionTypes` in the same file.
Pure helpers in `src/utils/festival.ts` (unit tested):

- `sessionDateTimes(day, session)` → `{ start: Date, end: Date }` interpreting HH:MM in
  Europe/Oslo (use `Intl` offset lookup for that date; handles the CET/CEST boundary, even
  though January is always CET).
- `defaultDayIndex(festival, now)` → index of today if within the festival, else 0.
- `nowAndNext(day, now)` → `{ nowKeys: string[], nextKey?: string }`.
- `groupByStart(sessions)` → `[{ start: 'HH:MM', sessions }]`.
- `festivalIcs(festival, locale)` → one VCALENDAR with a VEVENT per session (extend
  `buildIcs` to accept many events; keep `UID` stable as `${festival._id}-${session._key}`).

**Loaders — `src/loaders/festival-loader.ts`**

- `arrangementLoader({params})` replaces `eventDetailLoader` for `/arrangementer/:id`: one GROQ
  round trip that asks for both `{ "event": *[_type=="event" && slug.current==$slug &&
hasDetailPage==true][0]{…}, "festival": *[_type=="festival" && slug.current==$slug][0]{…} }`
  and returns `{ kind: 'event' | 'festival', … }`; 404 when both null. The page component
  switches template. (A festival and an event must not share a slug: add a Studio uniqueness
  check across both types via `isUnique` option on both slug fields.)
- `boardGameMastersLoader()` → `CURRENT_BGM_QUERY`; when none exists, return `{ festival: null }`
  and render the existing `PagePlaceholder` copy (never a 404 – the footer links here).
- Tests with mocked `client.fetch` for: event hit, festival hit, neither (404), BGM fallback to
  past edition, BGM none.

---

### WP6 — Festival page UI

**Route wiring (`src/main.tsx`)** — byte-identical paths:

```ts
{ path: 'board-game-masters', element: <BoardGameMasters />, loader: boardGameMastersLoader },
{ path: 'arrangementer/:id', element: <Event />, loader: arrangementLoader },
```

`BoardGameMasters.tsx` renders `<FestivalPage festival={…} />` or the placeholder.
`SingleEventPage` renders `FestivalPage` when `kind === 'festival'`. `FestivalPage` lives in
`src/components/sections/FestivalPage/` and is lazy like other pages.

**Layout** (mobile first; desktop max width as other pages):

1. **Hero** — `HeroImage` with scrim; edition tag («XIX»), `h1` title, tagline, date range
   («29.–31. januar 2027»), venue name. One primary `SignupBlock` (festival-level) + a
   secondary «Se programmet» anchor link to `#program`.
2. **Main sponsor strip** directly under the hero (only `hovedsponsor`), «Med støtte fra».
3. **Facts row** (`EventFacts`): Når (3 days, doors open each day), Hvor, Pris, Påmelding.
4. **Days overview** — three cards side by side on desktop, stacked on mobile: day name,
   date, «10:00–22:00», 2-line summary, number of sessions, its own `SignupBlock compact` if
   the day has its own sign-up. Each card links to `?dag=N#program`.
5. **Program** (`id="program"`, `h2` «Program»):
   - `Tabs` per day (label «Fre 29.», full label in `aria-label`), synced to `?dag=N` with
     `useSearchParams` (`replace: true`, no scroll jump). Default from `defaultDayIndex`.
   - Format filter: `Chip` multi-select (decision 10) for the formats present that day, live
     count «Viser 8 av 12 programposter», «Nullstill».
   - Timeline: one group per start time (`h3` «10:00»), each session a card:
     time range (`<time>`), `Tag` for format (turnering = orange tint, finale = orange,
     lær-å-spille = blue tint, fri spilling = neutral, pause = muted, no card shadow),
     title, game image thumbnail (square, 64px, from `game.image` if present), room/table,
     seats, level, description (2 lines, «Vis mer» expands), «Presentert av {logo}» when a
     sponsor is set, and `SignupBlock compact` when the session has its own sign-up.
   - «Nå» / «Neste» badges and a left accent on current sessions while `now` is inside the
     day (re-evaluate every 60 s with a `setInterval` cleared on unmount; static under reduced
     motion is fine since nothing animates).
   - Actions under the tabs: «Legg programmet i kalenderen» (.ics, all days) and
     «Skriv ut programmet» (`window.print()`).
   - Empty day: `EmptyState` «Programmet for denne dagen kommer snart».
6. **Om arrangementet** — `intro` Portable Text.
7. **Påmelding og priser** — pricing Portable Text + the festival `SignupBlock` again (the
   only place the orange button repeats; the hero one scrolls out of view on mobile). Note on
   per-day/per-session sign-up when those exist.
8. **Oppmøte** — `VenueCard` for the festival venue; per-day overrides listed under
   «Annet sted på {dag}».
9. **Regler og praktisk** + **Spørsmål og svar** — FAQ as native `<details>/<summary>`
   (accessible, no JS).
10. **Sponsorer** — `SponsorGrid` with all tiers.
11. **Bilder fra tidligere år** — existing `Carousel`.
12. **Kontakt** — «Spørsmål? Send e-post til {contactEmail}» (`mailto:`), and a link to the
    related posts (WP7).

**Print stylesheet** (`@media print` in `src/index.css`, or `print:` variants): hide header,
footer, hero image, tabs, chips, buttons, sponsor strip; show **all days expanded** one after
another with day headings, compact rows (time · title · format · room), sponsor names in text
at the bottom. Test with Playwright `page.emulateMedia({ media: 'print' })`.

**SEO/sharing**: set `document.title` to «{title} · Stavanger Brettspillklubb»; add a JSON-LD
`Event` script? **No** — `script-src 'self'` blocks inline scripts and the CSP must not be
loosened for it. Skip structured data in this phase.

**Accessibility**: one `h1`; heading order h2 (sections) → h3 (time groups); tabs follow the
existing `Tabs` keyboard model; chips use `aria-pressed`; result count in `role="status"`;
«Nå» badge has text, not only colour; all external links announce «(åpnes i ny fane)» via
visually hidden text; 44 px touch targets.

**Performance**: `FestivalPage` chunk is lazy; images via `SanityImage` with `srcset`; the
loader fetches one document (BGM with ~40 sessions is well under 50 KB of JSON).

---

### WP7 — Calendar, home and posts integration

1. **Calendar rows for festival days.** Add to `CALENDAR_EVENTS_QUERY` a second array and merge
   in the loader:
   ```groq
   "festivalDays": *[_type == "festival"]{ _id, title, "slug": slug.current, tagline,
     heroImage, venue, days[]{ _key, date, label, opens, closes } }
   ```
   Map each day to a `CalendarEventTypes`-compatible row in TypeScript
   (`festivalDayToRow(festival, day, index)`): `_id = festival._id + ':' + day._key`,
   `category = 'turnering'`, title «{title} – {dagnavn}», start/end from `date + opens/closes`
   (Oslo), `location = venue.name`, `hasDetailPage = true`, and a new optional field
   `detailPath = '/arrangementer/{slug}?dag={n}'`. `CalendarSection` uses `detailPath` when
   present, else the existing `/arrangementer/{eventSlug}` rule. Unit test the mapper.
2. **Home page**: if a festival starts within 60 days, show a teaser card above the posts feed
   (image, title, dates, «Se programmet»). Small section component
   `FestivalTeaser`; reuse `homeLoader` with one extra query branch.
3. **Posts ↔ events**: add optional `relatedEvent` reference on `post` («Hører til
   arrangement», to `event` or `festival`). Event/festival pages list up to 3 related posts
   (`*[_type=="post" && relatedEvent._ref == ^._id] | order(publishedAt desc)[0...3]`) as
   cards; the post page shows «Les om {arrangement}» linking back.
4. Remove or retitle the placeholder `event` «Fiktiv: Stavanger Board Game Masters XIX!» once
   the real festival document exists (ask Martin before deleting content).

---

### WP8 — Tests, accessibility, real content

**Fixtures (`e2e/fixtures/sanity.ts`)**: add `FESTIVAL_BGM` (3 days, ~6 sessions/day, mixed
formats, one session with its own Spond sign-up, one day with `signup.opens` in the future,
two sponsor tiers), `LEVEL1_EVENT` (no detail page), `MALICIOUS_EVENT` (detail page with
`signup.url = 'javascript:alert(1)'`, sponsor link `data:text/html,…`, a Portable Text link
mark `javascript:`). Extend `stubSanityWithContent` to answer festival queries — match on the
query text as the existing stub does.

**Playwright specs (`e2e/events.spec.ts`)**, all against the production build:

1. `/board-game-masters` shows the festival title as `h1`, three day tabs, and day 1 sessions.
2. Clicking tab 2 updates the URL to `?dag=2` and shows day 2 sessions; reloading
   `?dag=3` opens day 3 directly.
3. Filtering by «Turnering» hides non-tournament sessions and updates the count.
4. With the clock set inside day 2 (`page.clock.setFixedTime`), day 2 is the default tab and
   one session shows «Nå».
5. The festival sign-up button links to spond.com; clicking opens a popup
   (`context.waitForEvent('page')`) and the opener is null (`noopener`).
6. A day whose sign-up opens later shows the disabled state and the opening date.
7. `/arrangementer/{level1-slug}` shows the 404 page.
8. `/arrangementer/{level2-slug}` shows facts, venue map link (openstreetmap.org), sponsors.
9. Malicious fixture: no element has an `href` starting with `javascript:` or `data:`, and no
   dialog fires (`page.on('dialog')` fails the test).
10. `/kalender` lists the three festival days; each links to `/arrangementer/{slug}?dag=N`.
11. Language toggle → English labels («Programme», «Sign up»), `<html lang="en">`, a
    Norwegian-only field renders with `lang="nb"`; choice survives reload.
12. Print: `emulateMedia({media:'print'})` → all three days visible, tabs hidden.
13. Mobile (`devices['iPhone 13']`): no horizontal scroll (`scrollWidth <= clientWidth`).
14. Times: run the suite with `timezoneId: 'America/New_York'` in one project and assert
    session times still read Oslo time.
15. `e2e/csp.spec.ts` stays green with no new origins.

**Accessibility**: add `@axe-core/playwright` (dev dep) and run an axe scan on
`/board-game-masters`, a level 2 page and `/kalender`, in light and dark mode; fail on
serious/critical. If adding the dependency is rejected in review, do the manual checklist from
the `design:accessibility-review` skill instead and record results in the PR.

**Unit tests** (Vitest): `safeUrl`, `signupState`, `festival.ts` helpers, `festivalDayToRow`,
loaders, i18n key parity, `SignupBlock` states, `SponsorGrid` tier grouping and dark-mode logo
choice, `FestivalPage` renders with empty days/no sponsors/no venue without crashing.

**Real content**: once Martin's information arrives (checklist in §9), create the festival in
the Studio (or with the Sanity MCP as a draft for Martin to review and publish — never publish
on his behalf without a go).

---

## 5. Data model summary

```
event (level 1/2)                 festival (level 3)
├─ title, category, start/end     ├─ title{nb,en}, series, edition, slug, tagline{nb,en}
├─ location, content, image       ├─ heroImage, intro{nb,en}, pricing{nb,en}, rules, faq[]
├─ hasDetailPage  ← level switch  ├─ signup, venue, sponsors[], contactEmail, gallery[]
├─ slug                           └─ days[]
├─ signup   (new, shared)            ├─ date, label{nb,en}, opens, closes, summary, venue?, signup?
├─ venue    (new, shared)            └─ sessions[]
├─ sponsors[] → sponsor (shared)         └─ start, end, title{nb,en}, game→ | gameName,
├─ programInfo, pricingInfo                 format, room, seats, level, description,
└─ schedule[]                               signup?, sponsor (name)
post
└─ relatedEvent → event | festival (new)
```

### Contract with the later phases (agreed with the admin/members and Vipps plans)

This phase stores no personal data. The members and Vipps phases add our own sign-up
(`signup.method = 'sbsk'`) on top of this model, with these identifiers:

- **Where a sign-up points:** `event_id` = Sanity `_id` of the `event` or `festival` document
  (published id, never `drafts.`), and `session_id` = nullable Sanity `_key` of a festival
  **day or session** (keys are unique within a document). `null` = the whole event/festival.
- **Price and capacity come from Sanity**, from the `signup` object at the level where the
  sign-up lives (event, festival, day or session): `signup.priceNok` (integer NOK, empty =
  free) and `signup.capacity`. There is no separate `signupPrice` field on `event`. The server
  (Edge Function) re-reads the price from Sanity when creating a payment; it never trusts a
  price sent by the browser.
- **Tables** (owned by those phases, listed here so names line up):
  - `event_participants` — free RSVP for level 1/2 events (exists today).
  - `event_registrations(id, event_id text, session_id text null, supabase_id uuid null, name,
email, status 'pending_payment'|'confirmed'|'cancelled'|'refunded', payment_reference text
null unique, created_at)` — paid or BGM registrations; non-members allowed with name+email.
  - `attendance` — check-ins by admins.
  - `public.admin_event_signups` view unions RSVPs and registrations for the admin page.
- **Stable keys:** editors must not delete and recreate a day or session after sign-up opens,
  or its `_key` (and every registration pointing at it) is orphaned. Studio help text on
  `days` and `sessions` says so, and the admin page flags registrations whose `session_id`
  no longer resolves.

---

## 6. Copy (nb → en), seed for the locale files

| Key                               | nb                                         | en                                        |
| --------------------------------- | ------------------------------------------ | ----------------------------------------- |
| events.facts.when                 | Når                                        | When                                      |
| events.facts.where                | Hvor                                       | Where                                     |
| events.facts.price                | Pris                                       | Price                                     |
| events.facts.signup               | Påmelding                                  | Sign-up                                   |
| events.signup.default             | Meld deg på                                | Sign up                                   |
| events.signup.opensInNewTab       | Åpner {{host}} i en ny fane                | Opens {{host}} in a new tab               |
| events.signup.deadline            | Frist {{date}}                             | Deadline {{date}}                         |
| events.signup.notYetOpen          | Påmeldingen åpner {{date}}                 | Sign-up opens {{date}}                    |
| events.signup.closed              | Påmeldingen er stengt                      | Sign-up is closed                         |
| events.signup.dropIn              | Ingen påmelding – bare møt opp             | No sign-up needed – just show up          |
| events.venue.title                | Oppmøte                                    | Getting there                             |
| events.venue.doorsOpen            | Dørene åpner {{time}}                      | Doors open {{time}}                       |
| events.venue.showMap              | Vis i kart                                 | Show on map                               |
| events.program.title              | Program                                    | Programme                                 |
| events.program.now                | Nå                                         | Now                                       |
| events.program.next               | Neste                                      | Next                                      |
| events.program.showing            | Viser {{shown}} av {{total}} programposter | Showing {{shown}} of {{total}} sessions   |
| events.program.reset              | Nullstill                                  | Reset                                     |
| events.program.addToCalendar      | Legg programmet i kalenderen               | Add programme to calendar                 |
| events.program.print              | Skriv ut programmet                        | Print programme                           |
| events.program.emptyDay           | Programmet for denne dagen kommer snart    | The programme for this day is coming soon |
| events.format.turnering           | Turnering                                  | Tournament                                |
| events.format.finale              | Finale                                     | Final                                     |
| events.format.laer-a-spille       | Lær å spille                               | Learn to play                             |
| events.format.fri-spilling        | Fri spilling                               | Open play                                 |
| events.format.demo                | Demo                                       | Demo                                      |
| events.format.pause               | Pause                                      | Break                                     |
| events.sponsors.supportedBy       | Med støtte fra                             | Supported by                              |
| events.sponsors.presentedBy       | Presentert av                              | Presented by                              |
| events.sponsors.tier.hovedsponsor | Hovedsponsor                               | Main sponsor                              |
| events.sponsors.tier.sponsor      | Sponsorer                                  | Sponsors                                  |
| events.sponsors.tier.partner      | Partnere                                   | Partners                                  |
| events.back                       | Alle arrangementer                         | All events                                |
| events.faq                        | Spørsmål og svar                           | FAQ                                       |
| events.contact                    | Spørsmål? Send e-post til {{email}}        | Questions? Email {{email}}                |

---

## 7. Edge cases the implementation must handle

- Festival with 1 day (tabs hidden, single list) and with 7 days (tabs scroll horizontally,
  no page overflow).
- Session crossing midnight (`end < start`): validation error in Studio; the UI never sees it.
- Two sessions at the same time in different rooms: same time group, sorted by room.
- Sponsor without logo image: text tile with the name. Logo with a transparent background in
  dark mode: `logoOnDark` or a light tile.
- `?dag=9` (out of range) or `?dag=abc`: fall back to the default day, rewrite the URL.
- Festival in draft only: public dataset excludes drafts, so `/board-game-masters` shows the
  placeholder until publish. Note this in the Studio description of the type.
- Very long game names: titles wrap; never truncate a title, only descriptions.
- Missing English: falls back to Norwegian with `lang="nb"`, never an empty element.
- Sanity unreachable: the route error boundary already handles loader failure; the
  BGM page shows `RouteError`, not a blank page.

---

## 8. Security

Threats in scope for this phase are content-borne: anyone with Studio or API write access, or a
compromised editor account, can put hostile data into the dataset that every visitor renders.

1. **XSS via URLs.** Every CMS URL goes through `safeExternalUrl` (WP1) at render time.
   Studio `rule.uri({scheme:['https']})` is a convenience, not a control. E2E #9 pins it.
2. **XSS via rich text.** Portable Text renders through `@portabletext/react` with our
   `components` map; never use `dangerouslySetInnerHTML`, never add an `html`/`code-embed`
   block type. Add an ESLint rule `react/no-danger: error` (the plugin is already present in
   most React ESLint setups; add it to `eslint.config.js` if not).
3. **No inline scripts or frames.** CSP `script-src 'self'`, `frame-src 'none'`,
   `object-src 'none'` stay as they are. No Spond iframe, no map iframe, no JSON-LD inline
   script. `e2e/csp.spec.ts` must stay green with zero new origins (OpenStreetMap and Spond
   are navigations, which CSP does not govern).
4. **Reverse tabnabbing.** All external links: `target="_blank" rel="noopener noreferrer"`
   (sponsors add `sponsored`); `window.open(url, '_blank', 'noopener,noreferrer')`.
5. **GROQ injection.** Always pass `$slug`/`$today` as params, never string-interpolate.
6. **Data exposure.** The dataset is public-read. Studio help text on contact fields says not
   to enter phone numbers or private emails. No personal data about participants is stored in
   Sanity in any phase — sign-ups belong in Supabase (members phase) behind RLS.
7. **Studio access.** Only Sanity project members can edit. Recommend Martin reviews the member
   list and enables SSO/2FA on the Sanity accounts (Sanity uses Google/GitHub/email login;
   2FA is enforced through that provider). Admin-page 2FA is part of the admin phase.
8. **Clickjacking** cannot be prevented with a `<meta>` CSP (`frame-ancestors` is ignored there;
   see `docs/HOSTING.md`). Accepted for public pages; it matters for the admin phase.
9. **Dependencies.** `i18next`, `react-i18next` (and `@axe-core/playwright` as dev) — check
   `npm audit` in the PR and pin with the lockfile.

---

## 9. What Martin needs to gather for BGM (content checklist)

Hand this to whoever collects the information. Everything in **bold** is required to publish.

- **Edition name/number and dates** (3 days), **opening and closing time each day**.
- **Venue name and address**, where exactly to meet (entrance, floor), parking/bus, step-free
  access, a contact name for the day.
- **Program per day**: for every session the **start and end time**, **game**, **type**
  (tournament, final, learn-to-play, open play, demo, break), room/table, number of seats,
  who it suits (beginner/all/experienced), a one-line description.
- **How sign-up works**: one Spond link for the whole event, per day, or per tournament? When
  it opens and closes. **Prices** (members/non-members, per day/whole weekend).
- **Sponsors**: name, logo (SVG or large PNG, ideally also a version for dark backgrounds),
  website, tier (main/sponsor/partner), any offer to show, and which sessions they present.
- Rules / what to bring, frequently asked questions, a contact email.
- 4–12 photos from earlier years (with permission from people in them).
- An English version of the texts, or a go-ahead to write them.
- The **Figma link** for the BGM design, if there is one.

---

## 10. Definition of done for the phase

- All WPs merged into `redesign`; `npm run lint`, `npm run test`, `npm run build`,
  `npm run test:e2e` green in CI.
- Real BGM festival published in Sanity, visible at `/sbsk-website/redesign/board-game-masters`
  preview, reviewed by Martin on a phone and in print.
- Studio check with a non-developer editor: they can add a session and a sponsor without help.
- Follow-up issues opened: full-site i18n (incl. migrating `event.title/content` to locale
  fields), own sign-up method `sbsk` (members phase), sponsor documents shared across events
  (only if wanted), removal of deprecated `signupUrl`.
