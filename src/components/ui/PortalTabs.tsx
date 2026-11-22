import { NavLink } from 'react-router-dom';
import { navLinkClasses } from './Link';

export interface PortalTab {
  to: string;
  label: string;
  /** Match the path exactly (the portal's index tab). */
  end?: boolean;
}

/**
 * The tab row under a portal's top band (Styreportal, Min side). Real links to nested routes,
 * so each tab has its own URL; NavLink sets `aria-current="page"`, which `navLinkClasses`
 * styles.
 */
export function PortalTabs({ label, tabs }: { label: string; tabs: readonly PortalTab[] }) {
  return (
    <nav aria-label={label} className="border-b border-gray-300 dark:border-white/20">
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
