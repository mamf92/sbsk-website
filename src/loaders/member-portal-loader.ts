import type { LoaderFunctionArgs } from 'react-router-dom';
import { requireMember } from './requireMember';
import { getMember } from '../supabase/queryHelpers/getMember';
import { getMyActivity, type MyActivity } from '../supabase/queryHelpers/getMyActivity';
import { getMyBadges } from '../supabase/queryHelpers/badges';
import { settle } from './settle';

/**
 * `/medlemsportal` and its tabs: the shared top band (profile, member since, own numbers).
 * The tabs read this through `useRouteLoaderData('member-portal')`.
 */
export async function memberPortalLoader(args?: LoaderFunctionArgs) {
  const path = args ? new URL(args.request.url).pathname : '/medlemsportal';
  const next = path.replace(/^.*?(\/medlemsportal)/, '$1') || '/medlemsportal';
  const { user, profile } = await requireMember(
    next.startsWith('/medlemsportal') ? next : '/medlemsportal',
  );
  // The band's extras. A failure here must not take Settings down with it (password, sign out
  // everywhere), so all degrade: no "member since", and "–" in the stat tiles.
  // RLS lets an active member read their own register row and nothing else.
  const [{ data: me }, { data: badges }] = await Promise.all([
    settle(getMember(user.id)),
    settle(getMyBadges()),
  ]);
  const { data: activity } = await settle(getMyActivity(user.id, me?.id ?? null));
  const fallback: MyActivity = { checkIns: null, signups: null };
  // Badges: the band shows the count, the overview tab the grid (null = could not be read).
  return { profile, me, activity: activity ?? fallback, badges: badges ?? null };
}

export type MemberPortalData = Awaited<ReturnType<typeof memberPortalLoader>>;
