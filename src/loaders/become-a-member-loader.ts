import { nextGameNightLoader } from '../sanity/queryHelpers/events';
import type { CalendarEventTypes } from '../sanity/queryHelpers/events';
import { memberPortalEnabled } from '../utils/featureFlags';
import { settle } from './settle';

/**
 * `/bli-medlem`: the next game night for the «Mens du venter» note shown after sending.
 *
 * Returned as a promise, not awaited: the form needs nothing from Sanity, so navigation must not
 * wait on it, and the note is only read after a submit. A failed fetch resolves to `null` and
 * only hides the note. Nothing is fetched while the page is still the placeholder.
 */
export function becomeAMemberLoader(): { nextGameNight: Promise<CalendarEventTypes | null> } {
  if (!memberPortalEnabled) return { nextGameNight: Promise.resolve(null) };
  return { nextGameNight: settle(nextGameNightLoader()).then((result) => result.data ?? null) };
}
