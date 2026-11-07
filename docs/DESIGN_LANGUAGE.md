# Design language — redesign 2026

The SBSK site should feel **obvious**. Every component behaves the way people already expect from
the sites and apps they use daily. The club's identity comes from its colours, the dice logo and
the content, not from bespoke interaction patterns.

This document replaces the "modernized flat edge" language (zero radius, hard offset shadows, the
up-left lift, scroll reveals). That version is in git history on `main` if you need to see why
something used to be the way it was. The twelve decisions behind this one were made with Martin on
7 November 2026, one step at a time.

## The decisions

| #   | Area           | Decision                                                                                                                                                                            |
| --- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Direction      | Evolve, don't replace. Keep the dice logo and the navy/orange family in light and dark. Tune hues, add muted tones, and stay within WCAG AA.                                        |
| 2   | Shape          | **Square corners** everywhere (`rounded-none`). Hard offset shadows are gone, and ordinary soft shadows replace them.                                                               |
| 3   | Depth & motion | **Quiet.** A light soft shadow on cards only. Hover changes colour only, with no lift, scale or scroll reveal. Reduced motion follows the OS setting.                               |
| 4   | Colour roles   | **Navy frame, orange action.** Navy header and headings, blue links, and orange only on the one main button. Cool greys tinted toward navy. Category colours are small tags.        |
| 5   | Type           | Keep **Noto Sans** (headings) and **Open Sans** (body), tidied up: no letter-spacing on headings, a clearer scale (36/28/22/18), 16px body at 1.6 line height.                      |
| 6   | Header         | Navy bar, full club name on desktop, four links, a sun/moon icon toggle, an orange **Bli medlem** button, and **Logg inn** as a quiet link. On mobile, a full-width drop-down list. |
| 7   | Buttons        | `primary` (orange), `secondary` (navy outline), `ghost`, `danger` (red). Two sizes, 44px and 36px. A real disabled state, and a spinner while busy.                                 |
| 8   | Fields         | **Filled with an underline.** Tinted fill, label above, 2px bottom line that turns navy on focus. Errors get a red line and a fix-it message below. Optional fields are marked.     |
| 9   | Content cards  | **Card grid, own page per item.** Photo, tag, date, title and a two-line summary. The whole card is a link. Posts get their own route.                                              |
| 10  | Filters        | Underline **tabs** for views, a search field, a **native `<select>`** for sorting, toggle **chips** with a tick, **Nullstill**, and a result count.                                 |
| 11  | Feedback       | **Skeleton placeholders** while loading. Empty states and messages use an icon, a plain sentence and a next step, in blue, green or red.                                            |
| 12  | Preview        | The long-lived `redesign` branch, previewed at `/sbsk-website/redesign/` (see `docs/HOSTING.md`).                                                                                   |

## Tokens

All tokens live in the `@theme` block of `src/index.css`. Rebuilt components use the
**semantic roles** below, never raw colours (the old flat brand names `darkblue`, `orange` and friends were removed). Each role has
a light value in `@theme` and a dark value in the `.dark` block, so `bg-surface text-fg` is written
once and works in both themes.

| Role                                 | Light                             | Dark                  | Use                                       |
| ------------------------------------ | --------------------------------- | --------------------- | ----------------------------------------- |
| `page`                               | `#ffffff`                         | `#0b1e33`             | Page background                           |
| `surface`                            | `#ffffff`                         | `#132a45`             | Cards, dialogs, menus                     |
| `surface-muted`                      | `#eef2f7`                         | `#1a3352`             | Field fill, tints, skeletons, ghost hover |
| `header` / `footer`                  | `#002f5f` / `#031f3b`             | `#031f3b`             | The two navy bands (pair with `on-dark`)  |
| `fg`                                 | `#10233a`                         | `#e8eef5`             | Body text                                 |
| `fg-muted`                           | `#5b6676`                         | `#a3b1c2`             | Meta text, hints                          |
| `heading`                            | `#002f5f`                         | `#e8eef5`             | Headings                                  |
| `link` / `link-hover`                | `#1f4e85` / `#002f5f`             | `#7fb0e6` / `#cfe0f3` | Text links (always underlined)            |
| `border`                             | `#d8dde4`                         | `#24405f`             | Separating surfaces                       |
| `border-strong`                      | `#6b7686`                         | `#7f95b2`             | A control's own edge, ≥3:1 on its fill    |
| `primary` / `-hover` / `on-primary`  | `#f29d35` / `#e08a22` / `#10233a` | same                  | The one main action                       |
| `secondary` / `on-secondary`         | `#002f5f` / `#fff`                | `#e8eef5` / `#0b1e33` | Outline buttons, selected states          |
| `danger` / `-hover` / `on-danger`    | `#b5251f` / `#8f1c17` / `#fff`    | same                  | Destructive buttons                       |
| `danger-text`, `success-text`        | `#b5251f`, `#007124`              | `#ff8a80`, `#7fd6a0`  | Error and success words                   |
| `info-bg`, `success-bg`, `danger-bg` | tints                             | tints                 | Alert fills                               |
| `tag-blue-*`, `tag-orange-*`         | tints + ink                       | tints + ink           | Category tags                             |
| `focus`                              | `#002f5f`                         | `#f29d35`             | Focus outline                             |
| `shadow-card`, `shadow-overlay-soft` | soft navy                         | soft black            | Cards; dialogs and menus                  |

Every text pair above was measured at 4.5:1 or better on `page`, `surface` and `surface-muted` in
its own theme, and `border-strong` at 3:1 or better against field fills.

**`on-dark`** is a utility for any subtree that always paints a dark fill (the header and footer
in both themes). It re-points `fg`, `link`, `secondary`, `surface-muted`, `border` and `focus`,
so a Button or link placed there needs no special variant.

## Rules

- **Corners:** `rounded-none`, always. The only round things are avatars and the spinner.
- **Shadows:** only `shadow-card` on cards and `shadow-overlay-soft` on dialogs and menus.
  Nothing else casts a shadow.
- **Hover:** colour only, via `transition-colors`. Cards underline their title. Nothing moves.
- **Focus:** `focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus`
  on every interactive element. Navy on light and orange on dark, because orange on white is
  2.18:1, which fails WCAG 1.4.11.
- **Orange is for the one main action.** If a screen has two orange buttons, one of them is
  `secondary`.
- **Links are blue and underlined** in running text. Navigation links may drop the underline
  when their position makes them obviously links.
- **Motion:** colour transitions are 150ms, and `motion-reduce:` removes them. Skeletons pulse,
  and they stop pulsing under reduced motion.
- **Category colour** appears only as a tag (`tag-blue-*` / `tag-orange-*`), never as a card's
  fill.

## Components

`src/components/ui/` is the design system. Rebuild order and status are tracked in
`/mnt/project-files/redesign/decisions.md` during the redesign.

### Button (`Buttons.tsx`, `buttonClasses.ts`)

| Variant     | Looks like                       | Use for                                    |
| ----------- | -------------------------------- | ------------------------------------------ |
| `primary`   | Orange fill, dark navy text      | The one main action                        |
| `secondary` | Navy outline (light on dark)     | The alternative action                     |
| `ghost`     | No fill or border, tint on hover | Avbryt, Lukk, toolbar actions              |
| `danger`    | Red fill, white text             | Deleting or removing things in the portals |

Sizes: `md` (44px, default) and `sm` (36px, dense rows only). `disabled` uses the native attribute
and greys the button out. `loading` disables the button, sets `aria-busy` and shows a spinner in
the icon slot while keeping the label. Anything that navigates is a link wearing
`buttonClasses()`, not a `<button>`.

### Links (`Link.tsx`, `linkClasses.ts`)

Text links are `text-link`, always underlined, and thicken the underline on hover. `inherit`
borrows the surface's text colour. Navigation links (`navLinkClasses`, `navLinkClassesBody`) drop
the underline and show a 2px orange bar under the current page (`aria-current="page"`).

### Fields (`Input`, `Textarea`, `Select`, `Checkbox`, `Label`, `fieldClasses.ts`)

A tinted `surface-muted` fill, 44px tall, with a 2px bottom line in `border-strong` that turns to
the focus colour on focus, plus the focus outline. `invalid` turns the line red and shows the
alert glyph; pair it with `FieldError` through `aria-describedby`. Every field has a visible
`Label` above it, and `optional` adds "(valgfritt)". `Select` is the native `<select>` in the same
look. `Checkbox` is the native control with `accent-secondary`.

### Filters (`Chip`, `Tabs`, `Select`)

`Tabs` switch between views of one list (underline tabs, orange bar on the current one). `Chip`
toggles a filter: navy fill and a tick when on, `aria-pressed`. Sorting is a `Select`. A list
with filters shows a result count and a ghost **Nullstill** button once anything is filtered.

### Cards (`Card`, `Tag`, `GameCard`, `EventScheduleCard`)

`Card` is the content card for a grid: photo (16:9, decorative), `Tag`, date, title and a
two-line summary on `bg-surface shadow-card`. The whole card is one link, stretched from the
title, and keyboard focus outlines the whole card. `Tag` is the only place category colour
appears (`blue` or `orange`). Game and event cards follow the same surface and shadow.

### Feedback (`Alert`, `FieldError`, `EmptyState`, `Skeleton`, `Spinner`, `LoadingIndicator`)

`Alert` has `info`, `success` and `error` tones: a tinted fill, a 4px bar on the left, an icon
and a sentence. Errors are `role="alert"`, the others `role="status"`. `EmptyState` is an icon,
a heading, a sentence and the next step. While loading, prefer `Skeleton` / `SkeletonCard` in the
shape of what is coming (`RouteFallback` does this for routes); `LoadingIndicator` (spinner and
label) is for waits with no shape.

### Header, footer and dialogs

The header and footer are `bg-header` / `bg-footer` with `on-dark`. The header carries four
links, the sun/moon toggle, "Logg inn" as a quiet link and "Bli medlem" as the one orange action;
below `lg` the links fold into a full-width list. `Dialog` is a `bg-surface` panel with
`shadow-overlay-soft` over a plain navy scrim.

### Motion

Reduced motion follows the OS. `src/utils/motion.ts` mirrors `prefers-reduced-motion` onto
`.reduce-motion` on `<html>`, which the `motion-reduce:` / `motion-safe:` variants read. There is
no on-site switch and no scroll reveal.
