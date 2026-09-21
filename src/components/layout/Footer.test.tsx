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

const toggle = () => screen.getByRole('button', { name: 'Reduser animasjoner' });

describe('Footer — motion preference toggle', () => {
  // WCAG 2.5.3 Label in Name, the rule `Header.tsx`'s LM/DM comment is about. The header's
  // theme toggle has to prefix its name with a two-letter abbreviation; putting this control in
  // the footer is what buys it a name that is simply its visible label.
  it('is named by the words it shows', () => {
    renderFooter();
    expect(toggle()).toHaveTextContent('Reduser animasjoner');
  });

  it('reports its state through aria-pressed rather than the label', async () => {
    const user = userEvent.setup();
    renderFooter();

    expect(toggle()).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle());

    // The label is deliberately unchanged — a toggle that renames itself is read out as a
    // different control, and the pressed state already carries the meaning.
    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
    expect(toggle()).toHaveTextContent('Reduser animasjoner');
  });

  it('drives the class the stylesheet actually reads', async () => {
    const user = userEvent.setup();
    renderFooter();

    await user.click(toggle());
    expect(document.documentElement).toHaveClass('reduce-motion');

    await user.click(toggle());
    expect(document.documentElement).not.toHaveClass('reduce-motion');
  });

  // `aria-pressed` alone is invisible: nothing in `buttonClasses` styles it, and only
  // `lift-chip` reads it. A setting control that looks identical in both states is a setting
  // control that only assistive tech can read.
  it('looks different when pressed, not only to a screen reader', async () => {
    const user = userEvent.setup();
    renderFooter();
    const off = toggle().className;

    await user.click(toggle());

    expect(toggle().className).not.toBe(off);
  });

  it('keeps its label across the state change', async () => {
    const user = userEvent.setup();
    renderFooter();

    await user.click(toggle());

    // A control that renames itself reads as a different control.
    expect(toggle()).toHaveTextContent('Reduser animasjoner');
  });

  it('shows as pressed when the preference was already reduced', () => {
    localStorage.setItem('motion-preference', 'reduced');
    renderFooter();
    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
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

    await user.click(toggle());
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
