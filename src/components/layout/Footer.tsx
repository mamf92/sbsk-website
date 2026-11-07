import { NavLink } from 'react-router-dom';
import { SocialIcon } from 'react-social-icons';
import { DiceLogo } from '../ui/DiceLogo';
import { Link } from '../ui/Link';
import { navLinkClassesBody } from '../ui/linkClasses';
import { Button } from '../ui/Buttons';
import { useMotion } from '../../hooks/motion/MotionContext';
import { useGoHome } from '../../hooks/useGoHome';
import { CLUB_EMAIL, CLUB_EMAIL_HREF } from '../../utils/contact';

const CLUB_LINKS = [
  { to: '/bli-medlem', label: 'Bli medlem' },
  { to: '/kalender', label: 'Kalender' },
  { to: '/våre-spill', label: 'Våre spill' },
  { to: '/om-oss', label: 'Om oss' },
  { to: '/kontakt-oss', label: 'Kontakt oss' },
] as const;

// Board Game Masters and Partnere moved here from the header (decision 6).
const MORE_LINKS = [
  { to: '/board-game-masters', label: 'Board Game Masters' },
  { to: '/våre-partnere', label: 'Våre partnere' },
  { to: '/våre-spill', label: 'Kjøp spill med rabatt' },
  { to: '/kontakt-oss', label: 'Bli støttespiller' },
] as const;

const footerLink = `${navLinkClassesBody} min-h-9 text-fg-muted hover:text-fg`;

/**
 * The second navy band: the club's name and contact, two link columns and the Facebook group.
 * `on-dark` re-points the roles, as in the header.
 */
export default function Footer() {
  const { goHome, handleHomeLinkClick } = useGoHome();
  const { reduced, toggleReducedMotion } = useMotion();

  return (
    <footer className="bg-footer on-dark text-fg font-body w-full">
      <div className="max-w-shell mx-auto flex w-full flex-col gap-10 px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            {/* The dice and the name are two separate controls (two targets on one box failed
                WCAG 2.5.8, #222); both go home. */}
            <div className="flex items-center gap-3">
              <DiceLogo size={44} onClick={goHome} />
              <NavLink
                to="/"
                end
                onClick={handleHomeLinkClick}
                className="font-heading text-fg focus-visible:outline-focus text-h4 font-bold no-underline focus-visible:outline-3 focus-visible:outline-offset-2"
              >
                Stavanger Brettspillklubb
              </NavLink>
            </div>
            <p className="text-fg-muted">
              Kontakt oss:{' '}
              <Link href={CLUB_EMAIL_HREF} className="text-fg">
                {CLUB_EMAIL}
              </Link>
            </p>
          </div>

          <nav aria-labelledby="footer-club-heading" className="flex flex-col items-start gap-1">
            <h2 id="footer-club-heading" className="font-heading text-fg mb-2 text-base font-bold">
              Klubben
            </h2>
            {CLUB_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={footerLink}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <nav aria-labelledby="footer-more-heading" className="flex flex-col items-start gap-1">
            <h2 id="footer-more-heading" className="font-heading text-fg mb-2 text-base font-bold">
              Mer fra klubben
            </h2>
            {MORE_LINKS.map((link) => (
              <NavLink key={link.label} to={link.to} className={footerLink}>
                {link.label}
              </NavLink>
            ))}
            <a
              href="https://www.outland.no/"
              target="_blank"
              rel="noopener noreferrer"
              className={footerLink}
            >
              Outland.no
            </a>
          </nav>

          <div className="flex flex-col items-start gap-3">
            <h2 className="font-heading text-fg text-base font-bold">Følg oss</h2>
            <SocialIcon
              url="https://www.facebook.com/groups/1699569943629396"
              label="SBSK på Facebook"
              bgColor="#fff"
              fgColor="#002f5f"
              style={{ height: '2rem', width: '2rem' }}
            />
          </div>
        </div>

        {/* The motion switch retires with the rest of the custom motion system in the cleanup
            step (decision 3: reduced motion follows the OS). Until then it keeps working. */}
        <div className="border-border flex flex-col items-center gap-4 border-t pt-6 sm:flex-row sm:justify-between">
          <p className="text-fg-muted text-sm">&copy; 2026 Stavanger Brettspillklubb</p>
          <Button
            variant="ghost"
            size="sm"
            icon={reduced ? 'block' : 'motion'}
            aria-pressed={reduced}
            onClick={toggleReducedMotion}
          >
            Reduser animasjoner
          </Button>
        </div>
      </div>
    </footer>
  );
}
