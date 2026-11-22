import type { LoaderFunctionArgs } from 'react-router-dom';
import { requireMember } from './requireMember';
import { getMember } from '../supabase/queryHelpers/getMember';
import { getMyActivity } from '../supabase/queryHelpers/getMyActivity';

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
  // RLS lets an active member read their own register row and nothing else.
  const me = await getMember(user.id);
  const activity = await getMyActivity(user.id, me.id);
  return { profile, me, activity };
}

export type MemberPortalData = Awaited<ReturnType<typeof memberPortalLoader>>;
