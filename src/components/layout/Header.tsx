import { Link as RouterLink, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/Buttons';
import { NavMenuButton } from '../ui/NavMenuButton';
import { DiceLogo } from '../ui/DiceLogo';
import { buttonClasses } from '../ui/buttonClasses';
import { navLinkClasses } from '../ui/linkClasses';
import { useTheme } from '../../hooks/theme/ThemeContext';
import { useAuth } from '../../hooks/authContext/authContext';
import { useGoHome } from '../../hooks/useGoHome';
import { memberPortalEnabled } from '../../utils/featureFlags';

/** The four main sections (decision 6). Board Game Masters and Partnere live in the footer. */
const NAV_ITEMS = [
  { to: '/kalender', label: 'Kalender' },
  { to: '/våre-spill', label: 'Våre spill' },
  { to: '/om-oss', label: 'Om oss' },
  { to: '/kontakt-oss', label: 'Kontakt oss' },
] as const;

const desktopNavLink = `${navLinkClasses} text-base`;

// Full-width rows in the mobile drop-down list. The current page is orange and bold, which
// #f29d35 carries at 7.7:1 on the footer navy.
const mobileNavLink =
  'flex min-h-12 w-full items-center border-t border-border px-6 font-heading text-lg ' +
  'no-underline transition-colors duration-150 hover:bg-surface-muted ' +
  'motion-reduce:transition-none aria-[current=page]:font-bold aria-[current=page]:text-primary ' +
  'focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-focus';

// The profile menu's rows, on the same navy as the mobile list.
const menuItem =
  'flex min-h-11 w-full items-center px-4 text-left font-body no-underline ' +
  'transition-colors duration-150 hover:bg-surface-muted motion-reduce:transition-none ' +
  'focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-focus';

/**
 * The navy bar (decision 6): the dice and the club's name, four links, a sun/moon theme
 * toggle, a quiet "Logg inn" link and the one orange action, "Bli medlem". Below `lg` the links
 * fold into a full-width list under the bar.
 *
 * `on-dark` re-points the colour roles for the whole subtree, so every link, button and focus
 * ring in here reads on navy in both themes without a variant of its own.
 */
export default function Header() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const { goHome, handleHomeLinkClick } = useGoHome();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logout, isAuthenticated, isAdmin, user } = useAuth();

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

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsDropdownOpen(false);
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) setIsDropdownOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isDropdownOpen]);

  function signOut() {
    logout();
    setIsDropdownOpen(false);
    closeMobileMenu();
    navigate('/');
  }

  return (
    <header className="bg-header on-dark text-fg font-heading relative z-1100 w-full">
      <div className="max-w-shell mx-auto flex min-h-16 items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
        {/* Dice and name both go home; on home they scroll back to the top (see `useGoHome`). */}
        <div className="flex items-center gap-2.5">
          <DiceLogo size={36} onClick={goHome} />
          <NavLink
            to="/"
            end
            onClick={handleHomeLinkClick}
            className="font-heading text-fg focus-visible:outline-focus text-lg font-bold no-underline focus-visible:outline-3 focus-visible:outline-offset-2"
          >
            <span className="hidden xl:inline">Stavanger Brettspillklubb</span>
            <span className="xl:hidden">SBSK</span>
          </NavLink>
        </div>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Hovedmeny">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={desktopNavLink}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Icon only, so the name says what pressing it does. It starts from the OS setting
              (see `src/utils/theme.ts`) until the visitor picks one. */}
          <Button
            onClick={toggleDarkMode}
            variant="ghost"
            size="md"
            icon={isDarkMode ? 'sun' : 'moon'}
            className="w-11 px-0"
            aria-label={isDarkMode ? 'Bytt til lyst tema' : 'Bytt til mørkt tema'}
          />

          {memberPortalEnabled &&
            (isAuthenticated ? (
              <div ref={dropdownRef} className="relative hidden lg:block">
                <Button
                  variant="ghost"
                  size="md"
                  icon="down"
                  aria-expanded={isDropdownOpen}
                  aria-controls="profile-menu"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  {user?.name || 'Min profil'}
                </Button>
                <div
                  id="profile-menu"
                  className={`bg-footer shadow-overlay-soft absolute top-full right-0 z-50 mt-1 flex w-48 flex-col py-1 ${isDropdownOpen ? '' : 'hidden'}`}
                >
                  {isAdmin && (
                    <RouterLink
                      to="/styreportal"
                      className={menuItem}
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Styreportal
                    </RouterLink>
                  )}
                  <RouterLink
                    to="/medlemsportal"
                    className={menuItem}
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Profil
                  </RouterLink>
                  <button type="button" className={`${menuItem} cursor-pointer`} onClick={signOut}>
                    Logg ut
                  </button>
                </div>
              </div>
            ) : (
              // Wrapped: `hidden` and the link's own `inline-flex` on one element would be decided
              // by stylesheet order, not by the breakpoint.
              <span className="hidden lg:block">
                <NavLink to="/login" className={desktopNavLink}>
                  Logg inn
                </NavLink>
              </span>
            ))}

          <RouterLink
            to="/bli-medlem"
            className={buttonClasses({ variant: 'primary', size: 'sm', className: 'max-xs:px-2' })}
          >
            Bli medlem
          </RouterLink>

          <NavMenuButton
            open={isMobileMenuOpen}
            aria-controls="mobile-menu"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden"
          />
        </div>
      </div>

      {/* The drop-down list below `lg`. It opens on `grid-template-rows: 0fr → 1fr`, so it fits
          any number of rows, and `inert` keeps the closed list out of the tab order. */}
      <nav
        id="mobile-menu"
        inert={!isMobileMenuOpen}
        className={`bg-footer grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none lg:hidden ${
          isMobileMenuOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
        aria-label="Mobilmeny"
      >
        <div className="flex flex-col overflow-hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={mobileNavLink} onClick={closeMobileMenu}>
              {item.label}
            </NavLink>
          ))}
          {memberPortalEnabled &&
            (isAuthenticated ? (
              <>
                {isAdmin && (
                  <NavLink to="/styreportal" className={mobileNavLink} onClick={closeMobileMenu}>
                    Styreportal
                  </NavLink>
                )}
                <NavLink to="/medlemsportal" className={mobileNavLink} onClick={closeMobileMenu}>
                  Profil
                </NavLink>
                <button
                  type="button"
                  className={`${mobileNavLink} cursor-pointer`}
                  onClick={signOut}
                >
                  Logg ut
                </button>
              </>
            ) : (
              <NavLink to="/login" className={mobileNavLink} onClick={closeMobileMenu}>
                Logg inn
              </NavLink>
            ))}
        </div>
      </nav>
    </header>
  );
}
