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

  // jsdom does not load the stylesheet, so the hover/press offsets themselves are not
  // observable here. These pin the wiring instead: who opts into `lift`, who opts out, and
  // the cascade rule that makes the two mistakes above silent rather than loud.
  describe('the solid-lift micro-interaction', () => {
    const pressable = ['primary', 'secondary', 'tertiary', 'toggle'] as const;

    it.each(pressable)('gives the %s variant the lift', (variant) => {
      render(<Button variant={variant}>x</Button>);
      expect(screen.getByRole('button')).toHaveClass('lift');
    });

    it('withholds the lift from the disabled variant', () => {
      render(<Button variant="disabled">x</Button>);
      const button = screen.getByRole('button');

      expect(button).not.toHaveClass('lift');
      // It still swaps colour on the same 120ms clock, it just never moves.
      expect(button).toHaveClass('transition-colors');
    });

    it('never puts lift and a competing transition utility on the same element', () => {
      const variants = ['primary', 'secondary', 'tertiary', 'toggle', 'disabled'] as const;

      for (const variant of variants) {
        const { unmount } = render(<Button variant={variant}>x</Button>);
        const classes = screen.getByRole('button').className.split(/\s+/);
        unmount();

        // `lift` sets `transition` in full. A second transition-property utility would win
        // or lose by stylesheet order and silently drop half the interaction.
        const competing = classes.filter(
          (name) => name === 'transition' || name.startsWith('transition-'),
        );
        expect(classes.includes('lift') && competing.length > 0).toBe(false);
      }
    });
  });

  it('disables itself while loading, so a form cannot be submitted twice', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Logg inn
      </Button>,
    );

    const button = screen.getByRole('button', { name: /Logg inn/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');

    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('keeps its label while loading, so the button does not change width', () => {
    render(<Button loading>Logg inn</Button>);
    expect(screen.getByRole('button', { name: /Logg inn/ })).toHaveTextContent('Logg inn');
  });

  it('swaps the icon for the stepping pips while loading', () => {
    const { container, unmount } = render(<Button icon="right">Logg inn</Button>);
    expect(container.querySelectorAll('.sbsk-load-pip')).toHaveLength(0);
    unmount();

    const loadingRender = render(
      <Button icon="right" loading>
        Logg inn
      </Button>,
    );
    expect(loadingRender.container.querySelectorAll('.sbsk-load-pip')).toHaveLength(4);
  });

  it('shows the pips even when no icon was asked for', () => {
    const { container } = render(<Button loading>Lagre</Button>);
    expect(container.querySelectorAll('.sbsk-load-pip')).toHaveLength(4);
  });

  it('is not busy and not disabled by default', () => {
    render(<Button>Logg inn</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute('aria-busy');
  });

  it('still honours an explicit disabled alongside loading', () => {
    render(<Button disabled>Lagre</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not take its hover colour while disabled', () => {
    render(<Button disabled>Lagre</Button>);
    const { className } = screen.getByRole('button');

    // `:hover` still matches a disabled element, so the hover colour has to be gated.
    expect(className).toContain('not-disabled:hover:');
    expect(className).not.toMatch(/(?<!not-disabled:)hover:bg-/);
  });
});
