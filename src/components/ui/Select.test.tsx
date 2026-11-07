import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Select } from './Select';

const options = [
  { value: 'date-desc', label: 'Nyeste først' },
  { value: 'date-asc', label: 'Eldste først' },
] as const;

describe('Select', () => {
  it('is the native select, named by its label', () => {
    render(<Select label="Sorter etter" options={options} value="date-desc" onChange={vi.fn()} />);
    const select = screen.getByRole('combobox', { name: 'Sorter etter' });
    expect(select.tagName).toBe('SELECT');
    expect(select).toHaveValue('date-desc');
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });

  it('reports the chosen value', async () => {
    const onChange = vi.fn();
    render(<Select label="Sorter etter" options={options} value="date-desc" onChange={onChange} />);
    await userEvent.selectOptions(screen.getByRole('combobox'), 'date-asc');
    expect(onChange).toHaveBeenCalledWith('date-asc');
  });

  it('can hide its label visually and keep it for assistive tech', () => {
    render(
      <Select
        label="Sorter etter"
        labelHidden
        options={options}
        value="date-desc"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Sorter etter')).toHaveClass('sr-only');
    expect(screen.getByRole('combobox', { name: 'Sorter etter' })).toBeInTheDocument();
  });

  it('wears the field look with its own chevron', () => {
    const { container } = render(
      <Select label="Sorter etter" options={options} value="date-desc" onChange={vi.fn()} />,
    );
    expect(screen.getByRole('combobox')).toHaveClass(
      'appearance-none',
      'bg-surface-muted',
      'border-b-2',
    );
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
