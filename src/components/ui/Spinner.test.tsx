import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('is decorative, because its container carries the busy state', () => {
    render(<Spinner />);
    expect(screen.getByTestId('spinner')).toHaveAttribute('aria-hidden', 'true');
  });

  it('is one of the two round things in the system, and keeps turning slowly under reduced motion', () => {
    render(<Spinner />);
    const spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveClass('rounded-full', 'animate-spin');
    expect(spinner.className).toContain('motion-reduce:[animation-duration:2.4s]');
  });

  it('inherits its colour from the text around it', () => {
    render(<Spinner />);
    expect(screen.getByTestId('spinner')).toHaveClass('border-current');
  });
});
