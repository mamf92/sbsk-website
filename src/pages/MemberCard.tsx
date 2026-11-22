import { useLoaderData } from 'react-router-dom';
import MembershipCardSection from '../components/sections/MemberPortalSection/MembershipCardSection';
import type { MemberCardData } from '../loaders/member-card-loader';

/** Min side's "Medlemskort" tab. */
export default function MemberCard() {
  const { member, paid } = useLoaderData() as MemberCardData;
  return <MembershipCardSection member={member} paid={paid} />;
}
