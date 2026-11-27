import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import ArrowRight from '../../assets/icons/arrows/arrowright.svg?react';

/**
 * A bold text link with a trailing arrow, for «Hele kalenderen →» beside a section heading.
 * Takes the colour of the text around it, so it works on white, cream and navy.
 */
export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="font-heading focus-visible:outline-focus-ring inline-flex items-center gap-1.5 text-sm font-bold whitespace-nowrap underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {children}
      <ArrowRight aria-hidden="true" className="h-4 w-4 fill-current" />
    </Link>
  );
}

TextLink.displayName = 'TextLink';
