import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar, type AvatarSize } from './Avatar';

const sizes: AvatarSize[] = ['xs', 'sm', 'md', 'lg'];

// Pins the contract, not the class values: the fill and the exact pixel scale move when the
// design system is re-themed, but the name must stay announced once and the photo must keep
// winning over the initials.
describe('Avatar', () => {
  it('falls back to initials and stays reachable by its name', () => {
    render(<Avatar name="Anne Berg" />);

    const avatar = screen.getByRole('img', { name: 'Anne Berg' });
    expect(avatar).toHaveTextContent('AB');
  });

  it('renders the photo when one is given, and drops the initials', () => {
    render(<Avatar name="Anne Berg" src="https://example.com/anne.jpg" />);

    const avatar = screen.getByRole('img', { name: 'Anne Berg' });
    expect(avatar).not.toHaveTextContent('AB');
    expect(avatar.querySelector('img')).toHaveAttribute('src', 'https://example.com/anne.jpg');
  });

  it('leaves the inner image decorative so the name is not announced twice', () => {
    render(<Avatar name="Anne Berg" src="https://example.com/anne.jpg" />);

    // One accessible node for the avatar, not two.
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('img').querySelector('img')).toHaveAttribute('alt', '');
  });

  it('applies a distinct class for every size', () => {
    const classes = sizes.map((size) => {
      const { unmount } = render(<Avatar name="Anne Berg" size={size} />);
      const { className } = screen.getByRole('img');
      unmount();
      return className;
    });

    expect(new Set(classes).size).toBe(sizes.length);
  });

  it('forwards arbitrary attributes', () => {
    render(<Avatar name="Anne Berg" data-testid="deltaker" />);
    expect(screen.getByTestId('deltaker')).toBeInTheDocument();
  });

  it('merges a caller-supplied className instead of dropping it', () => {
    render(<Avatar name="Anne Berg" className="opacity-50" />);
    expect(screen.getByRole('img')).toHaveClass('opacity-50');
  });

  it('exposes the underlying element through a ref', () => {
    const ref = { current: null as HTMLSpanElement | null };
    render(<Avatar name="Anne Berg" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});
