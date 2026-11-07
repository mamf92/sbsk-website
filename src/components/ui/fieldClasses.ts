/**
 * The field look from decision 8: a tinted fill, square corners, and a 2px line along the
 * bottom. The line turns to the focus colour on focus (navy on light, orange on dark), on top
 * of the shared focus outline, and turns red when the field is invalid. `Input`, `Textarea` and
 * `Select` read these; nothing else should.
 */
export const fieldBase =
  'w-full min-h-11 rounded-none border-0 border-b-2 bg-surface-muted px-3 py-2 ' +
  'font-body text-base text-fg placeholder:text-fg-muted ' +
  'transition-colors duration-150 motion-reduce:transition-none ' +
  'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus';

/** The bottom line in each state. Exactly one of these is applied. */
export const fieldLine = {
  rest: 'border-border-strong focus:border-focus',
  invalid: 'border-danger-text',
  valid: 'border-success-text focus:border-focus',
} as const;

export function fieldLineFor({ invalid = false, valid = false } = {}) {
  if (invalid) return fieldLine.invalid;
  if (valid) return fieldLine.valid;
  return fieldLine.rest;
}

/** The native `disabled` attribute greys the field out and drops the line. */
export const fieldDisabled =
  'disabled:cursor-not-allowed disabled:border-border disabled:text-fg-muted';

/** Room for a trailing glyph: the error or success mark, a search icon, a select chevron. */
export const fieldPaddingWithIcon = 'pr-10';
