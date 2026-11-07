import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Chip } from './Chip';

describe('Chip', () => {
  it('renders its children as an accessible button', () => {
    render(<Chip>Spillkveld</Chip>);
    expect(screen.getByRole('button', { name: 'Spillkveld' })).toBeInTheDocument();
  });

  it('forwards clicks', async () => {
    const onClick = vi.fn();
    render(<Chip onClick={onClick}>Turnering</Chip>);

    await userEvent.click(screen.getByRole('button', { name: 'Turnering' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is a plain button, so it never submits a surrounding form', () => {
    render(<Chip>Annet</Chip>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('announces its state with aria-pressed', () => {
    const { rerender } = render(<Chip>Annet</Chip>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');

    rerender(<Chip active>Annet</Chip>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows a tick when selected, so the state is shape as well as colour', () => {
    const { container, rerender } = render(<Chip>Annet</Chip>);
    expect(container.querySelector('svg')).toBeNull();

    rerender(<Chip active>Annet</Chip>);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('button', { name: 'Annet' })).toHaveClass('bg-secondary');
  });

  it('is square, and hover changes only colour', () => {
    render(<Chip>Annet</Chip>);
    const classes = screen.getByRole('button').className;
    expect(classes).toContain('rounded-none');
    expect(classes).toContain('transition-colors');
    expect(classes).not.toMatch(/lift|translate|shadow/);
  });

  it('merges a caller className', () => {
    render(<Chip className="capitalize">nyheter</Chip>);
    expect(screen.getByRole('button')).toHaveClass('capitalize');
  });
});
