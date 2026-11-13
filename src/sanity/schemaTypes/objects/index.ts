import { localeBlockType, localeStringType, localeTextType } from './locale';
import { signupType } from './signup';
import { sponsorType } from './sponsor';
import { venueType } from './venue';

/** Object types shared by event and festival documents. Registered in `src/pages/Studio.tsx`. */
export const sharedObjectTypes = [
  localeStringType,
  localeTextType,
  localeBlockType,
  signupType,
  sponsorType,
  venueType,
];
