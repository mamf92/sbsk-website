import { useEffect, useState } from 'react';
import { useAuth } from './authContext/authContext';
import { getMember, type Member } from '../supabase/queryHelpers/getMember';
import { getMyActivity, type MyActivity } from '../supabase/queryHelpers/getMyActivity';
import { getMyBadges, type MyBadge } from '../supabase/queryHelpers/badges';
import { getMemberSeasonStatus } from '../supabase/queryHelpers/getSeasonStatus';
import { settle } from '../loaders/settle';

export interface MemberHome {
  /** The member's own register row; null when it could not be read. */
  me: Member | null;
  activity: MyActivity;
  /** Null when the badges could not be read. */
  badges: MyBadge[] | null;
  /** This season's payment; null when unknown. */
  paid: boolean | null;
}

/**
 * The signed-in member's corner of the new front page: their register row, own numbers, badges
 * and whether this season is paid. Fetched in the browser after sign-in is known, because the
 * front page itself is public and its loader cannot wait on a session. Each part degrades on its
 * own, like `memberPortalLoader`: a failed read shows «–», never a broken page.
 *
 * Returns null for a visitor, and while a member's data is still on its way.
 */
export function useMemberHome(): MemberHome | null {
  const { isAuthenticated, user } = useAuth();
  const supabaseId = isAuthenticated ? (user?.supabase_id ?? null) : null;
  const [state, setState] = useState<{ id: string; data: MemberHome } | null>(null);

  useEffect(() => {
    if (!supabaseId) return;
    let cancelled = false;
    (async () => {
      const [{ data: me }, { data: badges }] = await Promise.all([
        settle(getMember(supabaseId)),
        settle(getMyBadges()),
      ]);
      const [{ data: activity }, { data: season }] = await Promise.all([
        settle(getMyActivity(supabaseId, me?.id ?? null)),
        me ? settle(getMemberSeasonStatus(me.id)) : Promise.resolve({ data: null }),
      ]);
      if (cancelled) return;
      setState({
        id: supabaseId,
        data: {
          me,
          activity: activity ?? { checkIns: null, signups: null },
          badges,
          paid: season ? season.paid : null,
        },
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [supabaseId]);

  return supabaseId && state?.id === supabaseId ? state.data : null;
}
