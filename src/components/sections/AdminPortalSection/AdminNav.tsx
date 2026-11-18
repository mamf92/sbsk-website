import { NavLink } from 'react-router-dom';
import { navLinkClasses } from '../../ui/Link';

const tabs = [
  { to: '/styreportal', label: 'Oversikt', end: true },
  { to: '/styreportal/medlemmer', label: 'Medlemmer', end: false },
  { to: '/styreportal/innsjekk', label: 'Innsjekk', end: false },
] as const;

/** The board portal's tabs. Real links (nested routes), so the door check-in can be bookmarked
 *  on a phone; NavLink sets `aria-current="page"`, which `navLinkClasses` styles. */
export default function AdminNav() {
  return (
    <nav aria-label="Styreportal" className="border-b border-gray-300 dark:border-white/20">
      <ul className="max-w-content mx-auto flex w-full gap-6 overflow-x-auto px-4 py-3">
        {tabs.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              end={tab.end}
              className={`${navLinkClasses} text-darkblue dark:text-white`}
            >
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
