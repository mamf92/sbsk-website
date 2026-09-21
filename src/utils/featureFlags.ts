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
