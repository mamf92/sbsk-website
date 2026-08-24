/**
 * The one field class string, and the reason this module exists.
 *
 * Before the port it was copy-pasted byte-identical into six places across five files — twice
 * hoisted to a private `INPUT_CLASS_NAME` const, the extraction instinct stopping at the file
 * boundary both times. `Input`, `Textarea` and `Checkbox` are the only things that read it now.
 *
 * Two deliberate corrections to what was copied:
 *
 * - **`focus-visible:outline`, not `focus:ring`.** Form controls were the only surface in the
 *   system still drawing a Tailwind `ring` — which is a `box-shadow`, and the brand reserves
 *   `box-shadow` for the hard offset lift — and the only one showing it on a mouse click as
 *   well as on keyboard focus. `Button`, `Chip`, `Link`, `NavMenuButton` and `Card` all use
 *   the outline; these now match.
 * - **`--color-focus-ring`, not a hardcoded `orange`.** The token exists for this. It resolves
 *   to the same colour today, so the change is in what the class says rather than what it paints.
 */

/** Colour, type and focus — everything that is not the box itself. */
export const fieldSurface =
  'font-body text-darkblue bg-white placeholder:text-placeholder placeholder:font-body ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-focus-ring';

/**
 * The resting hairline. Split from the error border rather than layered under it: a
 * `dark:` variant compiles to a `:where()` selector and carries no extra specificity, so
 * `border-error` and `dark:border-orange` would be decided by the order Tailwind happens
 * to emit them in. Only ever one of these two is applied.
 */
export const fieldBorder = 'border border-darkblue dark:border-orange';
export const fieldBorderInvalid = 'border border-error dark:border-error';
export const fieldBorderValid = 'border border-success dark:border-success';

/**
 * The hard offset shadow that lends a field's interaction state a coloured edge — orange
 * while focused, red once it fails validation, green once it passes — the same square-offset
 * language `lift` gives a pressable surface, applied to state instead of motion. A field never
 * moves, so this owns colour only; `invalid`/`valid` never both apply, and `invalid` wins if a
 * caller somehow passes both, matching the glyph precedence in `Input`/`Textarea`.
 *
 * `focus:`, not `focus-visible:` — this is a state indicator, not the keyboard affordance
 * (`fieldSurface`'s outline already owns that), so it is fine to show on a mouse click too.
 *
 * Never the only signal a field's state is carried on: see the note by `--shadow-error-2` in
 * `src/index.css` for why `--color-error` cannot sit alone on a `darkblue` panel. The border
 * and the glyph in the class lists above say the same thing on their own with this omitted.
 */
export function fieldStateShadow({ invalid = false, valid = false } = {}) {
  if (invalid) return 'shadow-error-2';
  if (valid) return 'shadow-success-2';
  return 'focus:shadow-accent-2';
}

/**
 * Pairs with `fieldStateShadow` and `fieldBorderValid`/`-Invalid`. Its own transition, not
 * `lift`'s — a field never travels, so it has no motion half to keep off a separate clock,
 * and pairing it with `lift` would trip the mutual-exclusion rule that utility enforces.
 */
export const fieldStateTransition =
  'transition-[box-shadow,border-color] duration-(--duration-fast) ease-standard';

/**
 * The permanently-disabled newsletter input in `Footer` was the one field with a class string
 * of its own. It is the `:disabled` state, not a variant — it is driven by the attribute the
 * element already carries.
 */
export const fieldDisabled =
  'disabled:cursor-not-allowed disabled:border-transparent disabled:bg-disabled-bg ' +
  'disabled:text-disabled-text disabled:placeholder:text-disabled-text';

/**
 * `px-3 py-2 md:px-4 md:py-3`, which is what five of the six copies said. The sixth —
 * `PostsSection`'s search field — said a flat `px-4 py-3`, so search boxes on Innlegg and in
 * the board portal had different padding at every width below `md`. Absorbed rather than
 * preserved.
 */
export const fieldPadding = 'px-3 py-2 md:px-4 md:py-3';

/** Room for the trailing affordance — the error glyph, or a search icon. */
export const fieldPaddingWithIcon = 'pr-10 md:pr-11';
