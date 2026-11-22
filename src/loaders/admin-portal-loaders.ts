import { redirect, type LoaderFunctionArgs } from 'react-router-dom';
import { requireAdminSession } from './requireAdminSession';
import { memberPortalEnabled } from '../utils/featureFlags';
import { runRetention } from '../supabase/queryHelpers/gdpr';
import { getProfile } from '../supabase/queryHelpers/getProfile';
import { getMembers } from '../supabase/queryHelpers/getMembers';
import { getPendingApplications } from '../supabase/queryHelpers/membershipApplications';
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

/**
 * Payment status and sign-ups come from objects added by later migrations (the
 * `member_season_status` view, `admin_event_signups`). If the app is deployed ahead of the
 * database, or one read blips, the register and the events are still useful without them, so
 * these two degrade to "unavailable" instead of sending the whole portal to the fault screen.
 * The register itself (`getMembers`) stays fatal: without it there is nothing to show.
 */
async function optional<T>(read: Promise<T>): Promise<T | null> {
  try {
    return await read;
  } catch (error) {
    console.error('Board portal: optional read failed', error);
    return null;
  }
}

/** `/styreportal`: upcoming events with sign-ups, and the register summary. */
export async function adminOverviewLoader() {
  await requireAdminSession('/styreportal');
  const [events, members, seasonStatus] = await Promise.all([
    getUpcomingEventsForAdmin(5),
    getMembers(),
    optional(getSeasonStatus()),
  ]);
  const signups = await optional(getEventSignupsForAdmin(events.map((e) => e._id)));
  return {
    events,
    signups: signups ?? {},
    signupsUnavailable: signups === null,
    members,
    seasonStatus,
  };
}

/** `/styreportal/medlemmer`. */
export async function adminMembersLoader() {
  await requireAdminSession('/styreportal/medlemmer');
  // Retention first, so a purged application is never listed (no pg_cron; see the migration).
  await optional(runRetention());
  const [members, seasonStatus, applications] = await Promise.all([
    getMembers(),
    optional(getSeasonStatus()),
    // Approving sends people to /lag-medlemsprofil, which exists only with the member portal.
    memberPortalEnabled ? optional(getPendingApplications()) : Promise.resolve([]),
  ]);
  return { members, seasonStatus, applications };
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
