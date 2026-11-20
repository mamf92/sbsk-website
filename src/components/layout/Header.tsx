import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Buttons';
import { NavMenuButton } from '../ui/NavMenuButton';
import { IconButton } from '../ui/IconButton';
import { ProfileMenu } from '../ui/ProfileMenu';
import { DiceLogo } from '../ui/DiceLogo';
import { navLinkClasses } from '../ui/Link';
import { buttonClasses } from '../ui/buttonClasses';
import { useTheme } from '../../hooks/theme/ThemeContext';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/authContext/authContext';
import { useGoHome } from '../../hooks/useGoHome';
import { portalRoutesEnabled } from '../../utils/featureFlags';
import { LanguageToggle } from '../ui/LanguageToggle';
import { useIsTranslatedRoute, useLocale } from '../../hooks/locale/useLocale';

const desktopNavLink = `${navLinkClasses} text-sm`;

const mobileNavLink =
  'relative block w-full py-[15px] px-6 border-t border-white/12 ' +
  'font-heading no-underline text-lg ' +
  'transition-colors duration-(--duration-fast) ease-standard ' +
  'after:absolute after:left-6 after:right-6 after:bottom-[9px] after:h-0.5 after:origin-left ' +
  'after:scale-x-0 after:bg-orange after:transition-transform ' +
  'after:duration-(--duration-base) after:ease-out hover:after:scale-x-100 ' +
  'motion-reduce:after:transition-none ' +
  'aria-[current=page]:text-orange aria-[current=page]:after:scale-x-100 ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ' +
  'focus-visible:outline-focus-ring';

export default function Header() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { locale, setLocale } = useLocale();
  const showLanguageToggle = useIsTranslatedRoute();
  const navigate = useNavigate();
  const { goHome, handleHomeLinkClick } = useGoHome();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout, isAuthenticated, isAdmin, user } = useAuth();
  // Greeting uses the first name only: the full name ("Martin Andreas Michael") made the button
  // the widest control in the header.
  const firstName = user?.name?.trim().split(/\s+/)[0];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) setIsMobileMenuOpen(false);
    };
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  return (
    <header
      lang="nb"
      className="bg-darkblue surface-dark font-heading relative z-1100 w-full text-white print:hidden"
    >
      <div className="max-w-shell mx-auto flex items-center justify-between gap-5 px-6 py-3.5">
        {/* Logo group — dice + wordmark, both navigate home. Clicking either while already on
            home scrolls back to the top instead of re-navigating; see `useGoHome`. */}
        <div className="flex items-center gap-2.5">
          <DiceLogo size={40} onClick={goHome} />
          <NavLink
            to="/"
            end
            onClick={handleHomeLinkClick}
            className="font-heading tracking-heading focus-visible:outline-focus-ring font-bold text-white no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {/* Below `xl` the bar is tight (the signed-in profile button joins the six links at `lg`), so only the acronym shows. The full name stays the
                link's accessible name at every width: the visible text is aria-hidden and a
                screen-reader-only copy carries the name, which also contains what a voice user
                sees on desktop. The two-line stack is the height of the 40px dice. */}
            <span className="sr-only">Stavanger Brettspillklubb</span>
            <span aria-hidden="true" className="text-h4 xl:hidden">
              SBSK
            </span>
            <span aria-hidden="true" className="hidden text-base leading-tight xl:flex xl:flex-col">
              <span>Stavanger</span>
              <span>Brettspillklubb</span>
            </span>
          </NavLink>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-[26px] lg:flex" aria-label="Hovedmeny">
          <NavLink to="/" end className={desktopNavLink}>
            Hjem
          </NavLink>
          <NavLink to="/kalender" className={desktopNavLink}>
            Kalender
          </NavLink>
          <NavLink to="/board-game-masters" className={desktopNavLink}>
            Board Game Masters
          </NavLink>
          <NavLink to="/våre-spill" className={desktopNavLink}>
            Våre spill
          </NavLink>
          <NavLink to="/om-oss" className={desktopNavLink}>
            Om oss
          </NavLink>
          <NavLink to="/kontakt-oss" className={desktopNavLink}>
            Kontakt oss
          </NavLink>
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2.5">
          {/* Icon only. The name stays "Mørk modus" and `aria-pressed` carries the state, so a
              screen reader hears "Mørk modus, toggle button, pressed" rather than a name that
              changes under it. `title` gives pointer users the same words as a tooltip. With no
              visible text there is nothing for WCAG 2.5.3 Label in Name to match against, which
              is what forced the old "DM"/"LM" lettering (#222). */}
          <IconButton
            onClick={toggleDarkMode}
            variant="toggle"
            icon={isDarkMode ? 'sun' : 'moon'}
            label="Mørk modus"
            aria-pressed={isDarkMode}
            title={isDarkMode ? 'Bytt til lys modus' : 'Bytt til mørk modus'}
          />

          {/* Only on pages that exist in English, and only with VITE_ENABLE_I18N on: a toggle
              that changes nothing on the page would read as broken. Below `sm` the bar has no
              room for a third control at 320px, so there it lives at the top of the menu. */}
          {showLanguageToggle && (
            <span className="hidden sm:contents">
              <LanguageToggle locale={locale} onChange={setLocale} />
            </span>
          )}

          {/* Login / profile — desktop only. Gated behind #213: no member/board portal for the
              MVP launch, so there is no login option to show at all. */}
          {portalRoutesEnabled && isAuthenticated ? (
            <ProfileMenu
              className="hidden lg:block"
              label={firstName ? `Hei, ${firstName}` : 'Min profil'}
              isAdmin={isAdmin}
              onLogout={() => {
                logout();
                navigate('/');
              }}
            />
          ) : (
            portalRoutesEnabled && (
              <NavLink
                to="/login"
                className={buttonClasses({
                  variant: 'primary',
                  size: 'md',
                  className: 'hidden lg:inline-flex',
                })}
              >
                Logg inn
              </NavLink>
            )
          )}

          <NavMenuButton
            open={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden"
          />
        </div>
      </div>

      {/* Mobile nav — collapses on `grid-template-rows: 0fr → 1fr`, the same technique and the
          same clock `Card`'s panel uses, and for the reason its comment gives: the max-height
          version this replaced silently clipped anything taller than its magic number. 460px
          was one nav item from doing exactly that — the authenticated button row alone puts it
          within ~60px — and the number had no way to know.

          `inert` is still what removes the closed panel's links from the tab order; a 0fr row
          leaves them focusable on its own. */}
      <nav
        inert={!isMobileMenuOpen}
        className={`bg-darkestblue grid transition-[grid-template-rows] duration-(--duration-slow) ease-out motion-reduce:transition-none lg:hidden ${
          isMobileMenuOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
        aria-label="Mobilmeny"
      >
        <div className="flex flex-col overflow-hidden">
          {portalRoutesEnabled && isAuthenticated && (
            <div className="flex flex-wrap gap-2 border-t border-white/12 px-6 py-[15px]">
              {isAdmin && (
                <Button
                  variant="primary"
                  size="md"
                  icon="right"
                  onClick={() => {
                    closeMobileMenu();
                    navigate('/styreportal');
                  }}
                >
                  Styreportal
                </Button>
              )}
              <Button
                variant="primary"
                size="md"
                icon="right"
                onClick={() => {
                  closeMobileMenu();
                  navigate('/medlemsportal');
                }}
              >
                Min side
              </Button>
              <Button
                variant="secondary"
                size="md"
                icon="right"
                onClick={() => {
                  logout();
                  closeMobileMenu();
                  navigate('/');
                }}
              >
                Logg ut
              </Button>
            </div>
          )}
          {portalRoutesEnabled && !isAuthenticated && (
            <div className="flex border-t border-white/12 px-6 py-[15px]">
              <NavLink
                to="/login"
                onClick={closeMobileMenu}
                className={buttonClasses({ variant: 'primary', size: 'md' })}
              >
                Logg inn
              </NavLink>
            </div>
          )}
          {showLanguageToggle && (
            <div className="flex border-t border-white/12 px-6 py-[15px] sm:hidden">
              <LanguageToggle locale={locale} onChange={setLocale} />
            </div>
          )}
          <NavLink to="/" end className={mobileNavLink} onClick={closeMobileMenu}>
            Hjem
          </NavLink>
          <NavLink to="/kalender" className={mobileNavLink} onClick={closeMobileMenu}>
            Kalender
          </NavLink>
          <NavLink to="/board-game-masters" className={mobileNavLink} onClick={closeMobileMenu}>
            Board Game Masters
          </NavLink>
          <NavLink to="/våre-spill" className={mobileNavLink} onClick={closeMobileMenu}>
            Våre spill
          </NavLink>
          <NavLink to="/om-oss" className={mobileNavLink} onClick={closeMobileMenu}>
            Om oss
          </NavLink>
          <NavLink to="/kontakt-oss" className={mobileNavLink} onClick={closeMobileMenu}>
            Kontakt oss
          </NavLink>
        </div>
      </nav>
    </header>
  );
}
