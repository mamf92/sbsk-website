import { badgeText } from '../content/badges';
import type { MyBadge } from '../supabase/queryHelpers/badges';

/** "3 av 10 innsjekkinger" for a locked automatic badge; nothing for a manual one. */
export function progressText(badge: MyBadge): string | undefined {
  if (badge.progress === null || badge.target === null) return undefined;
  const unit = badgeText(badge.slug).unit;
  return `${badge.progress} av ${badge.target}${unit ? ` ${unit}` : ''}`;
}

/** Earned first, newest first; then locked, in the club's order (closest to earned first). */
export function orderBadges(badges: MyBadge[]): MyBadge[] {
  const earned = badges
    .filter((badge) => badge.awarded_at)
    .sort((a, b) => (b.awarded_at ?? '').localeCompare(a.awarded_at ?? ''));
  const locked = badges.filter((badge) => !badge.awarded_at);
  return [...earned, ...locked];
}
