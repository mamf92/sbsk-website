import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Footer from './Footer';
import { MotionProvider } from '../../hooks/motion/MotionProvider';

function renderFooter() {
  return render(
    <MemoryRouter>
      <MotionProvider>
        <Footer />
      </MotionProvider>
    </MemoryRouter>,
  );
}

describe('Footer — links (decision 6)', () => {
  it('carries Board Game Masters and Partnere, which left the header', () => {
    renderFooter();
    expect(screen.getByRole('link', { name: 'Board Game Masters' })).toHaveAttribute(
      'href',
      '/board-game-masters',
    );
    expect(screen.getByRole('link', { name: 'Våre partnere' })).toBeInTheDocument();
  });

  it('has no motion switch: reduced motion follows the OS', () => {
    renderFooter();
    expect(screen.queryByRole('button', { name: 'Reduser animasjoner' })).toBeNull();
  });
});

/**
 * #253. Two separate complaints: the wordmark beside the dice was plain text while the
 * header's "SBSK" next to the same dice was a link, and neither control put you back at the
 * top — so going home from the bottom of a long page left you at footer level on a page that
 * had, as far as the view was concerned, not changed.
 */
describe('Footer — going home', () => {
  function renderAt(path: string) {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <MotionProvider>
          <Footer />
        </MotionProvider>
      </MemoryRouter>,
    );
  }

  const wordmark = () => screen.getByRole('link', { name: 'Stavanger Brettspillklubb' });

  it('makes the wordmark a real link home, not just the dice', () => {
    renderAt('/kalender');
    expect(wordmark()).toHaveAttribute('href', '/');
  });

  it('keeps the dice and the wordmark as two separate controls', () => {
    // #222: the dice used to be a <button> nested inside a <NavLink>, which is invalid and put
    // two targets on one 48px box. Adding the wordmark link must not put it back.
    renderAt('/kalender');
    expect(wordmark().querySelector('button')).toBeNull();
    expect(screen.getByRole('button', { name: /Klikk for å kaste/ }).closest('a')).toBeNull();
  });

  it('scrolls smoothly to the top instead of re-navigating when already home', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const user = userEvent.setup();
    renderAt('/');

    await user.click(wordmark());
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });

    await user.click(screen.getByRole('button', { name: /Klikk for å kaste/ }));
    expect(scrollTo).toHaveBeenCalledTimes(2);

    scrollTo.mockRestore();
  });

  it('jumps rather than animating when motion is reduced', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const user = userEvent.setup();
    renderAt('/');

    document.documentElement.classList.add('reduce-motion');
    await user.click(wordmark());

    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'auto' });
    scrollTo.mockRestore();
  });

  it('leaves the scroll position alone when the click is a real navigation', async () => {
    // Off the home page the click changes route, and <ScrollRestoration /> in the shell is what
    // puts the new page at the top — instantly. A smooth scroll here would animate after the
    // new page had already painted.
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const user = userEvent.setup();
    renderAt('/kalender');

    await user.click(wordmark());
    expect(scrollTo).not.toHaveBeenCalled();
    scrollTo.mockRestore();
  });
});
