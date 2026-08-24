import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AboutUsSection from './AboutUsSection';
import type { BoardMemberTypes } from '../../../sanity/queryHelpers/board-members';

vi.mock('../../../sanity/sanityImageUrl', () => ({
  urlFor: () => ({
    width: () => ({
      height: () => ({ fit: () => ({ url: () => 'https://example.test/image.jpg' }) }),
    }),
  }),
}));

const boardMembers: BoardMemberTypes[] = [
  { _id: 'm1', name: 'Anne Berg' },
  { _id: 'm2', name: 'Ola Nordmann', role: 'Leder', bio: 'Har vært med lenge.' },
];

describe('AboutUsSection', () => {
  it('renders the club heading and body as h1 with one h2 for the board', () => {
    render(<AboutUsSection boardMembers={[]} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Om klubben' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Om styret' })).toBeInTheDocument();
  });

  it('falls back to the club’s own board when Sanity has no members yet', () => {
    render(<AboutUsSection boardMembers={[]} />);

    expect(screen.getByText('Astrid Lindgren')).toBeInTheDocument();
  });

  it('renders the board members passed in when there are any', () => {
    render(<AboutUsSection boardMembers={boardMembers} />);

    expect(screen.getByText('Anne Berg')).toBeInTheDocument();
    expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    expect(screen.queryByText('Astrid Lindgren')).not.toBeInTheDocument();
  });

  it('shows initials for a member with no portrait', () => {
    render(<AboutUsSection boardMembers={boardMembers} />);

    expect(screen.getByText('AB')).toBeInTheDocument();
  });

  it('prefers Sanity content over the fallback copy when an aboutPage doc is present', () => {
    render(
      <AboutUsSection
        aboutPage={{ clubTitle: 'Klubben vår', boardTitle: 'Styret vårt' }}
        boardMembers={[]}
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Klubben vår' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Styret vårt' })).toBeInTheDocument();
  });
});
