import type { SanityImageSource } from '@sanity/image-url';
import type { PortableTextBlock } from 'sanity';

// GROQ projections and TypeScript shapes for the objects events and festivals share
// (`src/sanity/schemaTypes/objects/`). One definition, so the two page types cannot drift.

export type LocaleString = { nb?: string; en?: string };
export type LocaleText = { nb?: string; en?: string };
export type LocaleBlock = { nb?: PortableTextBlock[]; en?: PortableTextBlock[] };

export type SignupMethod = 'spond' | 'lenke' | 'oppmote' | 'stengt';

export interface SignupTypes {
  method?: SignupMethod;
  url?: string;
  label?: LocaleString;
  /** ISO datetime. */
  opens?: string;
  /** ISO datetime. */
  closes?: string;
  price?: LocaleString;
  priceNok?: number;
  capacity?: number;
  note?: LocaleText;
}

export type SponsorTier = 'hovedsponsor' | 'sponsor' | 'partner';

export interface SponsorTypes {
  _key?: string;
  logo?: SanityImageSource;
  logoOnDark?: SanityImageSource;
  altText: string;
  tier?: SponsorTier;
  link?: string;
  ctaLabel?: string;
  ctaLink?: string;
}

export interface VenueTypes {
  name?: string;
  address?: string;
  meetingPoint?: LocaleText;
  /** "HH:MM". */
  doorsOpen?: string;
  directions?: LocaleBlock;
  accessibility?: LocaleText;
  contact?: string;
}

export const SIGNUP_PROJECTION = `{ method, url, label, opens, closes, price, priceNok, capacity, note }`;

export const SPONSOR_PROJECTION = `{ _key, logo, logoOnDark, altText, "tier": coalesce(tier, "sponsor"), link, ctaLabel, ctaLink }`;

export const VENUE_PROJECTION = `{ name, address, meetingPoint, doorsOpen, directions, accessibility, contact }`;
