import * as React from 'react';

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: 'default' | 'muted' | 'inherit';
};

// Text links are the one interactive surface that does *not* lift. They underline, and that
// is the whole interaction — see docs/DESIGN_LANGUAGE.md.
const base =
  'font-body underline-offset-2 transition-colors duration-(--duration-fast) ease-standard ' +
  'hover:underline focus-visible:outline focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 focus-visible:outline-focus-ring ';

const variants = {
  default: 'text-darkblue hover:text-darkorange dark:text-orange dark:hover:text-yellow',
  muted: 'text-gray-neutral hover:text-darkblue dark:hover:text-orange',
  /**
   * No colour of its own — it borrows the one the surface has already settled on, and the
   * underline is the whole interaction.
   *
   * This is what a photo credit, a link inside a `darkblue` panel, or a link in rich text
   * needs, and the reason there is no fourth, fifth and sixth variant here instead. Those
   * surfaces have already had their foreground contrast-checked against their own fill — a
   * caption strip inherits white inside a `nyheter` panel and `darkestblue` everywhere else,
   * and the auth panels are white-on-darkblue — so borrowing that foreground is correct in
   * every theme by construction, where naming a colour here would be right on one fill and
   * wrong on the next. It is also why this variant adds no row to the contrast table: it
   * introduces no pairing that was not already there.
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

/**
 * The `inherit` treatment as a class string, for the links that have to be React Router's
 * `Link` rather than an `<a>` — same reasoning as `navLinkClasses` below.
 *
 * Spelled out rather than composed from `base` for the same reason `navLinkClassesBody` is:
 * this file keeps whole strings, not layered partials. `Link.test.tsx` pins that the two stay
 * in step, which is the cost of writing it twice.
 */
export const linkClassesInherit =
  'font-body underline-offset-2 transition-colors duration-(--duration-fast) ease-standard ' +
  'hover:underline focus-visible:outline focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 focus-visible:outline-focus-ring text-current';

/**
 * The header/footer navigation link treatment: an orange rule that wipes in from the left on
 * hover and stays put on the current page.
 *
 * Exported as a class string rather than a component because these links are React Router
 * `NavLink`s — they need router behaviour, not an `<a>`. `NavLink` sets `aria-current="page"`
 * on the active route, which is what drives the persistent state here.
 */
export const navLinkClasses =
  'relative inline-block px-0.5 py-1.5 font-heading no-underline ' +
  'transition-colors duration-(--duration-fast) ease-standard ' +
  'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left ' +
  'after:scale-x-0 after:bg-orange after:transition-transform ' +
  'after:duration-(--duration-base) after:ease-out hover:after:scale-x-100 ' +
  'motion-reduce:after:transition-none ' +
  'aria-[current=page]:text-orange aria-[current=page]:after:scale-x-100 ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ' +
  'focus-visible:outline-focus-ring';

/**
 * `navLinkClasses`, with `font-body` in place of `font-heading` — `Footer` is deliberately
 * body-font, unlike `Header`'s desktop nav which composes `navLinkClasses` as-is. A second whole
 * string rather than a `${navLinkClasses} font-body` composition at the call site: two `font-*`
 * utilities on one element are decided by emit order in the generated stylesheet, not by which
 * one a template literal happens to list last (the same reason `Dialog`'s size variants are a
 * lookup map of whole strings rather than layered partials) — this way exactly one `font-*`
 * utility ever appears in the string a caller uses.
 */
export const navLinkClassesBody =
  'relative inline-block px-0.5 py-1.5 font-body no-underline ' +
  'transition-colors duration-(--duration-fast) ease-standard ' +
  'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left ' +
  'after:scale-x-0 after:bg-orange after:transition-transform ' +
  'after:duration-(--duration-base) after:ease-out hover:after:scale-x-100 ' +
  'motion-reduce:after:transition-none ' +
  'aria-[current=page]:text-orange aria-[current=page]:after:scale-x-100 ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ' +
  'focus-visible:outline-focus-ring';
