import { NavLink } from 'react-router-dom';
import { Button } from '../ui/Buttons';

import Logo from '../../assets/logos/dicelogosm.png';

function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
}

const linkBase = 'font-heading text-sm hover:underline decoration-[0.123rem] transition';
const getLink = ({ isActive }: { isActive: boolean }) =>
  `${linkBase} ${isActive ? 'underline' : ''}`;

export default function Header() {
  return (
    <header className="bg-darkblue font-heading flex h-[5.0625rem] w-full justify-center px-6 text-white">
      <div className="flex w-full max-w-[75rem] content-center items-center justify-center gap-4 py-4">
        <NavLink to="/" end className="flex max-w-[3.0625rem] min-w-[3.0625rem]">
          <img src={Logo} alt="SBSK Logo" className="w-full" />
        </NavLink>
        <nav className="flex w-full items-center justify-center gap-12 px-4">
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
        <div className="flex items-center gap-1">
          <Button onClick={toggleDarkMode} variant="toggle" size="xs" icon="moon" className="">
            DM
          </Button>
          <Button variant="primary" size="md" icon="right">
            Bli medlem
          </Button>
        </div>
      </div>
    </header>
  );
}
