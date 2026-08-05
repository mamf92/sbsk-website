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
- **Micro-interactions on one clock.** 120ms, `cubic-bezier(0.2, 0, 0, 1)`. The colour swap
  a variant already had and the new movement run on the same duration and curve, so a
  button changes colour and lifts as a single gesture rather than two.

## Tokens

All of it lives in the `@theme` block of `src/index.css`. Add to it rather than hardcoding a
value in a class.

| Token                 | Value                                       | Purpose                            |
| --------------------- | ------------------------------------------- | ---------------------------------- |
| `--duration-base`     | `120ms`                                     | The one micro-interaction duration |
| `--ease-standard`     | `cubic-bezier(0.2, 0, 0, 1)`                | The one curve                      |
| `--transition-snappy` | `var(--duration-base) var(--ease-standard)` | Both, as a transition fragment     |
| `--hard-shadow-color` | `#0d0d0d`, white in dark mode               | The offset shadow's colour         |
| `--shadow-1`          | `2px 2px 0 var(--hard-shadow-color)`        | Press depth                        |
| `--shadow-2`          | `4px 4px 0 var(--hard-shadow-color)`        | Hover depth                        |
| `--lift-hover`        | `translate(-2px, -2px)`                     | Hover offset                       |
| `--lift-press`        | `translate(1px, 1px)`                       | Press offset                       |

`--hard-shadow-color` is deliberately **not** a `--color-*` token: that namespace would mint
`bg-shadow` and `text-shadow` utilities, and the latter collides with Tailwind's own
text-shadow scale. It flips to white under `.dark`, because a near-black shadow is invisible
on `dark:bg-darkestblue` and `dark:bg-black`.

## Using it

Do not assemble the tokens by hand. `src/index.css` defines one custom utility:

```
lift
```

It owns the hover offset, the press offset, both shadows, and the colour transition — on a
single `transition` declaration. That last part matters: an element takes `lift` **instead
of** `transition-colors` or `transition`, never both, because the last `transition-property`
to land in the cascade wins outright and would silently drop the other half.

`lift` also honours `prefers-reduced-motion: reduce`, where it keeps the shadow — a shadow
is not motion — and drops the travel.

## Who lifts

Lift is for things you press. It is not decoration.

- **Yes:** `Button` (every variant except `disabled`), the category and sort chips in
  `CalendarSection` and `PostsSection`.
- **No:** the `disabled` Button variant — nothing there is pressable, so it keeps the bare
  120ms colour transition and never moves. `lift` itself also neutralises `:disabled`, since
  `:hover` still matches a disabled element and any variant can carry the attribute.
- **No:** text links. Header nav, the "logg inn" link in `RegisterSection`, the event list
  in `Events` — these underline on hover and that is the whole interaction.
- **Not yet:** cards and form controls were deliberately left out of this pass. They need
  their own decision about resting shadow and border weight, and both touch far more markup
  than buttons do.

## Upstream

Claude Design is upstream, this repo is the source of truth. When the two disagree, the
disagreement is worth resolving explicitly rather than porting silently — see
`docs/ROADMAP.md`, Phase 4.
