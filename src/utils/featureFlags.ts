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
