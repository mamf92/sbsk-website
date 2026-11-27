/**
 * MVP launch ships with no member or board portal — see #213. Signing in is only possible
 * through Sanity Studio (`/studio`) for this round; the login/register/member/board routes and
 * the header's login button stay in the codebase, gated off, so the portal can be switched back
 * on later without redoing the routing.
 *
 * Unit tests and the Playwright smoke suite set `VITE_ENABLE_MEMBER_PORTAL=true` so the gated
 * code keeps being exercised even while production hides it.
 */
export const memberPortalEnabled = import.meta.env.VITE_ENABLE_MEMBER_PORTAL === 'true';

/**
 * The portal routes without the portal's links: /login, /to-faktor and the two portals answer
 * by URL, but the header shows no login button. Lets the board sign in, enrol their second
 * factor and use /styreportal on the live site before members are invited (phase 2), without
 * advertising a login nobody else can use yet. Always on when the full portal is.
 */
export const portalRoutesEnabled =
  memberPortalEnabled || import.meta.env.VITE_ENABLE_PORTAL_ROUTES === 'true';

/**
 * The Kontakt oss form writes to `public.contact_messages`, and nothing reads that table:
 * the board has no portal access yet (#213) and no forwarding exists yet (#133), so a message
 * sent through the form reaches nobody. A form that silently discards what someone writes is
 * worse than no form, so the page publishes the club's address instead until one of those two
 * lands — see #254.
 *
 * Gated rather than deleted, on the same pattern and for the same reason as the portal above:
 * the form, its schema, its honeypot and its table all stay, and it comes back by flipping the
 * flag. Unit tests and the Playwright smoke suite set `VITE_ENABLE_CONTACT_FORM=true` so the
 * gated code keeps being exercised while production hides it.
 */
export const contactFormEnabled = import.meta.env.VITE_ENABLE_CONTACT_FORM === 'true';

/**
 * The language toggle and English event pages (phase 1, `docs/plans/01-event-pages.md` WP2).
 * On in production since the event pages were fully translated (#185); the toggle only shows on
 * pages that exist in English, so it never switches half a page. With the flag off the site is
 * always Norwegian, whatever is stored or whatever the browser asks for. Unit tests and the
 * Playwright config set it on.
 */
export const i18nEnabled = import.meta.env.VITE_ENABLE_I18N === 'true';

/**
 * The new front page, calendar overview and «Alle arrangementer» (front page and calendar
 * revamp, 27 Nov 2026). Off on the live site; on in the `/redesign/` preview, which
 * `.github/actions/build-site` builds from the same `main` checkout with this flag set. Going
 * live means setting it in the live build, then deleting the old Home and Calendar code.
 * Unit tests render the new pages directly, so they do not need it; the Playwright `redesign`
 * project builds with it on.
 */
export const redesignEnabled = import.meta.env.VITE_ENABLE_REDESIGN === 'true';
