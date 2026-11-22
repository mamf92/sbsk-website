import { useLoaderData, useRouteLoaderData } from 'react-router-dom';
import BadgeGrid from '../components/sections/MemberPortalSection/BadgeGrid';
import MemberEventsSection from '../components/sections/MemberPortalSection/MemberEventsSection';
import type { MemberOverviewData } from '../loaders/member-overview-loader';
import type { MemberPortalData } from '../loaders/member-portal-loader';

/** Min side's first tab: the member's sign-ups and suggestions, then their badges. */
export default function MemberOverview() {
  const data = useLoaderData() as MemberOverviewData;
  // Badges come with the band's data, which already counts them.
  const portal = useRouteLoaderData('member-portal') as MemberPortalData | undefined;
  return (
    <>
      <MemberEventsSection {...data} />
      <BadgeGrid badges={portal?.badges ?? null} />
    </>
  );
}
