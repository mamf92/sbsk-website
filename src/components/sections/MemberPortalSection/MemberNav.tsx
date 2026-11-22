import { PortalTabs } from '../../ui/PortalTabs';

const tabs = [
  { to: '/medlemsportal', label: 'Oversikt', end: true },
  { to: '/medlemsportal/medlemskort', label: 'Medlemskort' },
  { to: '/medlemsportal/innstillinger', label: 'Innstillinger' },
] as const;

/** Min side's tabs. The card and settings have their own URLs: the card is bookmarked for the
 *  door, and the privacy texts link to settings. */
export default function MemberNav() {
  return <PortalTabs label="Min side" tabs={tabs} />;
}
