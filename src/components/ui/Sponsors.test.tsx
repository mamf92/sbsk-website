import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SponsorGrid, SponsorStrip } from './Sponsors';
import { groupSponsorsByTier } from '../../utils/sponsors';
import type { SponsorTypes } from '../../sanity/queryHelpers/fragments';

vi.mock('../../sanity/sanityImageUrl', () => ({
  urlFor: (source: { id: string }) => ({
    width: () => ({ url: () => `https://cdn.test/${source.id}.png` }),
  }),
}));

const logo = (id: string) => ({ id }) as never;

const sponsors: SponsorTypes[] = [
  { altText: 'Partner AS', tier: 'partner' },
  { altText: 'Hoved AS', tier: 'hovedsponsor', logo: logo('hoved'), link: 'https://hoved.no' },
  { altText: 'Vanlig AS', logo: logo('vanlig'), logoOnDark: logo('vanlig-lys') },
  { altText: 'Ond AS', tier: 'sponsor', link: 'javascript:alert(1)' },
];

describe('groupSponsorsByTier', () => {
  it('orders main sponsors first, treats a missing tier as sponsor, drops empty tiers', () => {
    const groups = groupSponsorsByTier(sponsors);
    expect(groups.map((g) => g.tier)).toEqual(['hovedsponsor', 'sponsor', 'partner']);
    expect(groups[1].sponsors.map((s) => s.altText)).toEqual(['Vanlig AS', 'Ond AS']);
    expect(groupSponsorsByTier([])).toEqual([]);
  });
});

describe('SponsorStrip', () => {
  it('shows only main sponsors', () => {
    render(<SponsorStrip sponsors={sponsors} />);
    expect(screen.getByText('Med støtte fra')).toBeInTheDocument();
    expect(screen.getByAltText('Hoved AS')).toBeInTheDocument();
    expect(screen.queryByText('Partner AS')).not.toBeInTheDocument();
  });

  it('renders nothing without a main sponsor', () => {
    const { container } = render(<SponsorStrip sponsors={[{ altText: 'X' }]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('SponsorGrid', () => {
  it('groups by tier under headings', () => {
    render(<SponsorGrid sponsors={sponsors} />);
    expect(
      screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent),
    ).toEqual(['Hovedsponsor', 'Sponsorer', 'Partnere']);
  });

  it('links a sponsor only through a safe URL, marked sponsored', () => {
    render(<SponsorGrid sponsors={sponsors} />);
    const link = screen.getByRole('link', { name: /^Hoved AS/ });
    expect(link).toHaveAttribute('href', 'https://hoved.no');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer sponsored');
    expect(screen.queryByRole('link', { name: /Ond AS/ })).not.toBeInTheDocument();
    expect(screen.getByText('Ond AS')).toBeInTheDocument();
  });

  it('uses the dark-mode logo when given, and a text tile without a logo', () => {
    render(<SponsorGrid sponsors={sponsors} />);
    const sources = screen.getAllByAltText('Vanlig AS').map((img) => img.getAttribute('src'));
    expect(sources).toEqual(['https://cdn.test/vanlig.png', 'https://cdn.test/vanlig-lys.png']);
    expect(screen.getByText('Partner AS').tagName).toBe('SPAN');
  });
});
