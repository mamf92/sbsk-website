import { type PortableTextComponents } from '@portabletext/react';
import { Link } from 'react-router-dom';
import { PostImageComponent } from './postsImageComponent';

// Sanity's Studio-side `rule.uri()` validation (eventType.ts, postType.ts) does not reach
// documents written directly against the Content Lake API, so a `javascript:` URL is only
// stopped here, at render time.
function isSafeExternalUrl(url: unknown): url is string {
  return typeof url === 'string' && /^https?:\/\//i.test(url);
}

// Every route the site actually serves — see the router in `src/main.tsx`. Kept in sync by
// hand, the same way CLAUDE.md asks every Norwegian-slug link to be.
const KNOWN_ROUTES = new Set([
  '/',
  '/kalender',
  '/board-game-masters',
  '/våre-spill',
  '/om-oss',
  '/kontakt-oss',
  '/bli-medlem',
  '/arrangementer',
  '/våre-partnere',
  '/lag-medlemsprofil',
  '/login',
  '/medlemsportal',
  '/styreportal',
]);

function isKnownInternalPath(path: string): boolean {
  return KNOWN_ROUTES.has(path) || path.startsWith('/arrangementer/');
}

// The router's basename (`VITE_BASE`, "/sbsk-website/" on Pages) is not part of the paths
// `<Link>` expects — React Router prepends it — but it is part of the site's own deployed URL,
// which is exactly what an editor pasting an internal link tends to have on their clipboard.
const ROUTER_BASE = (import.meta.env.VITE_BASE || '/').replace(/\/+$/, '');

/** The route to link to, or `null` if `url` doesn't resolve to one this site actually serves. */
function resolveKnownRoute(url: string): string | null {
  let path: string;
  try {
    // `.pathname` percent-encodes non-ASCII characters, which every Norwegian slug here has.
    path = decodeURIComponent(new URL(url, window.location.href).pathname);
  } catch {
    return null;
  }

  if (ROUTER_BASE && path.startsWith(ROUTER_BASE)) {
    path = path.slice(ROUTER_BASE.length) || '/';
  }

  return isKnownInternalPath(path) ? path : null;
}

export const components: PortableTextComponents = {
  types: {
    image: PostImageComponent,
  },
  block: {
    normal: ({ children }) => <p className="font-body text-base">{children}</p>,
    // `clear-both`: a heading has to start its own line below a pending float rather than
    // squeeze beside it — whichever side an editor floated an inline image to (`postsImageComponent.tsx`),
    // and below the carousel's own left float (`PostsSection.tsx`) once a post has one.
    h2: ({ children }) => (
      <h2 className="font-heading clear-both text-2xl font-bold">{children}</h2>
    ),
    h3: ({ children }) => <h3 className="font-heading clear-both text-xl font-bold">{children}</h3>,
  },
  list: {
    // Lists don't need clearing: their `pl-5` marker inset doesn't collide with a float on
    // either side, so a bullet list is free to wrap the same way a paragraph does.
    bullet: ({ children }) => <ul className="list-disc pl-5">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal pl-5">{children}</ol>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    underline: ({ children }) => <u className="underline">{children}</u>,
    link: ({ value, children }) => {
      if (!isSafeExternalUrl(value?.url)) return <>{children}</>;
      return (
        <a href={value.url} target="_blank" rel="noopener noreferrer" className="underline">
          {children}
        </a>
      );
    },
    internalLink: ({ value, children }) => {
      const path = typeof value?.url === 'string' ? resolveKnownRoute(value.url) : null;
      if (!path) return <>{children}</>;
      return <Link to={path}>{children}</Link>;
    },
  },
};
