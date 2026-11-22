import { useLoaderData } from 'react-router-dom';
import MemberEventsSection from '../components/sections/MemberPortalSection/MemberEventsSection';
import type { MemberOverviewData } from '../loaders/member-overview-loader';

/** Min side's first tab: the member's sign-ups and suggestions. Badges and the card follow. */
export default function MemberOverview() {
  const data = useLoaderData() as MemberOverviewData;
  return <MemberEventsSection {...data} />;
}
