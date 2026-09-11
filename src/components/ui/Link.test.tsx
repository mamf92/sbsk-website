import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Link, linkClassesInherit, navLinkClasses } from './Link';

describe('Link', () => {
  it('renders its children as an accessible link', () => {
    render(<Link href="/kalender">Se hele kalenderen</Link>);
    expect(screen.getByRole('link', { name: 'Se hele kalenderen' })).toHaveAttribute(
      'href',
      '/kalender',
    );
  });

  it('forwards clicks', async () => {
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
    render(
      <Link href="#" onClick={onClick}>
        Les mer
      </Link>,
    );

    await userEvent.click(screen.getByRole('link', { name: 'Les mer' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('forwards arbitrary anchor attributes', () => {
    render(
      <Link href="https://www.outland.no/" target="_blank" rel="noreferrer">
        Outland
      </Link>,
    );

    const link = screen.getByRole('link', { name: 'Outland' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });

  it('applies a distinct class for every variant', () => {
    const variants = ['default', 'muted'] as const;

    const classes = variants.map((variant) => {
      const { unmount } = render(
        <Link href="#" variant={variant}>
          x
        </Link>,
      );
      const { className } = screen.getByRole('link');
      unmount();
      return className;
    });

    expect(new Set(classes).size).toBe(variants.length);
  });

  it('underlines on hover rather than lifting', () => {
    // Text links are the one interactive surface that does not lift.
    render(<Link href="#">Les mer</Link>);
    const classes = screen.getByRole('link').className.split(/\s+/);

    expect(classes).toContain('hover:underline');
    expect(classes).not.toContain('lift');
    expect(classes).not.toContain('lift-chip');
  });

  it('merges a caller-supplied className instead of dropping it', () => {
    render(
      <Link href="#" className="font-bold">
        Fet
      </Link>,
    );
    expect(screen.getByRole('link')).toHaveClass('font-bold');
  });

  it('exposes the underlying element through a ref', () => {
    const ref = { current: null as HTMLAnchorElement | null };
    render(
      <Link href="#" ref={ref}>
        Ref
      </Link>,
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });
});

describe('navLinkClasses', () => {
  it('drives the underline off aria-current, which is what NavLink sets', () => {
    // Router NavLinks get `aria-current="page"` on the active route; that attribute is the
    // only thing holding the rule open, so losing it would silently break the active state.
    expect(navLinkClasses).toContain('aria-[current=page]:after:scale-x-100');
    expect(navLinkClasses).toContain('aria-[current=page]:text-orange');
  });

  it('wipes the rule in from the left on hover', () => {
    expect(navLinkClasses).toContain('after:origin-left');
    expect(navLinkClasses).toContain('after:scale-x-0');
    expect(navLinkClasses).toContain('hover:after:scale-x-100');
  });

  it('is positioned so the absolute rule has something to anchor to', () => {
    expect(navLinkClasses.split(/\s+/)).toContain('relative');
  });
});

describe('Link — the inherit variant', () => {
  // Why there is no fourth, fifth and sixth colour variant: these surfaces have already had
  // their foreground checked against their own fill, so borrowing it is correct in every theme
  // by construction, where naming a colour here would be right on one fill and wrong on the next.
  it('names no colour of its own', () => {
    render(
      <Link href="#" variant="inherit">
        Foto: Ola
      </Link>,
    );

    const link = screen.getByRole('link', { name: 'Foto: Ola' });
    expect(link).toHaveClass('text-current');
    expect(link.className).not.toMatch(/\btext-(darkblue|orange|gray-neutral|white)\b/);
  });

  it('still draws the focus ring, which is the whole reason these links moved here', () => {
    render(
      <Link href="#" variant="inherit">
        Foto: Ola
      </Link>,
    );

    expect(screen.getByRole('link', { name: 'Foto: Ola' })).toHaveClass(
      'focus-visible:outline-focus-ring',
    );
  });
});

describe('linkClassesInherit', () => {
  // It is spelled out rather than composed from `base`, matching how `navLinkClassesBody` is
  // written. This is the cost of writing it twice, paid here.
  it('matches what the inherit variant renders', () => {
    render(
      <Link href="#" variant="inherit">
        Foto: Ola
      </Link>,
    );
    const rendered = screen.getByRole('link', { name: 'Foto: Ola' }).className;

    const tokens = (value: string) => new Set(value.split(/\s+/).filter(Boolean));
    expect(tokens(linkClassesInherit)).toEqual(tokens(rendered));
  });
});
