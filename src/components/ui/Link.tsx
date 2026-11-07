import * as React from 'react';

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: 'default' | 'muted' | 'inherit';
};

// Text links are blue and always underlined, so they read as links without a hover. Hover
// darkens the colour and thickens the underline; nothing moves. See docs/DESIGN_LANGUAGE.md.
const base =
  'font-body underline underline-offset-2 transition-colors duration-150 ' +
  'motion-reduce:transition-none hover:decoration-2 ' +
  'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus ';

const variants = {
  default: 'text-link hover:text-link-hover',
  muted: 'text-fg-muted hover:text-fg',
  /**
   * No colour of its own: it borrows the text colour of the surface it sits on. For photo
   * credits, links inside rich text, and links on a fixed panel whose ink is already checked.
   */
  inherit: 'text-current',
} as const;

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => (
    <a ref={ref} className={[base, variants[variant], className].join(' ')} {...props}>
      {children}
    </a>
  ),
);

Link.displayName = 'Link';

/** The `inherit` treatment as a class string, for React Router `Link`s. */
export const linkClassesInherit = base + variants.inherit;

/**
 * Navigation links in the header and footer: no underline in place (their position says they
 * are links), a 2px bar under the current page, and a colour-only hover. The bar is orange on
 * the current page and the text colour on hover.
 *
 * A class string rather than a component because these are React Router `NavLink`s, which set
 * `aria-current="page"` on the active route, and that attribute is what draws the bar.
 */
const navBase =
  'inline-flex min-h-11 items-center border-b-2 border-transparent px-1 no-underline ' +
  'transition-colors duration-150 motion-reduce:transition-none ' +
  'hover:border-current aria-[current=page]:border-primary ' +
  'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus';

export const navLinkClasses = `${navBase} font-heading font-semibold`;

/** `navLinkClasses` in the body font, for the footer's link columns. */
export const navLinkClassesBody = `${navBase} font-body`;
