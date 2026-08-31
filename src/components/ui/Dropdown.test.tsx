import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Dropdown, type DropdownOption } from './Dropdown';

type Sort = 'date-asc' | 'date-desc' | 'title-asc';

const options: DropdownOption<Sort>[] = [
  { value: 'date-asc', label: 'Dato (først → sist)' },
  { value: 'date-desc', label: 'Dato (sist → først)' },
  { value: 'title-asc', label: 'Tittel (A–Å)' },
];

const renderDropdown = (props: Partial<React.ComponentProps<typeof Dropdown<Sort>>> = {}) =>
  render(
    <Dropdown
      label="Sorter arrangementer"
      options={options}
      value="date-asc"
      onChange={() => {}}
      {...props}
    />,
  );

describe('Dropdown', () => {
  it('renders a closed trigger naming itself and showing the current value', () => {
    renderDropdown();

    const trigger = screen.getByRole('button', { name: 'Sorter arrangementer' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveTextContent('Dato (først → sist)');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens the listbox on click and lists every option', async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByRole('button', { name: 'Sorter arrangementer' }));

    expect(screen.getByRole('button', { name: 'Sorter arrangementer' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getAllByRole('option')).toHaveLength(options.length);
  });

  it('marks the current value as the selected option', async () => {
    const user = userEvent.setup();
    renderDropdown({ value: 'title-asc' });

    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('option', { name: 'Tittel (A–Å)' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('option', { name: 'Dato (først → sist)' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('reports the chosen value on click and closes, returning focus to the trigger', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderDropdown({ onChange });

    const trigger = screen.getByRole('button');
    await user.click(trigger);
    await user.click(screen.getByRole('option', { name: 'Tittel (A–Å)' }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith('title-asc');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('opens with the keyboard and commits the active option with Enter', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderDropdown({ onChange });

    const trigger = screen.getByRole('button');
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Opening seeds the active option at the current value (date-asc, index 0); one ArrowDown
    // moves it to date-desc.
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledExactlyOnceWith('date-desc');
    expect(trigger).toHaveFocus();
  });

  it('wraps from the last option back to the first with ArrowDown', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderDropdown({ onChange, value: 'title-asc' });

    const trigger = screen.getByRole('button');
    trigger.focus();
    await user.keyboard('{ArrowDown}'); // open, active = title-asc (index 2)
    await user.keyboard('{ArrowDown}'); // wraps to index 0
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledExactlyOnceWith('date-asc');
  });

  it('jumps to the first and last option with Home and End', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    // Starts mid-list so both Home and End each have to move the active option.
    renderDropdown({ onChange, value: 'date-desc' });

    const trigger = screen.getByRole('button');
    trigger.focus();
    await user.keyboard('{ArrowDown}'); // open, active = date-desc (index 1)
    await user.keyboard('{End}'); // active = title-asc (index 2)
    await user.keyboard('{Home}'); // active = date-asc (index 0)
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledExactlyOnceWith('date-asc');
  });

  it('closes on Escape without committing, and returns focus to the trigger', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderDropdown({ onChange });

    const trigger = screen.getByRole('button');
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Escape}');

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes on an outside click without committing', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Dropdown
          label="Sorter arrangementer"
          options={options}
          value="date-asc"
          onChange={() => {}}
        />
        <button>Outside</button>
      </div>,
    );

    await user.click(screen.getByRole('button', { name: 'Sorter arrangementer' }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Outside' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes on Tab without stealing focus back', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Dropdown
          label="Sorter arrangementer"
          options={options}
          value="date-asc"
          onChange={() => {}}
        />
        <button>Next</button>
      </div>,
    );

    const trigger = screen.getByRole('button', { name: 'Sorter arrangementer' });
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.tab();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
  });

  it('tracks the active option through aria-activedescendant', async () => {
    const user = userEvent.setup();
    renderDropdown();

    const trigger = screen.getByRole('button');
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');

    const activeId = trigger.getAttribute('aria-activedescendant');
    expect(activeId).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Dato (sist → først)' })).toHaveAttribute(
      'id',
      activeId,
    );
  });

  /**
   * Stands the panel's measurement in for a real layout — jsdom reports every rect as zero, and
   * the alignment flip is the one behaviour here that can only be decided by measuring (#223).
   */
  function measurePanelAt(rect: { left: number; right: number }) {
    return vi.spyOn(HTMLUListElement.prototype, 'getBoundingClientRect').mockReturnValue({
      ...rect,
      width: rect.right - rect.left,
      height: 120,
      top: 0,
      bottom: 120,
      x: rect.left,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
  }

  it('right-aligns the panel by default', async () => {
    renderDropdown();
    await userEvent.click(screen.getByRole('button', { name: 'Sorter arrangementer' }));

    expect(screen.getByRole('listbox')).toHaveClass('right-0');
    expect(screen.getByRole('listbox')).not.toHaveClass('left-0');
  });

  it('flips to left-alignment when right-alignment would run off the left edge', async () => {
    // The reported case: the filter row wraps, the trigger lands near the left edge, and a
    // panel wider than that narrow trigger grows leftward off the screen.
    const rect = measurePanelAt({ left: -42, right: 258 });
    renderDropdown();

    await userEvent.click(screen.getByRole('button', { name: 'Sorter arrangementer' }));
    expect(screen.getByRole('listbox')).toHaveClass('left-0');
    expect(screen.getByRole('listbox')).not.toHaveClass('right-0');

    rect.mockRestore();
  });

  it('goes back to right-alignment the next time it opens', async () => {
    // The flip belongs to one opening, not to the component: the trigger moves as the row
    // rewraps, so a panel that had to flip once must not stay flipped afterwards.
    const rect = measurePanelAt({ left: -42, right: 258 });
    renderDropdown();
    const trigger = screen.getByRole('button', { name: 'Sorter arrangementer' });

    await userEvent.click(trigger);
    expect(screen.getByRole('listbox')).toHaveClass('left-0');
    await userEvent.click(trigger);

    rect.mockRestore();
    await userEvent.click(trigger);
    expect(screen.getByRole('listbox')).toHaveClass('right-0');
  });

  it('leaves the panel right-aligned when it already fits', async () => {
    const rect = measurePanelAt({ left: 120, right: 420 });
    renderDropdown();

    await userEvent.click(screen.getByRole('button', { name: 'Sorter arrangementer' }));
    expect(screen.getByRole('listbox')).toHaveClass('right-0');

    rect.mockRestore();
  });

  it('merges a caller-supplied className onto the wrapper instead of dropping it', () => {
    renderDropdown({ className: 'w-full' });
    expect(screen.getByRole('button').parentElement).toHaveClass('w-full');
  });

  it('exposes the wrapper element through a ref', () => {
    const ref = { current: null as HTMLDivElement | null };
    renderDropdown({ ref });
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
