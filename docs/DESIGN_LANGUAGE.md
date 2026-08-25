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

## Foreground on fill

Text contrast is a property of the fill too, and one pairing shipped wrong: `white` on
`darkorange` measures 3.33:1 (WCAG 2.1, sRGB), which only clears AA at large text (≥24px, or
≥18.66px bold). It was body-sized `text-white` on every `darkorange` fill — `Card`'s
`arrangementer`/`annet` header, its `spillkveld`/`turnering` panel, the active `Chip` for
`neutral`/`arrangementer`/`annet`, and `CalendarSection`'s `turnering` accent and `annet`
surface (#136).

Measured across the brand palette:

| pair                                                 | ratio   | verdict                |
| ---------------------------------------------------- | ------- | ---------------------- |
| `white` on `darkblue`                                | 13.36:1 | AA                     |
| `white` on `darkestblue`                             | 16.63:1 | AA                     |
| `darkestblue` on `orange` (Button primary resting)   | 7.64:1  | AA                     |
| `darkblue` on `orange`                               | 6.14:1  | AA                     |
| `darkestblue` on `darkorange` (Button primary hover) | 4.99:1  | AA                     |
| `darkblue` on `darkorange`                           | 4.01:1  | fails AA for body text |
| `gray-500` on `white` (Chip inactive)                | 7.00:1  | AA                     |
| `white` on `darkorange`                              | 3.33:1  | fails AA for body text |

`Button` `variant="primary"` is `bg-orange text-darkestblue`, hovering to `bg-darkorange` — the
same fill hovers into itself, so both states need one foreground that clears AA on each, and
`darkestblue` is the only one of the two blues that does (#203).

The fix is `darkestblue`, not a new colour — it is already the pairing `Button
variant="secondary"` uses on the same fill. So `darkorange` (and its aliases,
`--color-category-arrangementer` / `--color-category-annet`) takes exactly one foreground
everywhere:

```
darkorange fill → darkestblue text
```

the same way [`surface-light`/`surface-dark`](#the-shadow-colour-belongs-to-the-surface) above
pick one shadow colour per fill. Every other pairing in the table already held and is unchanged.

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

`size` picks the panel shape and defaults to `'form'` — the narrow, padded, internally-scrolling
column every dialog wanted until the carousel lightbox needed the opposite: `'full'` is
near-viewport-filling with no internal scroll, for content that lays itself out rather than
stacking. The two are a lookup map of mutually exclusive class strings, not two partial strings
layered together — Tailwind resolves conflicting utilities (two `max-w-*` values, say) by emit
order, not by which one a template literal happens to list last, so a panel's size can't be
assembled from pieces that might both land.

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

The three `lift-*` utilities honour `prefers-reduced-motion: reduce`, where they keep the
shadow — a shadow is not motion — and drop the travel.

### Which single-choice control

Three controls in this system take one choice out of a set, and the list pages had all three
doing the same job before #148. They are not interchangeable:

| Control     | Reads as                          | Reach for it when                                     |
| ----------- | --------------------------------- | ----------------------------------------------------- |
| `Chip`      | a filter — additive, multi-select | narrowing a list by category                          |
| `Segmented` | all the options, exactly one on   | 2–4 short labels that fit on one line at 320px        |
| `Dropdown`  | one of many, folded away          | more options than that, or labels too long for a line |

Sorting is `Dropdown` on both list pages. It is single-select, so a chip row was the wrong
shape for it outright — two visually identical rows of chips on Innlegg, one filtering and
one sorting, is the specific confusion that settled this. `Segmented` was the first
candidate, and the labels decide against it. Measured in the built stylesheet at the `md`
size, Innlegg's four sort labels come to **475px** joined and Kalender's three to **362px**,
against a 320px viewport — neither fits, and shortening `Dato (siste til første)` far enough
to fit would cost more meaning than the control gains. Kalender's Kommende / Tidligere / Alle
switcher measures 235px, which is what `Segmented` is for.

`Dropdown` (#203) replaced a native `<select>`: the same folded-away shape, but every option is
now drawn by the component in both themes rather than the browser's own listbox chrome, so it
reads as one system with `Chip` and `Segmented` instead of a visibly foreign control. Focus
never leaves its trigger button — see the component's own doc comment for the
`aria-activedescendant` mechanics.

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
- **No:** `Segmented`. Restyled on an underline-tab treatment (#203) rather than the bordered
  button group it used to be — the same `after:` wipe-in rule `navLinkClasses` gives header
  nav, sized to match `Chip` instead of `Button`. A tab is not a pressable surface any more
  than a text link is, so it never takes `lift`: the selected segment reads `text-orange` with
  its underline scaled to full width, and an unselected one previews the same underline on
  hover, the way `Chip`'s hover now previews its category colour.
- **No:** form controls, still — a text field is not a pressable surface, you put a caret in
  it rather than press it, so `Input`, `Textarea` and `Checkbox` never move and never
  take `lift`. What changed with the Kontakt oss form (#180) is that they gained a hard offset
  shadow of their own: see "Field state" below. The distinction that keeps both statements
  true is _lift is motion, a field's shadow is state_ — a lift is transform-plus-shadow on
  press, a field's shadow is colour-only and permanent for as long as the state holds.

## Field state

`Input` and `Textarea` paint a hard offset shadow, alongside the resting border, to say what
state a field is in: a colour while focused, red once it fails validation, green once it
passes. `Checkbox` gets the same shadow on focus and invalid, without a valid state — nothing
pairs a checkbox with a pass/fail check yet. This resolves a disagreement with the upstream
Claude Design library rather than porting it silently, per "Upstream" below: the library's
`Input.jsx` always painted `--shadow-accent-2` on focus and a red offset when destructive, and
the port that shipped without it was corrected once the Kontakt oss form needed the same
signal plus a third, green state the library does not have.

`fieldStateShadow()` in `src/components/ui/fieldClasses.ts` is the one place that decides the
class: `invalid` outranks `valid`, matching the glyph precedence `Input`/`Textarea` already
had, and the resting case is `focus-visible:shadow-focus-2`.

**`focus-visible:`, and the field's _only_ focus indicator.** It started as `focus:`, painted
alongside a separate `focus-visible:outline` on `fieldSurface` — a field showed the shadow on
any focus and the outline only via keyboard, so a mouse click and a keyboard tab-in painted two
different combinations. Making both fire on `focus-visible:` fixed the inconsistency but not
the doubling: every keyboard focus now drew a full 2px outline _and_ a 4px offset shadow at
once, and the shadow's own offset landed directly against whatever sat below the field — a
`FieldError` four pixels under it, at the `gap-1` the two used to share. `fieldSurface`'s
outline is gone on `Input`/`Textarea`/`Checkbox` now; the shadow is the whole affordance, and
"Focus" below documents fields as the one exception to the site-wide outline for this reason.

**Not built on `--hard-shadow-color`.** That token is a _surface_ property — `surface-dark` /
`surface-light` re-point it per panel — and a field's state colour must not move with it: a red
field means the same thing on the white page and on a `darkblue` panel. `--shadow-error-2`,
`--shadow-success-2` and `--shadow-focus-2` in `src/index.css` are literal colours instead,
which is normally the mistake this document warns kills the `.dark` override — harmless here
because the field fill is white in both themes, so none of the three has one to lose.

**Never the only signal — except the resting shadow, which now has to be.** `--color-error`
measures 2.01:1 on `darkblue`, well under the 3:1 a non-text indicator needs (WCAG 1.4.11) —
the same failure `Alert` exists to route around — so the invalid/valid shadows stay additive:
`fieldBorderInvalid`/`-Valid` (a coloured hairline on the white field itself) and the
`AlertCircle`/`Check` glyph and `aria-invalid` already carry those two states on their own. The
resting focus shadow is different: once the outline it used to share the job with was removed,
it became the _only_ visual focus signal a field has, which is what forced its colour off the
site's usual `orange` (`--color-focus-ring`) and onto `darkorange` instead — the one brand tone
that clears 3:1 against every fill a field actually sits on.

| pair                          | ratio  | verdict                                            |
| ----------------------------- | ------ | -------------------------------------------------- |
| `--color-error` on white      | 6.46:1 | AA — the field's own fill                          |
| `--color-error` on `darkblue` | 2.01:1 | fails 1.4.11 — why invalid/valid stay additive     |
| `--color-success` on white    | 6.20:1 | AA                                                 |
| `orange` on white             | 2.18:1 | fails 1.4.11 — why the resting shadow isn't this   |
| `darkorange` on white         | 3.33:1 | AA — `--shadow-focus-2`'s colour                   |
| `darkorange` on `darkblue`    | 4.01:1 | AA — same colour, the Kontakt oss/login panel fill |

`--color-success` (`#007124`) is new, the library's `green-success-700` and the sibling
`--color-error` already was — the first tone besides red the system has needed. `Alert` grew a
matching `tone="success"` (`role="status"` rather than `role="alert"`, since a confirmation is
not an interruption); `FieldError` stays error-only.

## Rich text images are a miniature `Card`

A photo inside a post's body (`src/components/ui/SanityImage.tsx`) is not a bare `<img>` with a
line of caption text floating beneath it — it borrows `Card`'s own shape: a photo, a hard rule,
and a tinted panel below carrying whatever the photo needs to say. Applying that grammar one
level down, instead of inventing a second visual language for images, is the point.

- **The frame lives on the figure, not the image.** `border border-black` wraps the photo and
  its caption strip as one bordered insert; the `<img>` itself is `border-0`, beating
  `.sbsk-rt img`'s base-layer hairline exactly the way that rule's own comment says a component
  should — with a plain Tailwind utility, no `index.css` edit.
- **Left-anchored is the mobile rule; from `md` up, an editor-chosen float wraps text beside the
  photo.** The desktop reading column is wide (~992px), and a portrait photo clamped to a sane
  height is necessarily narrower than it — centering that gap makes the photo read as a stray
  thumbnail adrift in whitespace, and simply anchoring it left (no `mx-auto`) leaves the same gap
  on the other side with nothing wrapping into it. The fix is Sanity's own documented shape for
  this exact problem: an `alignment` field (`postType.ts`) storing `høyre`/`venstre`/`full`, and
  `postsImageComponent.tsx` translating it to `md:float-right`/`md:float-left`/nothing. Below
  `md` every value collapses to full-width and stacked — a wrapped column that narrow is a ragged
  ribbon, not a layout. Headings and lists (`portableTextComponents.tsx`) carry `clear-both` so
  they always start a fresh line below a pending float rather than squeeze beside it — and below
  the carousel's own left float (next section) once a post has one.
- **The caption strip is `border-t border-black bg-current/10`** — the identical rule `Card`
  draws between its header and its panel, and a tint of whatever text colour the strip already
  inherits (white inside a `nyheter` panel, `darkestblue` everywhere else). No category prop,
  no `dark:` variant, and no contrast risk: a 10% tint only pushes an already-passing ratio
  (see "The shadow colour belongs to the surface") further from the line, never closer.
- **Credit reads "Foto: {name}"**, not a bare name — the ordinary Norwegian photo-credit form —
  on its own line under the caption rather than joined to it with an em dash.

What this is not: a licence to reach for `shadow-*` here. An inline image is not pressable, so it
stays flat — border only, per "Who lifts" above. The rule this section documents is about
placement and framing, not about borrowing the lift system.

## The carousel

An optional per-post photo set (`postType.ts`'s `carousel` field, `src/components/ui/Carousel.tsx`)
embodies several brand decisions worth naming, because each one reads as an obvious choice only
after you've ruled out the more obvious-looking alternative:

- **Square ticks, not circular dots.** Instagram's own position indicator is a circle; zero
  border-radius is a hard rule here with no image-specific exception, so the indicator is a small
  flat square instead — `currentColor`-tinted like the caption strip, so it self-adapts to
  whichever panel it's sitting in. Unlike Instagram's dots, these are real buttons: tappable, and
  labelled `"Bilde N av totalt"` for a screen reader.
- **The active tick is filled, and reads its state off `--shadow-1`, not `--shadow-inset-1`.**
  It used to be the inset shadow `Segmented` reads off its own `aria-pressed` — the "pressed
  into the group" cue a _joined_ control needs, borrowed because it was the nearest existing
  affordance. A carousel tick isn't joined to anything, though, and every other "this one is
  selected/raised" surface in the system reads the plain offset shadow instead — the tick now
  does too. The offset paints outside the mark, onto the panel, where `surface-dark`/`-light`
  already guarantee its contrast, which is what frees the mark itself to fill solid with
  `bg-current`: the old inset shadow painted _inside_ the mark in the same `currentColor` a fill
  would have used, so filling it then would have painted the shadow directly over itself.
- **No `lift-chip` on the thumbnails**, even though they're pressable and the utility would fit.
  A photo tile lifting onto a hard offset shadow reads as elevation _on a photograph_, which is
  the one thing the flat language avoids — border colour and the focus ring are the whole
  affordance, same as the ticks.
- **A literal `vh` budget on the whole component, not just the photo.** "Never more than 60% of
  the screen" means the viewport, not the card — `max-h-[80vh] lg:max-h-[60vh]` on the root, with
  the thumbnail/tick row and caption strip `shrink-0` so the image itself is the only part the
  flex algorithm can squeeze. The carousel floats left from `lg` up (same reasoning as an inline
  image's float, one breakpoint later — a half-width carousel with a thumbnail row needs more
  room than a half-width photo does) with the post's own text wrapping beside it and continuing
  at full width once it runs past the carousel's bottom edge — an ordinary consequence of
  wrapping a float, not a separately built region.
- **The photo opens a full-screen `Dialog`, on click or tap, with the arrows and ticks carried
  over.** `Dialog` gained a `size="full"` panel for this — every prior caller wanted the narrow,
  padded `'form'` column, and a lightbox needed the opposite: near-viewport-filling, no internal
  scroll, the image laying itself out instead of stacking in a column. It shows the photo at its
  own aspect (clamped to the same `MIN_ASPECT`/`MAX_ASPECT` band `SanityImage` uses), not the
  strip's fixed `3:2` — the inline crop exists so the box doesn't resize under a reader paging
  through photos of different ratios, a constraint a full-screen view with no neighbour to stay
  level with doesn't have.
- **Swipe is touch and pen only.** `onPointerDown`/`onPointerUp` on the image measure the drag
  and bail immediately when `pointerType === 'mouse'` — a mouse drag stays a plain drag (native
  image drag, text selection), and a mouse click always opens the lightbox with nothing to
  suppress. A touch drag has to clear 40px and be more horizontal than vertical before it pages
  rather than opens; `touch-pan-y` on the image keeps vertical page scroll working for a finger
  that lands on the photo without meaning to swipe it. The same threshold and the same handlers
  drive both the inline strip and the lightbox, since both page the one shared `index`.

## Loading, empty, error

Three states every async screen passes through, and before #153 each screen invented its own —
three loading treatments at three levels of intrusiveness, three unrelated empty states, and an
error that no screen reader ever mentioned.

**Loading is four square pips, one dim at a time.** A rotating spinner is out of language:
nothing here rotates and nothing eases. A shimmering skeleton is worse — a soft gradient
sliding under a surface is exactly the depth cue the system rejects. What is left is what the
brand already does, which is hard discrete states, so `sbsk-load-step` runs on
`steps(1, end)`: no interpolation between frames at all, the same 4-frame quality as the
dice roll's face swaps. `LoadingIndicator` wraps the pips in a `role="status"` live region;
`Button`'s `loading` prop uses the bare pips, because a button in flight already carries
`aria-busy`.

`loading` on a `Button` swaps the **icon**, never the label. Keeping the label keeps the width,
and the button disables itself — the version this replaced swapped the label to
"Logging in..." and stayed live, which made double-submitting a registration reachable.

**Empty is heading, body, optional action.** `EmptyState` at `page` scale for "there is nothing
here at all" and `inline` for "this list has content but no matches". It is colour-neutral and
inherits from whatever surface it lands on, because it lands on the white page and on a
`darkblue` panel. `ErrorState` is the same shape at full-page scale with the 404's furniture.

**Error brings its own surface.** `--color-error` is `#b5251f`, and both auth forms sit on a
`darkblue` panel where red text measures **2.07:1** — so the obvious treatment fails outright.
`Alert` is a white block with a red hairline, a red glyph and red text: 6.4:1, flat, square,
and legible on any fill. `role="alert"` is the part that matters most; these failures used to
be painted and never announced. `FieldError` is `Alert` at `sm`, and pairs with `invalid` on
`Input` / `Textarea` — the control owns the box, `FieldError` owns the words, and
`aria-describedby` joins them.

## Focus

Every interactive surface in `src/components/ui/` draws the same focus affordance, `Input`,
`Textarea` and `Checkbox` excepted (see below):

```
focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
```

on `--color-focus-ring`. Three things about it are deliberate, and form controls used to get
all three wrong — they were the only place in the system still doing so, which is what the
form-controls port (#86) corrected:

- **`focus-visible:`, not `focus:`.** The ring is for keyboard navigation. Drawing it on a
  mouse click as well is noise.
- **`outline`, not `ring`.** A Tailwind `ring` is a `box-shadow`, and on this brand
  `box-shadow` is spoken for — the hard offset lift, and since #180 a field's state colour (see
  "Field state" above). Reaching for `ring` on top of either is how a focused button ends up
  looking pressed.
- **The token, not the colour.** `--color-focus-ring` exists for this. It resolves to orange
  today, so reading it changes nothing on screen — it changes what happens when the brand
  moves.

**Text fields are the one exception.** `Input`, `Textarea` and `Checkbox` used to draw this
outline _and_ `fieldStateShadow()`'s hard offset shadow on the same `focus-visible:` trigger —
which meant every keyboard focus painted twice, a full ring plus a 4px shadow, and the shadow's
own offset ran straight into whatever sat below the field. The outline is gone from all three
now; the state shadow (`--shadow-focus-2`, `darkorange` rather than the token above — see
"Field state" for why) is a field's whole focus affordance. Nothing else in the system shares
this exception: buttons, chips, links, `NavMenuButton` and `Card` never carried a competing
shadow on focus, so the doubling was specific to form controls and the fix is too.

## Upstream

Claude Design is upstream, this repo is the source of truth. When the two disagree, the
disagreement is worth resolving explicitly rather than porting silently — see
`docs/ROADMAP.md`, Phase 4.
