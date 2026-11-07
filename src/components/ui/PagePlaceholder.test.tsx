import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PagePlaceholder } from './PagePlaceholder';

const renderPlaceholder = (props: Parameters<typeof PagePlaceholder>[0]) =>
  render(
    <MemoryRouter>
      <PagePlaceholder {...props} />
    </MemoryRouter>,
  );

describe('PagePlaceholder', () => {
  it('renders the title as the page h1', () => {
    renderPlaceholder({ title: 'Våre spill' });

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('Våre spill');
  });

  // The six routes this replaces titled themselves with a <div>, so a screen reader landing on
  // /om-oss got a `main` landmark containing one unlabelled text node. Pinning the level here is
  // the whole point of the component existing.
  it('does not use a div for the page title', () => {
    renderPlaceholder({ title: 'Om oss' });

    expect(screen.getByText('Om oss').tagName).toBe('H1');
  });

  it('renders the description when given one and omits it otherwise', () => {
    const { unmount } = renderPlaceholder({ title: 'Om oss', description: 'Kommer snart.' });
    expect(screen.getByText('Kommer snart.')).toBeInTheDocument();
    unmount();

    renderPlaceholder({ title: 'Om oss' });
    expect(screen.queryByText('Kommer snart.')).not.toBeInTheDocument();
  });

  it('offers the calendar and membership routes by default, as links, the first one orange', () => {
    renderPlaceholder({ title: 'Om oss' });

    const calendar = screen.getByRole('link', { name: /Se kalender/ });
    expect(calendar).toHaveAttribute('href', '/kalender');
    expect(calendar).toHaveClass('bg-primary');
    const join = screen.getByRole('link', { name: /Bli medlem/ });
    expect(join).toHaveAttribute('href', '/bli-medlem');
    expect(join).not.toHaveClass('bg-primary');
  });

  it('lets a page that would link to itself narrow the actions', () => {
    renderPlaceholder({
      title: 'Bli medlem',
      actions: [{ label: 'Se kalender', to: '/kalender' }],
    });

    expect(screen.getByRole('link', { name: /Se kalender/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Bli medlem/ })).not.toBeInTheDocument();
  });

  // Dark mode is the reason #147 was a P2: four of the six routes had a bare `bg-white`, so in
  // dark mode they rendered a full-height white slab between a darkblue header and a
  // darkestblue footer. Both halves of the pair have to be present.
  it('paints a fill in both themes', () => {
    renderPlaceholder({ title: 'Om oss' });

    const section = screen.getByRole('heading', { level: 1 }).closest('section');
    // `bg-page` has a light and a dark value, so one class covers both themes.
    expect(section?.className).toContain('bg-page');
  });

  // The shell already gives `main` `flex-1`. A viewport-height floor on top of that produced a
  // scrollbar on short viewports for pages with no content.
  it('fills the shell without a viewport-height floor', () => {
    renderPlaceholder({ title: 'Om oss' });

    const section = screen.getByRole('heading', { level: 1 }).closest('section');
    expect(section?.className).toContain('flex-1');
    expect(section?.className).not.toMatch(/min-h-/);
  });
});
