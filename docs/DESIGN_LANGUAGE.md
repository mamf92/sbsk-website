# Design language — modernized flat edge

The SBSK look is **flat with a hard edge**, and it stays that way. What changed is that flat
no longer means motionless: surfaces you can press now respond.

> Keep distinctive: sharp corners + SBSK palette.
> Modernize by: micro-interactions, hovers, subtle shadows, animations.
> Keep it flat but tighten details.

## What stays

- **Zero radius.** `rounded-none` everywhere. No component rounds its corners, at any size.
- **No soft elevation.** No blur, no spread, no alpha-faded drop shadow, no `scale()`.
  Nothing pretends to float above the page. The modal layer is the one exception, and it is
  an exception the system already granted — see "The modal layer" below.
- **The SBSK palette.** Orange and the blues carry the hierarchy; greys are brand greys,
  not Tailwind's.

## What is new

- **Hard offset shadows.** A solid, un-blurred rectangle offset down-right — `--shadow-1`
  (2px) and `--shadow-2` (4px). It reads as a printed edge, not as depth.
- **The up-left lift.** On hover a pressable surface moves `translate(-2px, -2px)` and the
  4px shadow appears behind it. On press it settles to `translate(1px, 1px)` on the 2px
  shadow. At rest it is flat: no offset, no shadow.
- **Colour and travel on two clocks.** The colour swap is 120ms on
  `cubic-bezier(0.2, 0, 0, 1)` so it reads as instant; the movement is 180ms on
  `cubic-bezier(0.16, 1, 0.3, 1)` so it decelerates into place. This is what the design
  library's own `Button` does — an earlier pass here collapsed both onto one 120ms clock,
  which is why the two values were corrected rather than kept.

## Tokens

All of it lives in the `@theme` block of `src/index.css`. Add to it rather than hardcoding a
value in a class.

| Token                      | Value                                          | Purpose                    |
| -------------------------- | ---------------------------------------------- | -------------------------- |
| `--duration-fast`          | `120ms`                                        | Colour swaps               |
| `--duration-base`          | `180ms`                                        | Travel                     |
| `--ease-standard`          | `cubic-bezier(0.2, 0, 0, 1)`                   | Colour curve               |
| `--ease-out`               | `cubic-bezier(0.16, 1, 0.3, 1)`                | Travel curve               |
| `--transition-fast`        | `var(--duration-fast) var(--ease-standard)`    | Colour, as a fragment      |
| `--transition-snappy`      | `var(--duration-base) var(--ease-out)`         | Travel, as a fragment      |
| `--hard-shadow-color`      | `darkestblue`; `white` in dark mode            | The offset shadow's colour |
| `--shadow-1` / `-2` / `-3` | `2px` / `4px` / `6px` hard offset              | Press / hover / raised     |
| `--lift-hover`             | `translate(-2px, -2px)`                        | Hover offset               |
| `--lift-hover-card`        | `translate(-3px, -3px)`                        | Hover offset, cards        |
| `--lift-press`             | `translate(1px, 1px)`                          | Press offset               |
| `--shadow-overlay`         | `0 12px 32px -8px` on `--overlay-shadow-color` | The modal panel's shadow   |
| `--color-overlay-scrim`    | `white/0.7`; `darkblue/0.7` in dark mode       | The modal scrim            |

The full set — the whole duration and easing scale, the accent and overlay shadows, the
category colours, the disabled and focus states, and the exact heading type scale — is in
`src/index.css`, grouped and commented.

Two naming rules worth knowing, because getting either wrong fails silently:

- **The shadow colour is not a `--color-*` token.** That namespace would mint `bg-shadow` and
  `text-shadow` utilities, and the latter collides with Tailwind's own text-shadow scale.
- **A shadow token's colour must stay behind a `var()`.** Tailwind resolves a literal colour
  inside a `--shadow-*` token at build time and inlines it, which kills any `.dark` override.
  Both `--hard-shadow-color` and `--overlay-shadow-color` exist for exactly this reason.

## The heading scale

`--text-h1` … `--text-h4` are an exact four-step scale, named rather than mapped onto Tailwind's
default sizes because the defaults only approximate them (`--text-h1` is 32/44, `text-3xl` is
30/36). They set size and line-height only, so a heading still carries its own `font-heading`
and `font-bold`.

| Step      | Size / line-height | Takes it                                        |
| --------- | ------------------ | ----------------------------------------------- |
| `text-h1` | 32 / 44            | The one document heading a route has            |
| `text-h2` | 28 / 38            | A section heading inside a page                 |
| `text-h3` | 20 / 27            | A card, list-entry or profile title             |
| `text-h4` | 16 / 22            | The wordmark, and headings inside a dense block |

**The heading's level picks the step.** An `<h2>` takes `text-h2`. That is the whole rule, and
it is why the levels themselves have to be right: on `/` the posts header was an `<h1>` beside
the hero's, which is both an invalid outline and the reason it sat at 20px next to a 30px `<h2>`
one component away. Fixing the level fixed the size.

Four things sit deliberately outside the scale:

- **`--text-display`** — `clamp(34px, 5vw, 56px)`, the system's only fluid step, for a page that
  is nothing but its statement. The 404 is the one today. #144 chose not to add a display step to
  the heading scale, and that still holds: this is not a step above `h1`, it is a size for a
  treatment. If the home hero ever wants it, that is a decision to make by looking at the hero,
  not by reaching for the nearest big token.
- **`--text-errorcode`** — `clamp(96px, 15vw, 180px)` on a 0.8 line-height, the 404's flanking
  numerals.
- **The calendar's day numerals**, on `--text-daymark` (66px). Decorative digits, not a heading.
- **Rich text inside a `Card`.** `src/sanity/editors/portableTextComponents.tsx` owns its own
  sizes, because a heading inside an expanded panel is nested two levels deeper than the card
  title above it and would out-shout it on the shared scale.

`tracking-heading` (0.05em) is **opt-in**, not part of the scale. It belongs to display contexts
that read as brand — the header wordmark, the calendar's column heads and hero, the placeholder
titles — and a heading that does not take it is not missing anything.

Before #144 the scale was used five times in the whole codebase and every other heading picked a
raw Tailwind size, so `<h1>` rendered at four different sizes across the site and one of them was
smaller than an `<h2>` two components away.

## Page widths

Three container tokens, and a page section picks one of them:

| Token                 | Value           | Takes it                                             |
| --------------------- | --------------- | ---------------------------------------------------- |
| `--container-shell`   | `75rem` (1200)  | `Header`, `Footer`, full-page sections               |
| `--container-content` | `64rem` (1024)  | Card lists, calendar, posts, the two portals         |
| `--container-form`    | `37.5rem` (600) | Forms, login, dialogs, single-column reading measure |

Tailwind v4 mints the utilities from the `--container-*` namespace, so these are written
`max-w-shell` / `max-w-content` / `max-w-form`. Pick by what the section holds, not by how wide
it wants to be — the names are the decision, the pixels are a consequence.

Before #146 there were six widths in two notations (`max-w-300` beside `max-w-5xl` beside
`max-w-md`), so navigating from the calendar to a portal to a login form stepped the content
column inward twice while the 1200px header and footer above and below it stayed put. A test in
`src/test/tailwindClasses.test.ts` fails on a `max-w-*` above 24rem that is not one of the three,
including an arbitrary `max-w-[1100px]`; a `max-w-*` below that is sizing a component, not a
column, and is left alone.

The narrow-to-wide pair the portals use (`max-w-form md:max-w-content`) is the one place a
section takes two steps — the member list is four columns that cannot be four columns on a
phone. Horizontal padding is still scattered and is deliberately not part of this; it interacts
with each section's own layout in a way the width does not.

## The shadow colour belongs to the surface

A hard offset shadow is only a lift if it contrasts with the fill it is painted onto, and that
fill is not the theme. A `darkblue` panel exists in light mode; an `orange` one exists in dark
mode. Two global values keyed off `.dark` cannot cover either, which is what #139 measured: with
the shadow set to brand black in dark mode, 17 of 19 lifting elements on the front page fell
below 3:1, and a `nyheter` card panel matched its own shadow exactly in both themes.

There are exactly two usable shadow colours across the palette, and the fill decides which:

| fill                          | `darkestblue` shadow | `white` shadow   |
| ----------------------------- | -------------------- | ---------------- |
| `darkestblue` / `darkblue`    | 1.00 / 1.24          | 16.63 / 13.36    |
| `orange`                      | 7.64                 | 2.18             |
| `darkorange`                  | 4.99                 | 3.33             |
| `white` / `gray-100` / `-300` | 16.63 / 15.34 /11.78 | 1.00 /1.08 /1.41 |

So `src/index.css` defines two more utilities:

```
surface-dark    the fill is darkestblue, darkblue or black — descendants cast white
surface-light   the fill is white, a grey, orange or darkorange — descendants cast darkestblue
```

Put one on the element that paints the fill; every lifting descendant picks it up through
inheritance. `orange` counts as _light_ here — the name is about which shadow the fill can carry,
and orange can only carry the dark one. The `.dark` block still sets a value, but it is now only
the dark **page** background's shadow, the same way the `:root` value is the light page's.

Two rules keep this working:

- **Never put `surface-*` on the element that lifts.** It would repoint that element's own
  shadow. A `Card` casts onto the page behind it; the header and panel _inside_ it are the
  surfaces its buttons cast onto. `CalendarSection` keeps `surfaceTone` as a separate key for
  this reason — its fill lands on the card root, which is the element carrying `lift-card`.
- **A slot that takes caller content declares its tone unconditionally.** `Card`'s `panels` map
  and `CalendarSection`'s `CATEGORY_STYLES` do, because what a caller puts in them is not
  knowable from the component.

`e2e/shadow-contrast.spec.ts` walks every lifting element on the public routes in both themes and
fails below 3:1. It is a Playwright spec rather than a unit test because the ancestor chain and
the resolved custom property only exist in a real browser.

Not the accent shadow: `--shadow-accent-1` / `-2` are orange, and an orange shadow under a
`variant="primary"` button is orange-on-orange, so the button reads as a smeared parallelogram.
They stay in the theme for a deliberate accent on a non-orange element.

Note also that `--duration-*` is **not** a Tailwind utility namespace — there is no
`duration-fast` class. Read the variable directly: `duration-(--duration-fast)`.

## The modal layer

A modal is the one place the flat rule bends, and the theme has said so from the start:
`--shadow-overlay` is described in `src/index.css` as "the single soft shadow in the system"
and reserved for modals and drawers. What was missing was anything that used it — both
hand-rolled overlays cast no shadow at all, and both blurred their scrim with a copy-pasted
`backdrop-blur-xs` that no document mentioned.

The decision, made once rather than twice by accident:

- **The panel casts `--shadow-overlay`.** Soft, because it is the only element on the page
  that genuinely is above everything else rather than printed onto it. A hard offset shadow
  would read as a second, smaller rectangle behind the panel.
- **The scrim is a flat alpha wash plus a 2px blur.** `--color-overlay-scrim` is the wash and
  flips with the theme like `--color-hero-scrim`. The blur is about _separation_, not depth:
  the page behind a modal is inert, and pushing it fractionally out of focus says so. It is
  2px — enough to read as unavailable, not enough to look like frosted glass.

Both live on `Dialog` (`src/components/ui/Dialog.tsx`), which is the only thing that should
paint them. The scrim is a hand-written `.sbsk-dialog::backdrop` rule in `src/index.css`,
because `::backdrop` is a pseudo-element and no utility on the dialog can reach it.

`Dialog` is built on the native `<dialog>` and `showModal()`. That is where the focus trap,
Escape, the top layer and the inertness of the page behind come from — none of it
hand-written, and none of it optional. What the component adds on top is the two things
`<dialog>` does not do: it locks page scroll, and it restores focus to the opener explicitly,
because the native restore only fires while the opener is still in the document and both
portals unmount it on revalidate. `e2e/dialog.spec.ts` pins all of it in a real browser.

A dialog's heading is an `h2`. Every route already has an `h1`; a modal opening on top of one
must not mint a second.

## Using it

Do not assemble the tokens by hand. `src/index.css` defines two custom utilities:

```
lift        buttons and the burger — hover onto shadow-2, press onto shadow-1
lift-chip   chips — hover onto shadow-1, press onto no shadow, and no lift when selected
lift-card   cards — hover 3px onto shadow-3, and stay raised on shadow-2 while expanded
```

Each owns the hover offset, the press offset, the shadows, and the colour transition — on a
single `transition` declaration. That last part matters: an element takes one of these
**instead of** `transition-colors` or `transition`, never both, because the last
`transition-property` to land in the cascade wins outright and would silently drop the other
half. A test on each component pins it.

`lift-chip` additionally reads `aria-pressed`: a selected chip is already "down", so it still
presses but never lifts.

Both honour `prefers-reduced-motion: reduce`, where they keep the shadow — a shadow is not
motion — and drop the travel.

## Who lifts

Lift is for things you press. It is not decoration.

- **Yes:** `Button` (every variant except `disabled`) and `NavMenuButton`, via `lift`.
- **Yes:** `Chip`, via the shallower `lift-chip`.
- **No:** the `disabled` Button variant — nothing there is pressable, so it keeps the bare
  colour transition and never moves. `lift` itself also neutralises `:disabled`, since
  `:hover` still matches a disabled element and any variant can carry the attribute.
- **No:** text links. `Link` underlines on hover and that is the whole interaction. Header
  nav is the one elaboration: `navLinkClasses` wipes an orange rule in from the left, and
  keeps it drawn on the current route via `aria-current="page"`.
- **Yes:** a pressable card, via `lift-card`. Settled by the news-cards rebuild (#88) and
  adopted unchanged by the calendar (#87), which needed the same answer. A card **rests
  flat**, exactly like a button — a 1px border and no shadow. What scales with the larger
  surface is the response, not the resting state: hover travels 3px onto `--shadow-3`
  rather than 2px onto `--shadow-2`. An expanded card is the exception: it is holding an
  open panel, so it rests on `--shadow-2` until it closes, read off `data-expanded` the way
  `lift-chip` reads `aria-pressed`. There is no press state — a card settles by expanding,
  and a downward nudge would fight the panel opening beneath it. A card you cannot press
  keeps the border and nothing else.
- **Not yet:** form controls were deliberately left out of this pass — they need their own
  decision and touch far more markup than buttons do. See the follow-up issue for forms.

## Upstream

Claude Design is upstream, this repo is the source of truth. When the two disagree, the
disagreement is worth resolving explicitly rather than porting silently — see
`docs/ROADMAP.md`, Phase 4.
