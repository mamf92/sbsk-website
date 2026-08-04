import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Buttons';

// These assertions pin the design-system contract for Button. When the Claude
// Design library is ported, the class values change but the contract must not:
// variants and sizes stay distinct, icons render, and props reach the DOM.
describe('Button', () => {
  it('renders its children as an accessible button', () => {
    render(<Button>Bli medlem</Button>);
    expect(screen.getByRole('button', { name: 'Bli medlem' })).toBeInTheDocument();
  });

  it('forwards clicks', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Send</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('forwards arbitrary button attributes', () => {
    render(
      <Button type="submit" aria-label="Lagre profil" disabled>
        Lagre
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Lagre profil' });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toBeDisabled();
  });

  it('applies a distinct class for every variant', () => {
    const variants = ['primary', 'secondary', 'tertiary', 'toggle', 'disabled'] as const;

    const classes = variants.map((variant) => {
      const { unmount } = render(<Button variant={variant}>x</Button>);
      const className = screen.getByRole('button').className;
      unmount();
      return className;
    });

    expect(new Set(classes).size).toBe(variants.length);
  });

  it('applies a distinct class for every size', () => {
    const sizes = ['xs', 'sm', 'md', 'lg'] as const;

    const classes = sizes.map((size) => {
      const { unmount } = render(<Button size={size}>x</Button>);
      const className = screen.getByRole('button').className;
      unmount();
      return className;
    });

    expect(new Set(classes).size).toBe(sizes.length);
  });

  it('defaults to the primary variant at medium size', () => {
    render(<Button>Standard</Button>);
    const { className } = screen.getByRole('button');

    render(
      <Button variant="primary" size="md">
        Eksplisitt
      </Button>,
    );
    const explicit = screen.getByRole('button', { name: 'Eksplisitt' }).className;

    expect(className).toBe(explicit);
  });

  it('renders no icon by default', () => {
    const { container } = render(<Button>Ingen ikon</Button>);
    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders an icon when one is requested', () => {
    const { container } = render(<Button icon="right">Neste</Button>);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('gives every icon class list a space-separated fill-current', () => {
    // Guards the `w-5fill-current` typo class, which silently produced no styling.
    for (const icon of ['left', 'right'] as const) {
      const { container, unmount } = render(<Button icon={icon}>x</Button>);
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('class')?.split(/\s+/)).toContain('fill-current');
      unmount();
    }
  });

  it('merges a caller-supplied className instead of dropping it', () => {
    render(<Button className="w-full">Full bredde</Button>);
    expect(screen.getByRole('button')).toHaveClass('w-full');
  });

  it('exposes the underlying element through a ref', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
