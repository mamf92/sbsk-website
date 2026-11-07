import * as React from 'react';

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  /** Marks the field as optional with "(valgfritt)". Required fields carry no mark. */
  optional?: boolean;
};

/**
 * The label above a field. Every field has one, visible, above it (decision 8). Optional
 * fields are the marked ones, because on these forms most fields are required.
 */
export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { optional = false, className = '', children, ...props },
  ref,
) {
  return (
    <label
      ref={ref}
      className={['font-body text-fg text-sm font-semibold', className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
      {optional ? <span className="text-fg-muted font-normal"> (valgfritt)</span> : null}
    </label>
  );
});
