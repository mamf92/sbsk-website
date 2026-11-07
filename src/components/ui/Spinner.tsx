const sizes = {
  sm: 'size-4 border-2',
  md: 'size-6 border-[3px]',
} as const;

/**
 * The one loading glyph: a ring with a gap that turns. Decorative on purpose. A busy `Button`
 * carries the state in `aria-busy` and `LoadingIndicator` in its `role="status"` label, so the
 * spinner itself never announces anything. Under reduced motion it keeps turning, slowly, so
 * the page still visibly says "working".
 */
export function Spinner({
  size = 'sm',
  className = '',
}: {
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-testid="spinner"
      className={[
        'inline-block shrink-0 animate-spin rounded-full border-current border-r-transparent',
        'motion-reduce:[animation-duration:2.4s]',
        sizes[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
