declare module 'react-router-hash-link' {
  import * as React from 'react';
  import { LinkProps, NavLinkProps } from 'react-router-dom';

  export interface HashLinkProps extends LinkProps {
    smooth?: boolean;
    scroll?: (element: HTMLElement) => void;
  }

  export interface NavHashLinkProps extends NavLinkProps {
    smooth?: boolean;
    scroll?: (element: HTMLElement) => void;
  }

  export const HashLink: React.FC<HashLinkProps>;
  export const NavHashLink: React.FC<NavHashLinkProps>;
}
