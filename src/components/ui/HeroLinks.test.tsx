import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { HeroLinks, type HeroLink } from './HeroLinks';

const FALLBACK: HeroLink[] = [
  { label: 'Se kalender', url: '/kalender' },
  { label: 'Bli medlem', url: '/bli-medlem' },
];

function CurrentPath() {
  return <span data-testid="path">{useLocation().pathname}</span>;
}

function renderLinks(links?: HeroLink[]) {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <HeroLinks links={links} fallback={FALLBACK} />
              <CurrentPath />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('HeroLinks', () => {
  it('falls back to the page default when the Studio has nothing set', () => {
    renderLinks();
    expect(screen.getByRole('button', { name: /Se kalender/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bli medlem/ })).toBeInTheDocument();
  });

  it('treats an empty array as nothing set, rather than as an empty hero', () => {
    renderLinks([]);
    expect(screen.getByRole('button', { name: /Se kalender/ })).toBeInTheDocument();
  });

  it("renders the editor's links instead of the fallback once there are any", () => {
    renderLinks([{ label: 'Kjøp spill', url: '/våre-spill' }]);
    expect(screen.getByRole('button', { name: /Kjøp spill/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Se kalender/ })).not.toBeInTheDocument();
  });

  // The schema caps at three, but a document saved before that rule existed, or written
  // through the API, can still carry more.
  it('renders at most three, whatever the document says', () => {
    renderLinks(
      ['En', 'To', 'Tre', 'Fire'].map((label) => ({ label, url: `/${label.toLowerCase()}` })),
    );
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.queryByRole('button', { name: /Fire/ })).not.toBeInTheDocument();
  });

  it('navigates in-app for a bare path', async () => {
    const user = userEvent.setup();
    renderLinks([{ label: 'Kalender', url: '/kalender' }]);

    await user.click(screen.getByRole('button', { name: /Kalender/ }));
    expect(screen.getByTestId('path')).toHaveTextContent('/kalender');
  });

  // The URL an editor is most likely to paste is the one from their address bar. Handing that
  // to navigate() verbatim — which the home hero used to do — lands on the 404 page.
  //
  // The expected path carries `/sbsk-website` because `VITE_BASE` is unset under vitest, so
  // there is no basename to strip; on Pages it resolves to `/om-oss`, which
  // `internalLinks.test.ts` pins with the basename stubbed. Asserted on `textContent` rather
  // than `toHaveTextContent`, which is a substring match and would have passed either way.
  it('navigates in-app for a full URL copied from the deployed site', async () => {
    const user = userEvent.setup();
    renderLinks([{ label: 'Om oss', url: 'https://mamf92.github.io/sbsk-website/om-oss' }]);

    await user.click(screen.getByRole('button', { name: /Om oss/ }));
    expect(screen.getByTestId('path').textContent).toBe('/sbsk-website/om-oss');
  });

  // Neither half of a link row was required until this shipped, so a published document can
  // carry one with only a label. Reaching `isInternalLink` with `undefined` is not a broken
  // button — it is a render-time TypeError that takes the whole page to the error boundary.
  it('skips a half-filled row rather than throwing the page away', () => {
    renderLinks([
      { label: 'Uferdig' } as HeroLink,
      { label: 'Kalender', url: '/kalender' },
      { url: '/om-oss' } as HeroLink,
    ]);

    expect(screen.getByRole('button', { name: /Kalender/ })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /Uferdig/ })).not.toBeInTheDocument();
  });

  it('falls back when every authored row is unusable', () => {
    renderLinks([{ label: 'Uferdig' } as HeroLink]);
    expect(screen.getByRole('button', { name: /Se kalender/ })).toBeInTheDocument();
  });

  // The schema allows mailto:/tel: too, and a new tab for one of those opens the handler and
  // leaves an empty tab behind.
  it('does not open a mailto in a blank tab', () => {
    renderLinks([{ label: 'Send e-post', url: 'mailto:sbsklubb@hotmail.com' }]);

    const link = screen.getByRole('link', { name: /Send e-post/ });
    expect(link).toHaveAttribute('href', 'mailto:sbsklubb@hotmail.com');
    expect(link).not.toHaveAttribute('target');
    expect(link).not.toHaveAttribute('rel');
  });

  it('sends a genuinely external destination out as a link, not through the router', () => {
    renderLinks([{ label: 'Outland', url: 'https://www.outland.no/' }]);

    const link = screen.getByRole('link', { name: /Outland/ });
    expect(link).toHaveAttribute('href', 'https://www.outland.no/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.queryByRole('button', { name: /Outland/ })).not.toBeInTheDocument();
  });

  it('gives the external link the same button treatment, focus ring included', () => {
    renderLinks([{ label: 'Outland', url: 'https://www.outland.no/' }]);
    // The bug `buttonClasses` exists to prevent: hand-rebuilt anchors that drop the focus ring.
    expect(screen.getByRole('link', { name: /Outland/ }).className).toContain(
      'focus-visible:outline-focus-ring',
    );
  });
});
