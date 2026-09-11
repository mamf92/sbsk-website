import { describe, expect, it } from 'vitest';
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

  it('shows as pressed when the preference was already reduced', () => {
    localStorage.setItem('motion-preference', 'reduced');
    renderFooter();
    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
  });
});
