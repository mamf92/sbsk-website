# Design language — modernized flat edge

The SBSK look is **flat with a hard edge**, and it stays that way. What changed is that flat
no longer means motionless: surfaces you can press now respond.

> Keep distinctive: sharp corners + SBSK palette.
> Modernize by: micro-interactions, hovers, subtle shadows, animations.
> Keep it flat but tighten details.

## What stays

- **Zero radius.** `rounded-none` everywhere. No component rounds its corners, at any size.
- **No soft elevation.** No blur, no spread, no alpha-faded drop shadow, no `scale()`.
  Nothing pretends to float above the page.
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

| Token                      | Value                                       | Purpose                    |
| -------------------------- | ------------------------------------------- | -------------------------- |
| `--duration-fast`          | `120ms`                                     | Colour swaps               |
| `--duration-base`          | `180ms`                                     | Travel                     |
| `--ease-standard`          | `cubic-bezier(0.2, 0, 0, 1)`                | Colour curve               |
| `--ease-out`               | `cubic-bezier(0.16, 1, 0.3, 1)`             | Travel curve               |
| `--transition-fast`        | `var(--duration-fast) var(--ease-standard)` | Colour, as a fragment      |
| `--transition-snappy`      | `var(--duration-base) var(--ease-out)`      | Travel, as a fragment      |
| `--hard-shadow-color`      | `darkestblue`, brand black in dark mode     | The offset shadow's colour |
| `--shadow-1` / `-2` / `-3` | `2px` / `4px` / `6px` hard offset           | Press / hover / raised     |
| `--lift-hover`             | `translate(-2px, -2px)`                     | Hover offset               |
| `--lift-press`             | `translate(1px, 1px)`                       | Press offset               |

The full set — the whole duration and easing scale, the accent and overlay shadows, the
category colours, the disabled and focus states, and the exact heading type scale — is in
`src/index.css`, grouped and commented.

Two naming rules worth knowing, because getting either wrong fails silently:

- **The shadow colour is not a `--color-*` token.** That namespace would mint `bg-shadow` and
  `text-shadow` utilities, and the latter collides with Tailwind's own text-shadow scale.
- **A shadow token's colour must stay behind a `var()`.** Tailwind resolves a literal colour
  inside a `--shadow-*` token at build time and inlines it, which kills any `.dark` override.
  Both `--hard-shadow-color` and `--overlay-shadow-color` exist for exactly this reason.

Note also that `--duration-*` is **not** a Tailwind utility namespace — there is no
`duration-fast` class. Read the variable directly: `duration-(--duration-fast)`.

## Using it

Do not assemble the tokens by hand. `src/index.css` defines two custom utilities:

```
lift        buttons and the burger — hover onto shadow-2, press onto shadow-1
lift-chip   chips — hover onto shadow-1, press onto no shadow, and no lift when selected
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
- **Not yet:** cards and form controls were deliberately left out of this pass. They need
  their own decision about resting shadow and border weight, and both touch far more markup
  than buttons do. See the follow-up issues for forms, calendar and news cards.

## Upstream

Claude Design is upstream, this repo is the source of truth. When the two disagree, the
disagreement is worth resolving explicitly rather than porting silently — see
`docs/ROADMAP.md`, Phase 4.
