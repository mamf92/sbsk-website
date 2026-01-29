import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '../ui/Buttons';
import { toggleTheme } from '../../utils/theme';

import Logo from '../../assets/logos/dicelogosm.png';

const linkBase = 'font-body text-sm hover:underline decoration-[0.123rem] transition';
const getLink = ({ isActive }: { isActive: boolean }) =>
  `${linkBase} ${isActive ? 'underline' : ''}`;

export default function Header() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  function handleToggleTheme() {
    const next = toggleTheme();
    setIsDark(next === 'dark');
  }

  return (
    <header className="bg-darkblue font-heading flex h-[5.0625rem] w-full justify-center px-6 text-white">
      <div className="grid w-full max-w-[75rem] grid-cols-[1fr_auto_1fr] items-center gap-4 py-4">
        <div className="flex items-center justify-start">
          <NavLink to="/" end className="flex max-w-[3.0625rem] min-w-[3.0625rem]">
            <img src={Logo} alt="SBSK Logo" className="w-full" />
          </NavLink>
        </div>

        <nav className="flex items-center justify-center gap-12 px-4">
          <NavLink to="/" end className={getLink}>
            Hjem
          </NavLink>
          <a href="#calendar" className={linkBase}>
            Kalender
          </a>
          <NavLink to="/vårespill" className={linkBase}>
            Våre spill
          </NavLink>
          <a href="#aboutus" className={linkBase}>
            Om oss
          </a>
          <a href="#contact" className={linkBase}>
            Kontakt oss
          </a>
        </nav>

        <div className="flex items-center justify-end gap-8">
          <Button
            onClick={handleToggleTheme}
            variant="toggle"
            size="xs"
            icon={isDark ? 'sun' : 'moon'}
            aria-label={isDark ? 'Bytt til lys modus' : 'Bytt til mørk modus'}
          >
            {isDark ? 'LM' : 'DM'}
          </Button>
          <Button variant="primary" size="md" icon="right">
            Bli medlem
          </Button>
        </div>
      </div>
    </header>
  );
}
