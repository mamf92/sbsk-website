/**
 * The one field class string, and the reason this module exists.
 *
 * Before the port it was copy-pasted byte-identical into six places across five files — twice
 * hoisted to a private `INPUT_CLASS_NAME` const, the extraction instinct stopping at the file
 * boundary both times. `Input`, `Textarea` and `Checkbox` are the only things that read it now.
 *
 * A field's focus indicator is `fieldStateShadow()`'s hard offset shadow alone — see that
 * function below for why the outline this used to carry is gone. `Checkbox` used to draw its
 * own literal copy of the outline classes on top of the same `fieldStateShadow()` call, which
 * reintroduced the identical double-affordance this file exists to prevent; it was dropped
 * there too rather than left as the one field that still doubles up.
 */

/**
 * Colour, type and focus — everything that is not the box itself.
 *
 * `focus-visible:outline-none`: nothing else in this file paints an outline any more (see
 * `fieldStateShadow` below), but nothing had told the browser to stop painting its own —
 * every field kept its native focus ring (blue in Chromium, varying elsewhere) doubled up
 * against the offset shadow that was supposed to be the field's only focus signal.
 */
export const fieldSurface =
  'font-body text-darkblue bg-white placeholder:text-placeholder placeholder:font-body ' +
  'focus-visible:outline-none';

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
 * `focus-visible:`, matching the invalid/valid states below — not `focus:`, and not paired
 * with `focus-visible:outline` any more. #203 made the shadow and a separate outline share one
 * trigger so a mouse click and a keyboard tab-in would at least show the *same* combination;
 * that still left every focus painted twice — a full 2px ring plus the offset shadow at once —
 * and the shadow landing hard against whatever sits below the field (`FieldError`, four pixels
 * under it at `gap-1`, touched the shadow directly). Removing the outline and keeping the
 * shadow as the sole indicator needed the colour to change: `--color-focus-ring` (orange) on
 * white measures 2.18:1, under the WCAG 2.4.11 non-text minimum of 3:1, so orange could carry
 * the ring (thin, but paired with the shadow) but not the shadow alone. `--shadow-focus-2` in
 * `src/index.css` uses `darkorange` instead, which clears 3:1 against every fill a field sits
 * on — see the contrast table there. `--color-error` / `--color-success` stay literal for the
 * same reason the comment there gives: the border and the `AlertCircle`/`Check` glyph
 * `Input`/`Textarea` render alongside them are colour+shape, not colour alone, so those two
 * states were never resting on contrast the way the plain focus shadow now has to.
 */
export function fieldStateShadow({ invalid = false, valid = false } = {}) {
  if (invalid) return 'shadow-error-2';
  if (valid) return 'shadow-success-2';
  return 'focus-visible:shadow-focus-2';
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
 *
 * `disabled:shadow-none` beats `fieldStateShadow`'s `invalid`/`valid` shadows, which are
 * unconditional classes rather than pseudo-classed — `ContactSection` disables every field
 * while `loading`, and without this a field mid-submit could still be showing its red or
 * green offset shadow with no way left to act on it.
 */
export const fieldDisabled =
  'disabled:cursor-not-allowed disabled:border-transparent disabled:bg-disabled-bg ' +
  'disabled:text-disabled-text disabled:placeholder:text-disabled-text disabled:shadow-none';

/**
 * `px-3 py-2 md:px-4 md:py-3`, which is what five of the six copies said. The sixth —
 * `PostsSection`'s search field — said a flat `px-4 py-3`, so search boxes on Innlegg and in
 * the board portal had different padding at every width below `md`. Absorbed rather than
 * preserved.
 */
export const fieldPadding = 'px-3 py-2 md:px-4 md:py-3';

/** Room for the trailing affordance — the error glyph, or a search icon. */
export const fieldPaddingWithIcon = 'pr-10 md:pr-11';
