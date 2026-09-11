/**
 * The button recipe, kept out of `Buttons.tsx` so something that is not a `<button>` can wear
 * it — the same split, and for the same reason, as `fieldClasses.ts` beside it.
 *
 * That is not hypothetical: `GameCard`'s three calls-to-action are anchors, because they
 * navigate, and before this they rebuilt the look by hand and got it wrong in the way
 * hand-rebuilt things do. All three carried `lift` and none of them carried a focus ring, so
 * the one part a keyboard user depends on was the part that went missing.
 */

// No size here: each entry in `sizes` owns its font size, so a base size would leak into `xs`.
// The brand stays flat — sharp corners, no blur, no soft elevation, no scale — but it is not
// static: the button lifts up-left onto a hard offset shadow on hover and settles on press.
// Motion lives in `motion` below rather than here, because `disabled` opts out of it.
const base =
  'inline-flex whitespace-nowrap items-center justify-center font-heading rounded-none ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ';

// `not-disabled:hover:` rather than `hover:`, because `:hover` still matches a disabled
// element. Any variant can carry the attribute — a `loading` button always does — and without
// this a button that cannot be clicked still lights up under the pointer. `lift` already
// neutralises the travel and the shadow for the same reason; this is the colour half.
const variants = {
  // `darkestblue`, not `darkblue`: the hover fill is `darkorange`, and darkblue-on-darkorange
  // measures 4.01:1 — below AA for body text. darkestblue clears both fills (7.64:1 resting,
  // 4.99:1 on hover). See "Foreground on fill" in docs/DESIGN_LANGUAGE.md.
  primary: 'bg-orange text-darkestblue not-disabled:hover:bg-darkorange',
  secondary: 'bg-darkorange text-darkestblue not-disabled:hover:bg-orange',
  tertiary: 'bg-darkblue text-white not-disabled:hover:bg-darkestblue',
  disabled: 'bg-gray-300 text-gray-500 cursor-not-allowed',
  // No `surface-light` override for the dark-mode fill here, unlike the orange/darkorange
  // fills in `Card.tsx`: those panels are self-contained, so their own fill is what the
  // offset shadow lands on. This button always sits on the header, which is `surface-dark`
  // (white shadow) regardless of theme — the header's navy is what the shadow lands on, not
  // the button's own fill — so the toggle inherits that rather than setting its own.
  toggle:
    'bg-darkestblue text-white not-disabled:hover:bg-darkblue ' +
    'dark:bg-orange dark:text-darkblue dark:not-disabled:hover:bg-darkorange',
  // No fill of its own: a hairline in whatever colour the surface is already writing in, which
  // inverts on hover. `border-current` rather than `border-darkestblue dark:border-white` —
  // identical on every fill this sits on today, and it cannot drift out of step with the text.
  // Added for `GameCard`'s BoardGameGeek and video links, which hand-rolled exactly this twice
  // and, because they were anchors rather than `Button`s, drew no focus ring at all.
  outline:
    'border border-current bg-transparent ' +
    'not-disabled:hover:bg-darkestblue not-disabled:hover:text-white ' +
    'dark:not-disabled:hover:bg-white dark:not-disabled:hover:text-darkestblue',
} as const;

// `lift` (src/index.css) carries the hover/press micro-action *and* the colour swap on one
// transition-property. `disabled` is the exception: nothing there is pressable, so it keeps
// the bare colour transition and never moves.
//
// `variant="disabled"` now also sets the `disabled` attribute (see the element below). It used
// to be cosmetic only, which meant the grey, `cursor-not-allowed` button was still clickable
// and focusable unless the caller remembered to pass the attribute too — and both the
// `not-disabled:hover:` suppression here and `lift`'s own `:disabled` guard key off that
// attribute, so the look and the behaviour could drift apart silently. The one caller,
// `ContactSection`, already passed both, so nothing changes for it; what changes is that the
// next caller cannot get it wrong.
const motion = {
  primary: 'lift',
  secondary: 'lift',
  tertiary: 'lift',
  toggle: 'lift',
  outline: 'lift',
  // `--duration-*` is not a Tailwind utility namespace, so this reads the var directly
  // rather than via a `duration-fast` class, which would not compile.
  disabled: 'transition-colors duration-(--duration-fast) ease-standard',
} as const;

// height · padding-x · font-size/weight, per the design library scale.
const sizes = {
  xs: 'h-8 px-2 text-xs gap-1',
  sm: 'h-9 px-3 text-xs font-bold gap-2',
  md: 'h-11 px-4 text-base gap-2',
  lg: 'h-12 px-6 text-base font-bold gap-2',
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

/**
 * The button recipe, separated from the `<button>` so something that is not a button can wear
 * it. That is not hypothetical: `GameCard`'s three calls-to-action are anchors — they navigate,
 * so a `<button>` would be the wrong element — and before this they rebuilt the look by hand
 * and got it wrong in the way hand-rebuilt things do. All three carried `lift` and none of them
 * carried a focus ring, so the one part a keyboard user depends on was the part that went
 * missing.
 *
 * Composing this instead means the focus ring, the lift and the size scale can only be got
 * right once. Callers may still add their own fill or layout through `className`, which is
 * appended last — but they no longer get a say in the affordances.
 */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  className = '',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return [base, variants[variant], motion[variant], sizes[size], className]
    .filter(Boolean)
    .join(' ');
}
