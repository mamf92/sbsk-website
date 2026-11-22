import { useLoaderData } from 'react-router-dom';
import MembershipCardSection from '../components/sections/MemberPortalSection/MembershipCardSection';
import type { MemberCardData } from '../loaders/member-card-loader';

/** Min side's "Medlemskort" tab. */
export default function MemberCard() {
  const { member, paid } = useLoaderData() as MemberCardData;
  // Keyed on the token, so a reload that brings a code rotated elsewhere redraws the card.
  return <MembershipCardSection key={member?.member_card_token} member={member} paid={paid} />;
}
