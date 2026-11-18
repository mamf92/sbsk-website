import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IconButton } from './IconButton';
import { iconButtonClasses } from './iconButtonClasses';

describe('IconButton', () => {
  it('is named by its label alone and hides the icon from assistive tech', () => {
    render(<IconButton icon="moon" label="Mørk modus" />);
    const button = screen.getByRole('button', { name: 'Mørk modus' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveTextContent('');
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('sits in the shared square with the lift hover and a focus ring', () => {
    render(<IconButton icon="sun" label="Lys" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('size-icon-button', 'lift', 'focus-visible:outline-focus-ring');
    expect(button.className).not.toMatch(/\btransition/);
  });

  it('takes the toggle fill and merges className last', () => {
    render(<IconButton icon="calendarAdd" label="Legg til" variant="toggle" className="ml-2" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-darkestblue', 'ml-2');
    expect(button.className.endsWith('ml-2')).toBe(true);
  });

  it('forwards state, refs and clicks', async () => {
    const onClick = vi.fn();
    const ref = { current: null as HTMLButtonElement | null };
    render(<IconButton ref={ref} icon="moon" label="Mørk modus" aria-pressed onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'Mørk modus' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(ref.current).toBe(button);
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('shares its square with anything that composes the recipe', () => {
    expect(iconButtonClasses({ className: 'flex-col' })).toMatch(
      /size-icon-button.*lift.*flex-col$/,
    );
  });
});
