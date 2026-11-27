import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MembershipCardFace } from './MembershipCardFace';

describe('MembershipCardFace', () => {
  it('shows the name and the season', () => {
    render(<MembershipCardFace name="Kari Nordmann" season={2026} />);
    expect(screen.getByText('Kari Nordmann')).toBeInTheDocument();
    expect(screen.getByText('Medlemskort 2026')).toBeInTheDocument();
  });

  it('asks for a name when none is typed yet', () => {
    render(<MembershipCardFace name="" />);
    expect(screen.getByText('Ditt navn')).toBeInTheDocument();
  });

  it('is decoration, hidden from assistive tech, and carries an optional stamp', () => {
    const { container } = render(<MembershipCardFace name="Kari" stamp="Søkt" />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Søkt')).toBeInTheDocument();
  });
});
