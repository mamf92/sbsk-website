import { useEffect, useState } from 'react';
import type { PostTypes } from '../sanity/queryHelpers/posts';

const STORAGE_KEY = 'sbsk-posts-seen-at';
/** With nothing stored yet (a member's first visit on this device), this far back counts as new. */
const FIRST_VISIT_DAYS = 30;

function readSeenAt(now: Date): number {
  try {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    if (stored > 0) return stored;
  } catch {
    // Private mode or blocked storage: fall through to the first-visit window.
  }
  return now.getTime() - FIRST_VISIT_DAYS * 86_400_000;
}

/**
 * «Ny» on the notice board: a post published since the member last opened the front page on this
 * device. Stored per device in `localStorage`, on purpose: it is a convenience, not a record, and
 * keeping it out of the database keeps reading habits out of it too. The time is read once per
 * mount and written straight after, so the marks stay put while the page is open and are gone
 * on the next visit.
 */
export function useUnreadPosts(enabled: boolean): (post: PostTypes) => boolean {
  const [seenAt] = useState(() => readSeenAt(new Date()));

  useEffect(() => {
    if (!enabled) return;
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // Nothing to do: the marks just show again next time.
    }
  }, [enabled]);

  return (post) => enabled && new Date(post.publishedAt).getTime() > seenAt;
}
