import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingIndicator, LoadingPips } from './LoadingIndicator';

describe('LoadingIndicator', () => {
  it('is a polite live region so the wait is announced, not just painted', () => {
    render(<LoadingIndicator label="Laster medlemmer…" />);

    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent('Laster medlemmer…');
  });

  it('defaults to a Norwegian label', () => {
    render(<LoadingIndicator />);
    expect(screen.getByRole('status')).toHaveTextContent('Laster…');
  });

  it('keeps the label for assistive tech when it is visually hidden', () => {
    render(<LoadingIndicator label="Laster studio…" labelHidden />);

    const label = screen.getByText('Laster studio…');
    expect(label).toBeInTheDocument();
    expect(label.className).toContain('sr-only');
  });

  it('renders four stepping pips, hidden from assistive tech', () => {
    const { container } = render(<LoadingIndicator />);

    expect(container.querySelectorAll('.sbsk-load-pip')).toHaveLength(4);
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('applies a distinct class list for every size', () => {
    const sizes = ['sm', 'md'] as const;

    const classes = sizes.map((size) => {
      const { container, unmount } = render(<LoadingPips size={size} />);
      const className = container.querySelector('.sbsk-load-pip')!.className;
      unmount();
      return className;
    });

    expect(new Set(classes).size).toBe(sizes.length);
  });

  it('merges a caller className', () => {
    render(<LoadingIndicator className="p-6" />);
    expect(screen.getByRole('status').className).toContain('p-6');
  });
});
