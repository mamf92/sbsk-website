import type { ChangeEvent } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Select, type SelectOption } from './Select';

const options: SelectOption[] = [
  { value: 'date-asc', label: 'Dato (først → sist)' },
  { value: 'date-desc', label: 'Dato (sist → først)' },
  { value: 'title-asc', label: 'Tittel (A–Å)' },
];

// Pins the contract, not the class values: the field surface is shared with `Input` and
// `Textarea` and moves with them, but what the control announces and reports must not.
describe('Select', () => {
  it('renders one option per entry, reachable as a combobox', () => {
    render(<Select aria-label="Sorter arrangementer" options={options} defaultValue="date-asc" />);

    const select = screen.getByRole('combobox', { name: 'Sorter arrangementer' });
    expect(select).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(options.length);
  });

  it('reports the chosen value through onChange', async () => {
    // Read inside the handler, not from `mock.calls` afterwards: this is a controlled select
    // pinned to `date-asc`, so React has re-rendered the same DOM node back to that value by
    // the time the assertion runs.
    const seen: string[] = [];
    const onChange = (event: ChangeEvent<HTMLSelectElement>) => seen.push(event.target.value);
    render(
      <Select
        aria-label="Sorter arrangementer"
        options={options}
        value="date-asc"
        onChange={onChange}
      />,
    );

    await userEvent.selectOptions(screen.getByRole('combobox'), 'title-asc');
    expect(seen).toEqual(['title-asc']);
  });

  it('forwards arbitrary native attributes', () => {
    render(<Select aria-label="Sorter" options={options} name="sort" disabled />);

    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
    expect(select).toHaveAttribute('name', 'sort');
  });

  it('marks itself invalid only when asked', () => {
    const { rerender } = render(<Select aria-label="Sorter" options={options} />);
    expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-invalid');

    rerender(<Select aria-label="Sorter" options={options} invalid />);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('swaps the border rather than layering the error one over it', () => {
    // `fieldBorder` and `fieldBorderInvalid` are mutually exclusive on purpose — a `dark:`
    // variant carries no extra specificity, so both applied would be decided by emit order.
    const { rerender } = render(<Select aria-label="Sorter" options={options} />);
    expect(screen.getByRole('combobox').className).not.toContain('border-error');

    rerender(<Select aria-label="Sorter" options={options} invalid />);
    expect(screen.getByRole('combobox').className).toContain('border-error');
  });

  it('sets no width of its own, so the caller decides', () => {
    // Both would be width utilities in one layer: a base `w-full` could not be overridden by
    // a caller's `w-auto` reliably, since stylesheet order would decide the winner.
    render(<Select aria-label="Sorter" options={options} />);

    const classes = screen.getByRole('combobox').className.split(/\s+/);
    expect(classes.filter((name) => /^(w|max-w|min-w)-/.test(name))).toHaveLength(0);
  });

  it('merges a caller-supplied className instead of dropping it', () => {
    render(<Select aria-label="Sorter" options={options} className="w-full" />);
    expect(screen.getByRole('combobox')).toHaveClass('w-full');
  });

  it('exposes the underlying element through a ref', () => {
    const ref = { current: null as HTMLSelectElement | null };
    render(<Select aria-label="Sorter" options={options} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
  });

  it('stays flat — a field is not a pressable surface', () => {
    render(<Select aria-label="Sorter" options={options} />);

    const classes = screen.getByRole('combobox').className.split(/\s+/);
    expect(classes.filter((name) => /^lift(-|$)/.test(name))).toHaveLength(0);
  });
});
