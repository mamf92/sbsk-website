import { supabase } from '../client';

/** One row of `my_badges()`: every active badge, earned or not. */
export interface MyBadge {
  slug: string;
  kind: 'auto' | 'manual';
  /** When it was earned; null while locked. */
  awarded_at: string | null;
  /** Automatic badges: how far along, capped at `target`. Null for manual ones. */
  progress: number | null;
  target: number | null;
}

/**
 * The signed-in member's badges. The RPC re-checks the automatic ones first, so time-based
 * badges ("three years") appear without a scheduled job.
 */
export async function getMyBadges(): Promise<MyBadge[]> {
  const { data, error } = await supabase.rpc('my_badges');
  if (error) throw error;
  return (data ?? []) as MyBadge[];
}

export interface MemberBadge {
  badge_slug: string;
  awarded_at: string;
  /** Null when awarded automatically. */
  awarded_by: string | null;
}

/** A member's badges, for the board (RLS: `admin_session()`). */
export async function getMemberBadges(memberId: string): Promise<MemberBadge[]> {
  const { data, error } = await supabase
    .from('member_badges')
    .select('badge_slug, awarded_at, awarded_by')
    .eq('member_id', memberId);
  if (error) throw error;
  return (data ?? []) as MemberBadge[];
}

/**
 * Give and take back manual badges in one go. RLS allows manual badges only, at aal2;
 * `awarded_by` defaults to the caller.
 */
export async function setManualBadges(
  memberId: string,
  give: string[],
  takeBack: string[],
): Promise<void> {
  if (give.length > 0) {
    const { error } = await supabase
      .from('member_badges')
      .insert(give.map((slug) => ({ member_id: memberId, badge_slug: slug })));
    if (error) throw error;
  }
  if (takeBack.length > 0) {
    const { error } = await supabase
      .from('member_badges')
      .delete()
      .eq('member_id', memberId)
      .in('badge_slug', takeBack);
    if (error) throw error;
  }
}
