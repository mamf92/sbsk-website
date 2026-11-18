import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EventHero } from './EventHero';

describe('EventHero', () => {
  it('renders the one h1 with kicker, lead and meta', () => {
    render(
      <EventHero
        title="Board Game Masters"
        kicker={<span>XIX</span>}
        lead="Fire dager med brettspill."
        meta="28.–31. januar 2027 · Tasta bydelshus"
      />,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Board Game Masters' })).toBeVisible();
    expect(screen.getByText('XIX')).toBeInTheDocument();
    expect(screen.getByText('Fire dager med brettspill.')).toBeInTheDocument();
    expect(screen.getByText('28.–31. januar 2027 · Tasta bydelshus')).toBeInTheDocument();
  });

  it('shows no banner without an image', () => {
    render(<EventHero title="Spillkveld" />);
    expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
  });

  it('marks the title language when it differs from the page', () => {
    render(<EventHero title="Spillkveld" titleLang="nb" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('lang', 'nb');
  });

  it('keeps the caller className and forwards the ref', () => {
    const ref = createRef<HTMLElement>();
    render(<EventHero ref={ref} title="A" className="extra" />);
    expect(ref.current).toHaveClass('extra');
    expect(ref.current?.tagName).toBe('HEADER');
  });
});
