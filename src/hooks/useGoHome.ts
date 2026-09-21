import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motionIsReduced } from '../utils/motion';

/**
 * The two ways a visitor asks to go home — the dice and the wordmark, in both the header and
 * the footer — and the two different things that should happen (#253).
 *
 * Changing route is handled by `<ScrollRestoration />` in the shell, which jumps to the top as
 * the new page renders. Deliberately a jump and not a smooth scroll: a smooth scroll on a
 * route change animates *after* the new page has painted, so it reads as the new page sliding
 * around rather than as a transition, and it delays the content by the length of the animation.
 *
 * Clicking home while already on home is the case that wants smoothness, because there is no
 * new page — the scroll *is* the whole response to the click, and without it nothing happens
 * at all. That is the case this hook owns.
 */
export function useGoHome() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const atHome = pathname === '/';

  const scrollToTop = useCallback(() => {
    // Read the preference at click time rather than through a hook: the footer's toggle can
    // flip it between renders, and this is the same reason `DiceLogo` reads `motionIsReduced`
    // the way it does.
    window.scrollTo({ top: 0, behavior: motionIsReduced() ? 'auto' : 'smooth' });
  }, []);

  /** For a `<button>` that has no navigation of its own — the dice. */
  const goHome = useCallback(() => {
    if (atHome) scrollToTop();
    else navigate('/');
  }, [atHome, navigate, scrollToTop]);

  /**
   * For a `<NavLink to="/">` — the wordmark. The router handles a real navigation; this only
   * takes over when the click would not be one. Modified and non-primary clicks are left
   * alone, so cmd/ctrl-click still opens home in a new tab from the home page itself.
   */
  const handleHomeLinkClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (!atHome || event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      event.preventDefault();
      scrollToTop();
    },
    [atHome, scrollToTop],
  );

  return { atHome, goHome, handleHomeLinkClick };
}
