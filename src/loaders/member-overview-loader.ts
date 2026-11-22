import { getUpcomingEventsForAdmin } from '../sanity/queryHelpers/admin-events';
import { getAttendeeCounts, getMySignups } from '../supabase/queryHelpers/eventParticipants';
import { getMember } from '../supabase/queryHelpers/getMember';
import { getMyCheckInCategories } from '../supabase/queryHelpers/getMyActivity';
import { favouriteCategory } from '../utils/suggestions';
import { requireMember } from './requireMember';
import { settle } from './settle';

/**
 * Min side's overview: upcoming events (Sanity), the member's own sign-ups, how many are coming,
 * and their most-attended category for suggestions. Festivals are left out: their sign-up is
 * per day on the festival page.
 */
export async function memberOverviewLoader() {
  const { user } = await requireMember('/medlemsportal');
  const [events, signups, me] = await Promise.all([
    settle(getUpcomingEventsForAdmin(20)),
    settle(getMySignups(user.id)),
    settle(getMember(user.id)),
  ]);
  const upcoming = (events.data ?? []).filter((event) => event._type === 'event');
  const ids = upcoming.map((event) => event._id);
  const [counts, categories] = await Promise.all([
    settle(getAttendeeCounts(ids)),
    me.data ? settle(getMyCheckInCategories(me.data.id)) : Promise.resolve({ data: [] }),
  ]);
  return {
    supabaseId: user.id,
    events: upcoming,
    joined: signups.data ?? [],
    counts: counts.data ?? {},
    favourite: favouriteCategory(categories.data ?? []),
    failed: events.failed || signups.failed || counts.failed,
  };
}

export type MemberOverviewData = Awaited<ReturnType<typeof memberOverviewLoader>>;
