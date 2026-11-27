import { nextGameNightLoader } from '../sanity/queryHelpers/events';
import { memberPortalEnabled } from '../utils/featureFlags';
import { settle } from './settle';

/**
 * `/bli-medlem`: the next game night for the «Mens du venter» note shown after sending. The
 * form works without it, so a failed fetch only hides the note. Nothing is fetched while the
 * page is still the placeholder.
 */
export async function becomeAMemberLoader() {
  if (!memberPortalEnabled) return { nextGameNight: null };
  const next = await settle(nextGameNightLoader());
  return { nextGameNight: next.data ?? null };
}
