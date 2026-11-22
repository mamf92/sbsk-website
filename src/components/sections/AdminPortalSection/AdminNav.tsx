import { PortalTabs } from '../../ui/PortalTabs';

const tabs = [
  { to: '/styreportal', label: 'Oversikt', end: true },
  { to: '/styreportal/medlemmer', label: 'Medlemmer' },
  { to: '/styreportal/innsjekk', label: 'Innsjekk' },
] as const;

/** The board portal's tabs, so the door check-in can be bookmarked on a phone. */
export default function AdminNav() {
  return <PortalTabs label="Styreportal" tabs={tabs} />;
}
