import { useLoaderData } from 'react-router-dom';
import BadgesPanel from '../components/sections/AdminPortalSection/BadgesPanel';
import MembersSummary from '../components/sections/AdminPortalSection/MembersSummary';
import UpcomingEventsPanel from '../components/sections/AdminPortalSection/UpcomingEventsPanel';
import type { adminOverviewLoader } from '../loaders/admin-portal-loaders';

export default function AdminOverview() {
  const { events, signups, members, seasonStatus } = useLoaderData<typeof adminOverviewLoader>();
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <UpcomingEventsPanel events={events} signups={signups} />
      <div className="flex flex-col gap-6">
        <MembersSummary members={members} seasonStatus={seasonStatus} />
        <BadgesPanel />
      </div>
    </div>
  );
}
