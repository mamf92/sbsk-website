import {
  getUpcomingEventsByIds,
  getUpcomingEventsForAdmin,
} from '../sanity/queryHelpers/admin-events';
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
  const pool = (events.data ?? []).filter((event) => event._type === 'event');
  // The pool is the next 20; a sign-up further ahead is fetched on its own so it is still listed.
  const inPool = new Set(pool.map((event) => event._id));
  const missing = (signups.data ?? []).filter((id) => !inPool.has(id));
  const extra = await settle(getUpcomingEventsByIds(missing));
  const upcoming = [...pool, ...(extra.data ?? [])].sort((a, b) => a.start.localeCompare(b.start));
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
    failed: events.failed || signups.failed || extra.failed || counts.failed,
  };
}

export type MemberOverviewData = Awaited<ReturnType<typeof memberOverviewLoader>>;
