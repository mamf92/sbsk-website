import { NavLink } from 'react-router-dom';
import { SocialIcon } from 'react-social-icons';
import { DiceLogo } from '../ui/DiceLogo';
import { navLinkClassesBody } from '../ui/Link';

export default function Footer() {
  return (
    <footer className="bg-darkblue surface-dark font-body max-xs:p-4 flex w-full flex-col p-8 text-white">
      <div className="bg-darkestblue max-xs:px-4 flex justify-center px-6 py-16">
        <div className="max-w-shell flex w-full flex-col gap-6">
          <div className="flex flex-col gap-8 md:flex-row md:flex-wrap lg:flex-nowrap lg:gap-10">
            <div className="flex flex-1 flex-col justify-between gap-6 md:min-w-full md:items-center md:gap-2 lg:min-w-auto lg:items-start lg:justify-around">
              <div className="flex items-center justify-start gap-4">
                <div>
                  <NavLink to="/" end className="flex max-w-12.25 min-w-12.25">
                    <DiceLogo size={48} />
                  </NavLink>
                </div>
                <div>
                  <p className="font-heading text-h2 font-bold">Stavanger Brettspillklubb</p>
                </div>
              </div>
              <div>
                <p>Kontakt oss:</p>
                <a href="mailto:hei@sbsk.no" className="underline">
                  hei@sbsk.no
                </a>
              </div>
            </div>
            <div className="flex flex-1 flex-row">
              <nav
                aria-labelledby="footer-member-nav-heading"
                className="flex flex-1 flex-col items-start gap-4"
              >
                <h2 id="footer-member-nav-heading" className="text-base">
                  <NavLink to="/bli-medlem" className={`${navLinkClassesBody} font-bold`}>
                    Bli medlem nå!
                  </NavLink>
                </h2>
                <NavLink to="/kalender" className={navLinkClassesBody}>
                  Kalender
                </NavLink>
                <NavLink to="/våre-spill" className={navLinkClassesBody}>
                  Våre spill
                </NavLink>
                <NavLink to="/om-oss" className={navLinkClassesBody}>
                  Om oss
                </NavLink>
                <NavLink to="/kontakt-oss" className={navLinkClassesBody}>
                  Kontakt oss
                </NavLink>
              </nav>
              <nav
                aria-labelledby="footer-partner-nav-heading"
                className="flex flex-1 flex-col items-start gap-4"
              >
                <h2 id="footer-partner-nav-heading" className="text-base">
                  <NavLink to="/våre-partnere" className={`${navLinkClassesBody} font-bold`}>
                    Våre partnere
                  </NavLink>
                </h2>
                <a
                  href="https://www.outland.no/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Outland.no
                </a>
                <NavLink to="/våre-spill" className={navLinkClassesBody}>
                  Kjøp spill med rabatt
                </NavLink>
                <NavLink to="/kontakt-oss" className={navLinkClassesBody}>
                  Bli støttespiller
                </NavLink>
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
