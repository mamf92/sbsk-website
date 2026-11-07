import * as React from 'react';
import { linkClasses, type LinkVariant } from './linkClasses';

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: LinkVariant;
};

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => (
    <a ref={ref} className={[linkClasses(variant), className].join(' ')} {...props}>
      {children}
    </a>
  ),
);

Link.displayName = 'Link';
