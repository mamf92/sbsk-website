import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AvatarStack, type AvatarStackPerson } from './AvatarStack';

const people: AvatarStackPerson[] = [
  { name: 'Anne Berg' },
  { name: 'Kari Lund' },
  { name: 'Martin Fischer' },
  { name: 'Tor Solberg' },
  { name: 'Rita Nilsen' },
];

describe('AvatarStack', () => {
  it('renders one avatar per person when they all fit', () => {
    render(<AvatarStack people={people.slice(0, 3)} max={3} />);

    expect(screen.getAllByRole('img')).toHaveLength(3);
    expect(screen.getByRole('img', { name: 'Anne Berg' })).toBeInTheDocument();
  });

  it('collapses the overflow into a +N counter', () => {
    render(<AvatarStack people={people} max={3} />);

    // Three avatars plus the counter, which is labelled rather than left as bare text.
    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Tor Solberg' })).not.toBeInTheDocument();
  });

  it('shows no counter when nothing overflows', () => {
    render(<AvatarStack people={people.slice(0, 2)} max={3} />);
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('makes the counter a button only when onMore is given', async () => {
    const onMore = vi.fn();
    const { rerender } = render(<AvatarStack people={people} max={3} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    rerender(<AvatarStack people={people} max={3} onMore={onMore} />);
    await userEvent.click(screen.getByRole('button', { name: 'Vis 2 deltakere til' }));
    expect(onMore).toHaveBeenCalledOnce();
  });

  it('renders nothing but the wrapper for an empty list', () => {
    render(<AvatarStack people={[]} data-testid="stack" />);

    expect(screen.getByTestId('stack')).toBeEmptyDOMElement();
  });

  it('tucks the avatars together only when overlapping', () => {
    const { rerender } = render(<AvatarStack people={people.slice(0, 3)} data-testid="stack" />);
    const spaced = screen.getByTestId('stack').className;

    rerender(<AvatarStack people={people.slice(0, 3)} overlap data-testid="stack" />);
    expect(screen.getByTestId('stack').className).not.toBe(spaced);
  });

  it('merges a caller-supplied className instead of dropping it', () => {
    render(<AvatarStack people={people} className="w-full" data-testid="stack" />);
    expect(screen.getByTestId('stack')).toHaveClass('w-full');
  });

  it('gives the "+N" button a visible focus ring', () => {
    render(<AvatarStack people={people} max={3} onMore={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Vis 2 deltakere til' })).toHaveClass(
      'focus-visible:outline-focus-ring',
    );
  });

  it('exposes the underlying element through a ref', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<AvatarStack people={people} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
