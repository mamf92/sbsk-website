import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Buttons';
import { useTheme } from '../../hooks/ThemeContext';
import Logo from '../../assets/logos/dicelogo.png';

const linkBase = 'font-body text-sm hover:underline decoration-[0.123rem] transition';
const getLink = ({ isActive }: { isActive: boolean }) =>
  `${linkBase} ${isActive ? 'underline' : ''}`;

export default function Header() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="bg-darkblue font-heading flex h-[5.0625rem] w-full justify-center px-6 text-white">
      <div className="grid w-full max-w-[75rem] grid-cols-[1fr_auto_1fr] items-center gap-4 py-4">
        <div className="flex items-center justify-start">
          <NavLink to="/" end className="flex max-w-[3.0625rem] min-w-[3.0625rem]">
            <img src={Logo} alt="SBSK Logo" className="w-full" />
          </NavLink>
        </div>

        <nav className="flex items-center justify-center gap-10 px-4">
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

        <div className="flex items-center justify-end gap-8">
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
