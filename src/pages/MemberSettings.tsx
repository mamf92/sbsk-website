import { useRouteLoaderData } from 'react-router-dom';
import MemberSettingsSection from '../components/sections/MemberPortalSection/MemberSettingsSection';
import type { MemberPortalData } from '../loaders/member-portal-loader';

export default function MemberSettings() {
  const { profile } = useRouteLoaderData('member-portal') as MemberPortalData;
  return <MemberSettingsSection profile={profile} />;
}
