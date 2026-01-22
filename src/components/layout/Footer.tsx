import { NavLink } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { SocialIcon } from 'react-social-icons';
import Logo from '../../assets/logos/dicelogosm.png';
import { Button } from '../ui/Buttons';

export default function Footer() {
  return (
    <footer className="bg-darkblue font-body flex w-full flex-col p-8 text-white">
      <div className="bg-darkestblue flex justify-center py-16">
        <div className="flex w-full max-w-[75rem] flex-col gap-6">
          <div className="flex flex-row flex-nowrap gap-10">
            <div className="flex flex-1 flex-col items-start justify-between">
              <div>
                <NavLink to="/" end className="flex max-w-[3.0625rem] min-w-[3.0625rem]">
                  <img src={Logo} alt="SBSK Logo" className="w-full" />
                </NavLink>
              </div>
              <div>
                <p>Adresse:</p>
                <p>Stavanger, Norway</p>
              </div>
              <div>
                <p>Kontakt oss:</p>
                <p>hei@sbsk.no</p>
              </div>
            </div>
            <div className="flex flex-1 flex-row">
              <nav className="flex flex-1 flex-col items-start gap-4">
                <HashLink to="/blimedlem" className="font-bold">
                  Bli medlem nå!
                </HashLink>
                <HashLink smooth to="/#kalender">
                  Events
                </HashLink>
                <HashLink to="/vårespill">Våre spill</HashLink>
                <HashLink smooth to="/#omoss">
                  Om oss
                </HashLink>
                <HashLink smooth to="/#kontaktoss">
                  Kontakt oss
                </HashLink>
              </nav>
              <nav className="flex flex-1 flex-col items-start gap-4">
                <NavLink to="/vårepartnere" className="font-bold">
                  Våre partnere
                </NavLink>
                <a href="https://www.outland.no/" target="_blank">
                  Outland.no
                </a>
                <NavLink to="/vårespill">Kjøp spill med rabatt</NavLink>
                <HashLink smooth to="/#kontaktoss">
                  Bli støttespiller
                </HashLink>
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
              <p className="font-bold">Meld deg på vårt månedlige nyhetsbrev: </p>
              <input
                type="email"
                placeholder="E-postadresse"
                className="text-darkestblue placeholder:text-darkblue w-full border-0 bg-white px-4 py-4 text-sm"
              />
              <Button variant="primary" size="sm" icon="right" className="mt-0">
                Meld på
              </Button>
            </div>
          </div>
          <div className="border-t-1 pt-6">
            <p className="text-center text-sm">
              &copy; 2025 Stavanger Brettspillklubb. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
