import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Tabs } from './Tabs';

const options = [
  { value: 'upcoming', label: 'Kommende' },
  { value: 'past', label: 'Tidligere' },
  { value: 'all', label: 'Alle' },
] as const;

describe('Tabs', () => {
  it('is a named group of buttons', () => {
    render(
      <Tabs label="Vis arrangementer" options={options} value="upcoming" onChange={vi.fn()} />,
    );
    expect(screen.getByRole('group', { name: 'Vis arrangementer' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('marks exactly the current tab as pressed', () => {
    render(<Tabs label="Vis" options={options} value="past" onChange={vi.fn()} />);
    const pressed = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-pressed') === 'true');
    expect(pressed.map((b) => b.textContent)).toEqual(['Tidligere']);
  });

  it('reports the chosen value', async () => {
    const onChange = vi.fn();
    render(<Tabs label="Vis" options={options} value="upcoming" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Alle' }));
    expect(onChange).toHaveBeenCalledWith('all');
  });

  it('draws the current tab on the orange bar and the others without one', () => {
    render(<Tabs label="Vis" options={options} value="upcoming" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Kommende' })).toHaveClass('border-primary');
    expect(screen.getByRole('button', { name: 'Alle' })).toHaveClass('border-transparent');
  });

  it('gives every tab a 44px target', () => {
    render(<Tabs label="Vis" options={options} value="upcoming" onChange={vi.fn()} />);
    for (const button of screen.getAllByRole('button')) expect(button).toHaveClass('min-h-11');
  });
});
