import { PortalTabs } from '../../ui/PortalTabs';

const tabs = [
  { to: '/medlemsportal', label: 'Oversikt', end: true },
  { to: '/medlemsportal/innstillinger', label: 'Innstillinger' },
] as const;

/** Min side's tabs. Settings has its own URL so the privacy texts can link to it. */
export default function MemberNav() {
  return <PortalTabs label="Min side" tabs={tabs} />;
}
