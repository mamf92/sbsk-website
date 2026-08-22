import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GameCard } from './GameCard';

const baseProps = {
  title: 'Wingspan',
  difficulty: 2 as const,
  time: '40–70',
  players: '1–5',
  buyUrl: 'https://www.outland.no/wingspan',
  sponsor: 'Outland',
  discountPercent: 15,
  discountCode: 'SBSK15',
  member: false,
};

describe('GameCard', () => {
  it('shows the plain buy label and lets the click navigate straight out for a non-member', () => {
    render(<GameCard {...baseProps} />);

    const buy = screen.getByRole('link', { name: /Kjøp hos Outland/ });
    expect(buy).toHaveAttribute('href', baseProps.buyUrl);
    expect(buy).toHaveAttribute('target', '_blank');
  });

  it('intercepts the buy click for a member and hands the redirect to the caller', async () => {
    const onBuy = vi.fn();
    render(<GameCard {...baseProps} member onBuy={onBuy} />);

    const buy = screen.getByRole('link', { name: /Kjøp med −15 % rabatt/ });
    await userEvent.click(buy);

    expect(onBuy).toHaveBeenCalledWith({
      title: 'Wingspan',
      sponsor: 'Outland',
      discountCode: 'SBSK15',
      buyUrl: baseProps.buyUrl,
    });
  });

  it('shows the member discount flag only for a member', () => {
    const { rerender } = render(<GameCard {...baseProps} />);
    expect(screen.queryByText('−15% MEDLEM')).not.toBeInTheDocument();

    rerender(<GameCard {...baseProps} member />);
    expect(screen.getByText('−15% MEDLEM')).toBeInTheDocument();
  });

  it('falls back to the "Spillfoto" placeholder without an image', () => {
    render(<GameCard {...baseProps} />);
    expect(screen.getByText('Spillfoto')).toBeInTheDocument();
  });

  it('renders an image and hides the placeholder once one is set', () => {
    // The cover photo is decorative (`alt=""`), so it carries no accessible name and does not
    // surface through `getByRole('img')` — the difficulty pips' own `role="img"` would be the
    // only match. A plain DOM query is the honest way to assert the `src` landed.
    const { container } = render(
      <GameCard {...baseProps} image="https://example.test/wingspan.jpg" />,
    );
    expect(screen.queryByText('Spillfoto')).not.toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://example.test/wingspan.jpg',
    );
  });

  it('announces the difficulty level for assistive tech', () => {
    render(<GameCard {...baseProps} difficulty={3} />);
    expect(screen.getByRole('img', { name: 'Vanskelighetsgrad: Vanskelig' })).toBeInTheDocument();
  });

  it('shows the BGG and YouTube links only when their URLs are set', () => {
    const { rerender } = render(<GameCard {...baseProps} />);
    expect(screen.queryByRole('link', { name: /BoardGameGeek/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /YouTube/ })).not.toBeInTheDocument();

    rerender(
      <GameCard
        {...baseProps}
        bggUrl="https://boardgamegeek.com/boardgame/266192"
        videoUrl="https://youtube.com/watch?v=abc"
      />,
    );
    expect(screen.getByRole('link', { name: /BoardGameGeek/ })).toHaveAttribute(
      'href',
      'https://boardgamegeek.com/boardgame/266192',
    );
    expect(screen.getByRole('link', { name: /YouTube/ })).toHaveAttribute(
      'href',
      'https://youtube.com/watch?v=abc',
    );
  });
});
