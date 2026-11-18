import { redirect, type LoaderFunctionArgs } from 'react-router-dom';
import { requireAdminSession } from './requireAdminSession';
import { getProfile } from '../supabase/queryHelpers/getProfile';
import { getMembers } from '../supabase/queryHelpers/getMembers';
import { getSeasonStatus } from '../supabase/queryHelpers/getSeasonStatus';
import { getEventSignupsForAdmin } from '../supabase/queryHelpers/getEventSignupsForAdmin';
import { getMyActivity } from '../supabase/queryHelpers/getMyActivity';
import { getCheckedIn, getGuestCount } from '../supabase/queryHelpers/checkIn';
import {
  getAdminEvent,
  getCheckInEvents,
  getUpcomingEventsForAdmin,
} from '../sanity/queryHelpers/admin-events';

// The board portal (/styreportal and its tabs). Every loader passes the admin gate first, so a
// child never queries before its parent's redirect would have happened; parent and child
// loaders run in parallel in React Router.

/** The shared top: the admin's own profile, register row and activity. */
export async function adminPortalLoader({ request }: LoaderFunctionArgs) {
  const user = await requireAdminSession(
    new URL(request.url).pathname.replace(/^.*?(\/styreportal)/, '$1'),
  );
  const [profile, members] = await Promise.all([getProfile(user.id), getMembers()]);
  const me = members.find((m) => m.supabase_id === user.id) ?? null;
  const activity = await getMyActivity(user.id, me?.id ?? null);
  return { profile, me, activity };
}

/** `/styreportal`: upcoming events with sign-ups, and the register summary. */
export async function adminOverviewLoader() {
  await requireAdminSession('/styreportal');
  const [events, members, seasonStatus] = await Promise.all([
    getUpcomingEventsForAdmin(5),
    getMembers(),
    getSeasonStatus(),
  ]);
  const signups = await getEventSignupsForAdmin(events.map((e) => e._id));
  return { events, signups, members, seasonStatus };
}

/** `/styreportal/medlemmer`. */
export async function adminMembersLoader() {
  await requireAdminSession('/styreportal/medlemmer');
  const [members, seasonStatus] = await Promise.all([getMembers(), getSeasonStatus()]);
  return { members, seasonStatus };
}

/** `/styreportal/innsjekk`: pick today's (or this week's) event. */
export async function adminCheckInListLoader() {
  await requireAdminSession('/styreportal/innsjekk');
  return { events: await getCheckInEvents(7) };
}

/** `/styreportal/innsjekk/:eventId`. */
export async function adminCheckInEventLoader({ params }: LoaderFunctionArgs) {
  const eventId = params.eventId ?? '';
  await requireAdminSession(`/styreportal/innsjekk/${encodeURIComponent(eventId)}`);
  const event = await getAdminEvent(eventId);
  if (!event) throw redirect('/styreportal/innsjekk');

  const [members, checkedIn, guests, signups] = await Promise.all([
    getMembers(),
    getCheckedIn(event._id),
    getGuestCount(event._id),
    getEventSignupsForAdmin([event._id]),
  ]);
  return { event, members, checkedIn, guests, signups: signups[event._id] ?? [] };
}
