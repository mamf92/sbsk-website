import type { SponsorTier, SponsorTypes } from '../sanity/queryHelpers/fragments';

export const SPONSOR_TIER_ORDER: SponsorTier[] = ['hovedsponsor', 'sponsor', 'partner'];

/** The tier a sponsor counts as; anything missing or unknown is a plain sponsor. */
export function tierOf(sponsor: SponsorTypes): SponsorTier {
  return SPONSOR_TIER_ORDER.includes(sponsor.tier as SponsorTier)
    ? (sponsor.tier as SponsorTier)
    : 'sponsor';
}

/** Sponsors grouped by tier, main sponsors first, empty tiers left out. */
export function groupSponsorsByTier(sponsors: SponsorTypes[]) {
  return SPONSOR_TIER_ORDER.map((tier) => ({
    tier,
    sponsors: sponsors.filter((sponsor) => tierOf(sponsor) === tier),
  })).filter((group) => group.sponsors.length > 0);
}
