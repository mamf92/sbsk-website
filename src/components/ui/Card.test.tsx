import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Card, type CardCategory } from './Card';

const categories: CardCategory[] = ['nyheter', 'spillkveld', 'arrangementer', 'turnering', 'annet'];

// Pins the contract, not the class values: the category fills get re-themed, but the
// accordion wiring, the static-card fallback and the collapsed panel staying out of the tab
// order are what consumers actually depend on.
describe('Card', () => {
  it('renders the title as a heading', () => {
    render(<Card title="Spillkveld i juni" />);
    expect(screen.getByRole('heading', { name: 'Spillkveld i juni' })).toBeInTheDocument();
  });

  it('renders the date and subtitle when given', () => {
    render(<Card date="5. juni" title="Spillkveld" subtitle="Bli med" />);

    expect(screen.getByText('5. juni')).toBeInTheDocument();
    expect(screen.getByText('Bli med')).toBeInTheDocument();
  });

  it('exposes the header as a toggle button and forwards the toggle', async () => {
    const onToggle = vi.fn();
    render(
      <Card title="Turneringen" onToggle={onToggle}>
        <p>Innhold</p>
      </Card>,
    );

    await userEvent.click(screen.getByRole('button', { expanded: false }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('announces open state through aria-expanded and points at the panel it controls', () => {
    const { rerender } = render(
      <Card title="Turneringen" onToggle={vi.fn()}>
        <p>Innhold</p>
      </Card>,
    );

    const collapsed = screen.getByRole('button');
    expect(collapsed).toHaveAttribute('aria-expanded', 'false');
    const panelId = collapsed.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    expect(document.getElementById(panelId as string)).toContainElement(
      screen.getByText('Innhold'),
    );

    rerender(
      <Card title="Turneringen" expanded onToggle={vi.fn()}>
        <p>Innhold</p>
      </Card>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });

  it('keeps a collapsed panel out of the tab order', () => {
    // `grid-rows-[0fr]` hides the panel visually but leaves its links focusable; `inert` is
    // the part that actually removes them, so it has to be pinned.
    const { rerender } = render(
      <Card title="Turneringen" onToggle={vi.fn()}>
        <a href="/paamelding">Meld deg på</a>
      </Card>,
    );

    const panelId = screen.getByRole('button').getAttribute('aria-controls') as string;
    expect(document.getElementById(panelId)).toHaveAttribute('inert');

    rerender(
      <Card title="Turneringen" expanded onToggle={vi.fn()}>
        <a href="/paamelding">Meld deg på</a>
      </Card>,
    );
    expect(document.getElementById(panelId)).not.toHaveAttribute('inert');
  });

  it('renders as a static block with no control when no toggle is passed', () => {
    render(
      <Card title="Om klubben">
        <p>Innhold</p>
      </Card>,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    // A block with nothing to collapse to shows its body rather than hiding it.
    expect(screen.getByText('Innhold')).toBeVisible();
  });

  it('reflects open state on the root so lift-card can style it', () => {
    const { container, rerender } = render(
      <Card title="Turneringen" onToggle={vi.fn()}>
        <p>Innhold</p>
      </Card>,
    );
    const root = container.querySelector('article') as HTMLElement;
    expect(root).toHaveAttribute('data-expanded', 'false');

    rerender(
      <Card title="Turneringen" expanded onToggle={vi.fn()}>
        <p>Innhold</p>
      </Card>,
    );
    expect(root).toHaveAttribute('data-expanded', 'true');
  });

  it('shows a decorative thumbnail of the image in the closed header, bled to the edge', () => {
    // The thumbnail is the post's own photo, so it must not carry a redundant accessible name —
    // and it sits with no gap against the header, which is the "bleeds to the edge" contract.
    const { container } = render(<Card title="Spillkveld" image="/bilde.jpg" />);
    const thumbnail = container.querySelector('h3 img');
    expect(thumbnail).toHaveAttribute('src', '/bilde.jpg');
    expect(thumbnail).toHaveAttribute('aria-hidden', 'true');
    expect(thumbnail).toHaveAttribute('alt', '');
    expect(thumbnail?.className).not.toMatch(/\bp-|\bm-/);
  });

  it('points the thumbnail at the hotspot via object-position', () => {
    const { container } = render(
      <Card title="Spillkveld" image="/bilde.jpg" imagePosition="30% 70%" />,
    );
    const thumbnail = container.querySelector('h3 img') as HTMLElement;
    expect(thumbnail.style.objectPosition).toBe('30% 70%');
  });

  it('omits the header thumbnail when there is no image', () => {
    const { container } = render(<Card title="Spillkveld" />);
    expect(container.querySelector('h3 img')).not.toBeInTheDocument();
  });

  it('collapses the header thumbnail to zero width once an interactive card opens', () => {
    const { container, rerender } = render(
      <Card title="Spillkveld" image="/bilde.jpg" onToggle={vi.fn()}>
        <p>Innhold</p>
      </Card>,
    );
    const thumbnail = () => container.querySelector('h3 img') as HTMLElement;
    expect(thumbnail().className).toContain('w-20');
    expect(thumbnail().className).not.toContain('w-0');

    rerender(
      <Card title="Spillkveld" image="/bilde.jpg" onToggle={vi.fn()} expanded>
        <p>Innhold</p>
      </Card>,
    );
    expect(thumbnail().className).toContain('w-0');
    expect(thumbnail().className).toContain('border-r-0');
  });

  it('keeps the thumbnail on a static card, which is always "open" but has nothing to replace it with', () => {
    const { container } = render(<Card title="Spillkveld" image="/bilde.jpg" />);
    const thumbnail = container.querySelector('h3 img') as HTMLElement;
    expect(thumbnail.className).toContain('w-20');
    expect(thumbnail.className).not.toContain('w-0');
  });

  it('no longer renders the image inside the panel — the caller shows it via SanityImage', () => {
    const { container } = render(
      <Card title="Spillkveld" image="/bilde.jpg" onToggle={vi.fn()} expanded>
        <p>Innhold</p>
      </Card>,
    );
    // The one <img> is the decorative header thumbnail; aria-hidden keeps it out of
    // `getByRole('img')`, so this asserts against the DOM directly.
    expect(container.querySelectorAll('img')).toHaveLength(1);
    expect(container.querySelector('.sbsk-rt img')).not.toBeInTheDocument();
  });

  it('omits the panel entirely when there is no body', () => {
    render(<Card title="Bare tittel" onToggle={vi.fn()} />);
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-controls');
  });

  it('omits the panel when only an image is given, since the image alone is not a body', () => {
    render(<Card title="Bare bilde" image="/bilde.jpg" onToggle={vi.fn()} />);
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-controls');
  });

  it('gives nyheter, spillkveld and arrangementer distinct fills', () => {
    const classes = (['nyheter', 'spillkveld', 'arrangementer'] as CardCategory[]).map(
      (category) => {
        const { container, unmount } = render(<Card category={category} title="x" />);
        const { className } = container.querySelector('article') as HTMLElement;
        unmount();
        return className;
      },
    );

    expect(new Set(classes).size).toBe(3);
  });

  it('aliases turnering onto spillkveld and annet onto arrangementer', () => {
    // Documented in the handoff: the two extra categories borrow a parent's colour pair
    // rather than introducing a fill of their own.
    const fillOf = (category: CardCategory) => {
      const { container, unmount } = render(<Card category={category} title="x" />);
      const { className } = container.querySelector('article') as HTMLElement;
      unmount();
      return className;
    };

    expect(fillOf('turnering')).toBe(fillOf('spillkveld'));
    expect(fillOf('annet')).toBe(fillOf('arrangementer'));
  });

  it('carries lift-card only when interactive, and never a competing transition utility', () => {
    // `lift-card` sets `transition` in full. A second transition-property utility on the same
    // element would win or lose by stylesheet order and silently drop half the interaction.
    for (const category of categories) {
      const { container, unmount } = render(
        <Card category={category} title="x" onToggle={vi.fn()} />,
      );
      const classes = (container.querySelector('article') as HTMLElement).className.split(/\s+/);
      unmount();

      expect(classes).toContain('lift-card');
      expect(classes.filter((name) => /^transition(-|$)/.test(name))).toHaveLength(0);
    }

    const { container } = render(<Card title="x" />);
    expect((container.querySelector('article') as HTMLElement).className).not.toContain(
      'lift-card',
    );
  });

  it('merges a caller-supplied className instead of dropping it', () => {
    const { container } = render(<Card title="x" className="max-w-md" />);
    expect(container.querySelector('article')).toHaveClass('max-w-md');
  });

  it('forwards arbitrary element attributes', () => {
    const { container } = render(<Card title="x" id="siste-nytt" data-testid="kort" />);
    expect(container.querySelector('article')).toHaveAttribute('id', 'siste-nytt');
    expect(screen.getByTestId('kort')).toBeInTheDocument();
  });

  it('exposes the underlying element through a ref', () => {
    const ref = { current: null as HTMLElement | null };
    render(<Card title="x" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current?.tagName).toBe('ARTICLE');
  });
});
