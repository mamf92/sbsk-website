import { NavLink } from 'react-router-dom';
import { SocialIcon } from 'react-social-icons';
import Logo from '../../assets/logos/dicelogo.png';
import { Button } from '../ui/Buttons';

export default function Footer() {
  return (
    <footer className="bg-darkblue surface-dark font-body max-xs:p-4 flex w-full flex-col p-8 text-white">
      <div className="bg-darkestblue flex justify-center py-16">
        <div className="flex w-full max-w-300 flex-col gap-6">
          <div className="flex flex-col gap-8 md:flex-row md:flex-wrap lg:flex-nowrap lg:gap-10">
            <div className="flex flex-1 flex-col justify-between gap-6 px-2 md:min-w-full md:items-center md:gap-2 lg:min-w-auto lg:items-start lg:justify-around">
              <div className="flex items-center justify-start gap-4">
                <div>
                  <NavLink to="/" end className="flex max-w-12.25 min-w-12.25">
                    <img src={Logo} alt="SBSK Logo" className="w-full" />
                  </NavLink>
                </div>
                <div>
                  <p className="font-heading text-2xl font-bold">Stavanger Brettspillklubb</p>
                </div>
              </div>
              <div>
                <p>Kontakt oss:</p>
                <a href="mailto:hei@sbsk.no" className="underline">
                  hei@sbsk.no
                </a>
              </div>
            </div>
            <div className="flex flex-1 flex-row px-2">
              <nav className="flex flex-1 flex-col items-start gap-4">
                <NavLink to="/bli-medlem" className="font-bold">
                  Bli medlem nå!
                </NavLink>
                <NavLink to="/kalender" className="font-body">
                  Kalender
                </NavLink>
                <NavLink to="/våre-spill" className="font-body">
                  Våre spill
                </NavLink>
                <NavLink to="/om-oss" className="font-body">
                  Om oss
                </NavLink>
                <NavLink to="/kontakt-oss" className="font-body">
                  Kontakt oss
                </NavLink>
              </nav>
              <nav className="flex flex-1 flex-col items-start gap-4">
                <NavLink to="/våre-partnere" className="font-bold">
                  Våre partnere
                </NavLink>
                <a href="https://www.outland.no/" target="_blank">
                  Outland.no
                </a>
                <NavLink to="/våre-spill" className="font-body">
                  Kjøp spill med rabatt
                </NavLink>
                <NavLink to="/kontakt-oss" className="font-body">
                  Bli støttespiller
                </NavLink>
              </nav>
            </div>
            <div className="flex flex-1 flex-col flex-nowrap items-start gap-2 px-2">
              <p className="font-bold">Følg oss: </p>
              <SocialIcon
                url="https://www.facebook.com/groups/1699569943629396"
                bgColor="#fff"
                fgColor="#002f5f"
                style={{ height: '1.5rem', width: '1.5rem' }}
              />
              <p className="font-bold">Meld deg på vårt månedlige nyhetsbrev: </p>
              <input
                type="email"
                placeholder="E-postadresse"
                className="text-darkestblue w-full border-0 bg-gray-300 px-4 py-4 text-sm placeholder:text-gray-500"
                disabled
              />
              <Button
                variant="disabled"
                size="sm"
                icon="block"
                className="mt-0"
                onClick={() => alert('Denne funksjonen er ikke implementert ennå')}
              >
                Meld på
              </Button>
            </div>
          </div>
          <div className="border-t pt-6">
            <p className="text-center text-sm">
              &copy; 2026 Stavanger Brettspillklubb. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
