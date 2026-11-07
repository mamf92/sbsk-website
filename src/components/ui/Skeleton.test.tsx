import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton, SkeletonCard, SkeletonText } from './Skeleton';
import RouteFallback from '../sections/RouteFallback';

describe('Skeleton', () => {
  it('is a decorative, square, tinted block that the caller sizes', () => {
    render(<Skeleton className="h-6 w-1/2" />);
    const block = screen.getByTestId('skeleton');
    expect(block).toHaveAttribute('aria-hidden', 'true');
    expect(block).toHaveClass('bg-surface-muted', 'rounded-none', 'h-6', 'w-1/2');
  });

  it('pulses only when the OS allows motion', () => {
    render(<Skeleton />);
    const classes = screen.getByTestId('skeleton').className.split(/\s+/);
    expect(classes).toContain('motion-safe:animate-pulse');
    expect(classes).not.toContain('animate-pulse');
  });

  it('draws text lines with a shorter last line', () => {
    render(<SkeletonText lines={3} />);
    const lines = screen.getAllByTestId('skeleton');
    expect(lines).toHaveLength(3);
    expect(lines[2]).toHaveClass('w-2/3');
    expect(lines[0]).toHaveClass('w-full');
  });

  it('sketches a card as photo, tag, title and summary on a card surface', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toHaveClass('bg-surface', 'shadow-card');
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThanOrEqual(4);
  });
});

describe('RouteFallback', () => {
  it('announces the wait once, politely, behind a skeleton of the page', () => {
    render(<RouteFallback />);
    expect(screen.getByRole('status')).toHaveTextContent('Laster…');
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });
});
