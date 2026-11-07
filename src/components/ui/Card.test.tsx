import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Card } from './Card';
import { Tag } from './Tag';

const renderCard = (props: Partial<React.ComponentProps<typeof Card>> = {}) =>
  render(
    <MemoryRouter>
      <Card to="/innlegg/abc" title="Høstprogrammet er klart" {...props} />
    </MemoryRouter>,
  );

describe('Card', () => {
  it('is one link, named by its title, to the item’s own page', () => {
    renderCard();
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName('Høstprogrammet er klart');
    expect(links[0]).toHaveAttribute('href', '/innlegg/abc');
  });

  it('stretches the link over the whole card, so the card is the click target', () => {
    renderCard();
    expect(screen.getByRole('link').className).toContain('after:inset-0');
    expect(screen.getByRole('article')).toHaveClass('relative');
  });

  it('heads at h3 by default and h2 on request', () => {
    const { unmount } = renderCard();
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Høstprogrammet');
    unmount();
    renderCard({ headingLevel: 2 });
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('shows tag, date and summary when given', () => {
    renderCard({
      tag: <Tag>Nyheter</Tag>,
      date: <time dateTime="2026-09-01">1. september 2026</time>,
      summary: 'Alt du trenger å vite om høsten.',
    });
    expect(screen.getByText('Nyheter')).toBeInTheDocument();
    expect(screen.getByText('1. september 2026')).toBeInTheDocument();
    expect(screen.getByText('Alt du trenger å vite om høsten.')).toHaveClass('line-clamp-2');
  });

  it('shows a decorative photo at the hotspot, or keeps the slot as a tinted block', () => {
    const { container, unmount } = renderCard({
      image: { src: 'https://example.test/a.jpg', position: '30% 40%' },
    });
    const img = container.querySelector('img')!;
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveClass('aspect-video');
    expect(img.style.objectPosition).toBe('30% 40%');
    unmount();

    renderCard();
    expect(screen.getByTestId('card-image-placeholder')).toHaveClass('aspect-video');
  });

  it('is a square white card with the soft card shadow, and nothing moves on hover', () => {
    renderCard();
    const card = screen.getByRole('article');
    expect(card).toHaveClass('bg-surface', 'shadow-card', 'rounded-none');
    expect(card.className).not.toMatch(/lift|translate|scale/);
    expect(screen.getByRole('link').className).toContain('group-hover:underline');
  });

  it('outlines the whole card when its link has keyboard focus', () => {
    renderCard();
    expect(screen.getByRole('article').className).toContain('has-[a:focus-visible]:outline-focus');
  });

  it('forwards a ref and merges a className', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <MemoryRouter>
        <Card ref={ref} to="/" title="x" className="w-full" />
      </MemoryRouter>,
    );
    expect(ref.current).toBe(screen.getByRole('article'));
    expect(ref.current).toHaveClass('w-full');
  });
});
