import type { SignupTypes } from '../sanity/queryHelpers/fragments';
import { safeExternalUrl } from './safeUrl';

export type SignupState = 'open' | 'notYetOpen' | 'closed' | 'dropIn' | 'none';

/**
 * What a sign-up block should show at `now`. The one place this rule lives, so the event page,
 * the festival page and each session agree.
 *
 * - `none`: no sign-up set, or a link method whose URL is missing or unsafe.
 * - `dropIn`: no sign-up needed.
 * - `closed`: closed by the editor, or the deadline has passed.
 * - `notYetOpen`: a link that opens later.
 * - `open`: a safe link to sign up through, now.
 */
export function signupState(signup: SignupTypes | null | undefined, now: Date): SignupState {
  if (!signup?.method) return 'none';
  switch (signup.method) {
    case 'oppmote':
      return 'dropIn';
    case 'stengt':
      return 'closed';
    case 'spond':
    case 'lenke': {
      if (!safeExternalUrl(signup.url)) return 'none';
      const time = now.getTime();
      const closes = parseTime(signup.closes);
      if (closes !== null && time >= closes) return 'closed';
      const opens = parseTime(signup.opens);
      if (opens !== null && time < opens) return 'notYetOpen';
      return 'open';
    }
    default:
      // A method this build does not know yet (e.g. `sbsk` from a newer Studio) shows nothing
      // rather than guessing.
      return 'none';
  }
}

function parseTime(value: string | undefined): number | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}
