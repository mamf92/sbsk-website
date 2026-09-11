import { NavLink, useNavigate } from 'react-router-dom';
import { SocialIcon } from 'react-social-icons';
import { DiceLogo } from '../ui/DiceLogo';
import { Link, navLinkClassesBody } from '../ui/Link';
import { Button } from '../ui/Buttons';
import { useMotion } from '../../hooks/motion/MotionContext';

export default function Footer() {
  const navigate = useNavigate();
  const { reduced, toggleReducedMotion } = useMotion();

  return (
    <footer className="bg-darkblue surface-dark font-body max-xs:p-4 flex w-full flex-col p-8 text-white">
      <div className="bg-darkestblue max-xs:px-4 flex justify-center px-6 py-16">
        <div className="max-w-shell flex w-full flex-col gap-6">
          <div className="flex flex-col gap-8 md:flex-row md:flex-wrap lg:flex-nowrap lg:gap-10">
            <div className="flex flex-1 flex-col justify-between gap-6 md:min-w-full md:items-center md:gap-2 lg:min-w-auto lg:items-start lg:justify-around">
              <div className="flex items-center justify-start gap-4">
                {/* The dice used to be a <button> wrapped in a <NavLink>, which is invalid
                    nesting and put two interactive targets on the exact same 48px box — the
                    reason Lighthouse failed target-size (WCAG 2.5.8) here (#222). One control
                    now, navigating on click the way the header's dice already does. */}
                <div className="flex max-w-12.25 min-w-12.25">
                  <DiceLogo size={48} onClick={() => navigate('/')} />
                </div>
                <div>
                  <p className="font-heading text-h2 font-bold">Stavanger Brettspillklubb</p>
                </div>
              </div>
              <div>
                <p>Kontakt oss:</p>
                <Link href="mailto:hei@sbsk.no" variant="inherit" className="underline">
                  hei@sbsk.no
                </Link>
              </div>
            </div>
            <div className="flex flex-1 flex-row">
              <nav
                aria-labelledby="footer-member-nav-heading"
                className="flex flex-1 flex-col items-start gap-4"
              >
                <h2 id="footer-member-nav-heading" className="text-base">
                  <NavLink to="/bli-medlem" className={`${navLinkClassesBody} font-bold`}>
                    Bli medlem nå!
                  </NavLink>
                </h2>
                <NavLink to="/kalender" className={navLinkClassesBody}>
                  Kalender
                </NavLink>
                <NavLink to="/våre-spill" className={navLinkClassesBody}>
                  Våre spill
                </NavLink>
                <NavLink to="/om-oss" className={navLinkClassesBody}>
                  Om oss
                </NavLink>
                <NavLink to="/kontakt-oss" className={navLinkClassesBody}>
                  Kontakt oss
                </NavLink>
              </nav>
              <nav
                aria-labelledby="footer-partner-nav-heading"
                className="flex flex-1 flex-col items-start gap-4"
              >
                <h2 id="footer-partner-nav-heading" className="text-base">
                  <NavLink to="/våre-partnere" className={`${navLinkClassesBody} font-bold`}>
                    Våre partnere
                  </NavLink>
                </h2>
                <Link
                  href="https://www.outland.no/"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="inherit"
                  className="underline"
                >
                  Outland.no
                </Link>
                <NavLink to="/våre-spill" className={navLinkClassesBody}>
                  Kjøp spill med rabatt
                </NavLink>
                <NavLink to="/kontakt-oss" className={navLinkClassesBody}>
                  Bli støttespiller
                </NavLink>
              </nav>
            </div>
            <div className="flex flex-1 flex-col flex-nowrap items-start gap-2">
              <p className="font-bold">Følg oss: </p>
              <SocialIcon
                url="https://www.facebook.com/groups/1699569943629396"
                bgColor="#fff"
                fgColor="#002f5f"
                style={{ height: '1.5rem', width: '1.5rem' }}
              />
            </div>
          </div>
          {/* The motion preference lives here rather than beside the theme toggle in the
              header for two reasons. The header's right cluster already carries three controls
              at 320px, and — the deciding one — WCAG 2.5.3 forces a control there into a
              two-letter abbreviation the accessible name then has to start with, which is what
              `Header.tsx`'s LM/DM comment is about. A footer control can say what it does, so
              its visible label and its accessible name are simply the same string.

              `secondary` rather than `toggle`: the footer's inner panel is `darkestblue` in
              both themes, and `toggle`'s own fill is `darkestblue` in light mode — the button
              vanished into the panel and read as a line of text. `outline` has the mirror
              problem here, since its hover fill is the panel's colour too. `darkorange` on
              `darkestblue` is a fill this surface can actually carry, at the 4.99:1 the
              foreground table already records.

              `aria-pressed` rather than a checkbox: this is a control that stays down, and
              `Button variant="toggle"` is the system's existing shape for exactly that. It is
              only ever a *preference* — the site already follows `prefers-reduced-motion` on
              its own, so this is for visitors whose OS is not set, and for anyone who wants
              the opposite of what it says. */}
          <div className="flex flex-col items-center gap-4 border-t pt-6">
            <Button
              variant="secondary"
              size="sm"
              icon="motion"
              aria-pressed={reduced}
              onClick={toggleReducedMotion}
            >
              Reduser animasjoner
            </Button>
            <p className="text-center text-sm">
              &copy; 2026 Stavanger Brettspillklubb. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
