import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingIndicator } from './LoadingIndicator';

describe('LoadingIndicator', () => {
  it('is a polite live region so the wait is announced, not just painted', () => {
    render(<LoadingIndicator label="Laster medlemmer…" />);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Laster medlemmer…');
  });

  it('defaults to a Norwegian label', () => {
    render(<LoadingIndicator />);
    expect(screen.getByRole('status')).toHaveTextContent('Laster…');
  });

  it('keeps the label for assistive tech when it is visually hidden', () => {
    render(<LoadingIndicator label="Laster studio…" labelHidden />);
    expect(screen.getByText('Laster studio…')).toHaveClass('sr-only');
  });

  it('shows a decorative spinner', () => {
    render(<LoadingIndicator />);
    expect(screen.getByTestId('spinner')).toHaveAttribute('aria-hidden', 'true');
  });

  it('sizes the spinner with the indicator', () => {
    const { unmount } = render(<LoadingIndicator size="sm" />);
    const sm = screen.getByTestId('spinner').className;
    unmount();

    render(<LoadingIndicator size="md" />);
    expect(screen.getByTestId('spinner').className).not.toBe(sm);
  });

  it('merges a caller className', () => {
    render(<LoadingIndicator className="p-6" />);
    expect(screen.getByRole('status')).toHaveClass('p-6');
  });
});
