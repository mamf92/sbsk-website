import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Buttons';
import { NavMenuButton } from '../ui/NavMenuButton';
import { DiceLogo } from '../ui/DiceLogo';
import { navLinkClasses } from '../ui/Link';
import { useTheme } from '../../hooks/theme/ThemeContext';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/authContext/authContext';

const desktopNavLink = `${navLinkClasses} text-sm`;

const mobileNavLink =
  'relative block w-full py-[15px] px-6 border-t border-white/12 ' +
  'font-heading no-underline text-lg ' +
  'transition-colors duration-(--duration-fast) ease-standard ' +
  'after:absolute after:left-6 after:right-6 after:bottom-[9px] after:h-0.5 after:origin-left ' +
  'after:scale-x-0 after:bg-orange after:transition-transform ' +
  'after:duration-(--duration-base) after:ease-out hover:after:scale-x-100 ' +
  'aria-[current=page]:text-orange aria-[current=page]:after:scale-x-100 ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ' +
  'focus-visible:outline-focus-ring';

export default function Header() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

  return (
    <header className="bg-darkblue surface-dark font-heading relative z-1100 w-full text-white">
      <div className="mx-auto flex max-w-300 items-center justify-between gap-5 px-6 py-3.5">
        {/* Logo group — dice + wordmark, both navigate home */}
        <div className="flex items-center gap-2.5">
          <DiceLogo size={40} onClick={() => navigate('/')} />
          <NavLink
            to="/"
            end
            className="font-heading tracking-heading focus-visible:outline-orange text-[length:--text-h4] leading-[--text-h4--line-height] font-bold text-white no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3"
          >
            SBSK
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
          <Button
            onClick={toggleDarkMode}
            variant="toggle"
            size="xs"
            icon={isDarkMode ? 'sun' : 'moon'}
            aria-label={isDarkMode ? 'Bytt til lys modus' : 'Bytt til mørk modus'}
          >
            {isDarkMode ? 'LM' : 'DM'}
          </Button>

          {/* Login / profile — desktop only */}
          {isAuthenticated ? (
            <div className="relative z-50 hidden lg:block">
              <Button
                variant="primary"
                size="sm"
                icon="expand"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {(user?.name && 'Hi, ' + user.name) || 'Min profil'}
              </Button>
              <div
                className={`bg-darkestblue absolute top-11 right-0 z-50 flex w-40 flex-col items-start gap-2 p-4 ${isDropdownOpen ? '' : 'hidden'}`}
              >
                {isAdmin && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon="right"
                    onClick={() => {
                      navigate('/styreportal');
                      setIsDropdownOpen(false);
                    }}
                  >
                    Styreportal
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  icon="right"
                  onClick={() => {
                    navigate('/medlemsportal');
                    setIsDropdownOpen(false);
                  }}
                >
                  Profil
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon="right"
                  onClick={() => {
                    logout();
                    setIsDropdownOpen(false);
                    navigate('/');
                  }}
                >
                  Logg ut
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="primary" size="sm" icon="right" onClick={() => navigate('/login')}>
              Logg inn
            </Button>
          )}

          <NavMenuButton
            open={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden"
          />
        </div>
      </div>

      {/* Mobile nav — collapses via max-height */}
      <nav
        className={`bg-darkestblue flex flex-col overflow-hidden transition-[max-height] duration-(--duration-slow) ease-out lg:hidden ${
          isMobileMenuOpen ? 'max-h-[460px]' : 'max-h-0'
        }`}
        aria-label="Mobilmeny"
      >
        {isAuthenticated && (
          <div className="flex gap-2 border-t border-white/12 px-6 py-[15px]">
            {isAdmin && (
              <Button
                variant="primary"
                size="xs"
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
              size="xs"
              icon="right"
              onClick={() => {
                closeMobileMenu();
                navigate('/medlemsportal');
              }}
            >
              Profil
            </Button>
            <Button
              variant="secondary"
              size="xs"
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
      </nav>
    </header>
  );
}
