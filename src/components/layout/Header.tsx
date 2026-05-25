import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Buttons';
import { useTheme } from '../../hooks/theme/ThemeContext';
import Logo from '../../assets/logos/dicelogo.png';
import { useEffect, useRef, useState } from 'react';
import { Cross as Hamburger } from 'hamburger-react';
const linkBase = 'font-body text-lg lg:text-sm hover:underline decoration-[0.123rem] transition';
const getLink = ({ isActive }: { isActive: boolean }) =>
  `${linkBase} ${isActive ? 'underline' : ''}`;

export default function Header() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsMobileMenuOpen(false);
      }
    };
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="bg-darkblue font-heading relative flex h-25.25 w-full justify-center px-6 text-white">
      <div className="grid w-full max-w-300 grid-cols-[1fr_auto_1fr] items-center gap-4 py-4">
        <div className="flex items-center justify-start">
          <NavLink to="/" end className="flex max-w-12.25 min-w-12.25">
            <img src={Logo} alt="SBSK Logo" className="w-full" />
          </NavLink>
        </div>

        <nav className="hidden items-center justify-center gap-10 px-4 lg:flex">
          <NavLink to="/" end className={getLink}>
            Hjem
          </NavLink>
          <NavLink to="/kalender" className={getLink}>
            Kalender
          </NavLink>
          <NavLink to="/board-game-masters" className={getLink}>
            Board Game Masters
          </NavLink>
          <NavLink to="/våre-spill" className={getLink}>
            Våre spill
          </NavLink>
          <NavLink to="/om-oss" className={getLink}>
            Om oss
          </NavLink>
          <NavLink to="/kontakt-oss" className={getLink}>
            Kontakt oss
          </NavLink>
        </nav>
        <div className="col-3 flex items-center justify-end gap-2 lg:hidden lg:gap-8">
          <Button
            onClick={toggleDarkMode}
            variant="toggle"
            size="xs"
            icon={isDarkMode ? 'sun' : 'moon'}
            aria-label={isDarkMode ? 'Bytt til lys modus' : 'Bytt til mørk modus'}
          >
            {isDarkMode ? 'LM' : 'DM'}
          </Button>
          <button
            className="w-16"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Meny"
          >
            <Hamburger toggled={isMobileMenuOpen} />
          </button>
        </div>

        <nav
          className={`bg-darkestblue absolute top-25.25 left-0 z-50 flex w-full flex-col items-center gap-6 px-4 py-8 ${isMobileMenuOpen ? '' : 'hidden'}`}
          ref={menuRef}
        >
          <NavLink to="/" end className={getLink}>
            Hjem
          </NavLink>
          <NavLink to="/kalender" className={getLink}>
            Kalender
          </NavLink>
          <NavLink to="/board-game-masters" className={getLink}>
            Board Game Masters
          </NavLink>
          <NavLink to="/våre-spill" className={getLink}>
            Våre spill
          </NavLink>
          <NavLink to="/om-oss" className={getLink}>
            Om oss
          </NavLink>
          <NavLink to="/kontakt-oss" className={getLink}>
            Kontakt oss
          </NavLink>
        </nav>

        <div className="hidden items-center justify-end gap-8 lg:flex">
          <Button
            onClick={toggleDarkMode}
            variant="toggle"
            size="xs"
            icon={isDarkMode ? 'sun' : 'moon'}
            aria-label={isDarkMode ? 'Bytt til lys modus' : 'Bytt til mørk modus'}
          >
            {isDarkMode ? 'LM' : 'DM'}
          </Button>
          <Button variant="primary" size="md" icon="right" onClick={() => navigate('/bli-medlem')}>
            Bli medlem
          </Button>
        </div>
      </div>
    </header>
  );
}
