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
