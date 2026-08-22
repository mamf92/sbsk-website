import type { Ref } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Segmented, type SegmentedOption } from './Segmented';

type Scope = 'upcoming' | 'past' | 'all';

const options: SegmentedOption<Scope>[] = [
  { value: 'upcoming', label: 'Kommende' },
  { value: 'past', label: 'Tidligere' },
  { value: 'all', label: 'Alle' },
];

type Overrides = {
  label?: string;
  options?: SegmentedOption<Scope>[];
  value?: Scope;
  onChange?: (value: Scope) => void;
  size?: 'sm' | 'md';
  className?: string;
  id?: string;
  ref?: Ref<HTMLDivElement>;
};

const renderSegmented = (props: Overrides = {}) =>
  render(
    <Segmented
      label="Vis arrangementer"
      options={options}
      value="upcoming"
      onChange={() => {}}
      {...props}
    />,
  );

// Pins the contract, not the class values. The selected fill and the inset shadow move when
// the design system is re-themed; which option is announced as on, and that the group is
// operable and named, must not.
describe('Segmented', () => {
  it('renders one button per option inside a named group', () => {
    renderSegmented();

    const group = screen.getByRole('group', { name: 'Vis arrangementer' });
    expect(group).toBeInTheDocument();
    for (const option of options) {
      expect(screen.getByRole('button', { name: option.label })).toBeInTheDocument();
    }
  });

  it('announces exactly one selected segment through aria-pressed', () => {
    renderSegmented({ value: 'past' });

    expect(screen.getByRole('button', { name: 'Tidligere' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      screen.getAllByRole('button').filter((el) => el.getAttribute('aria-pressed') === 'true'),
    ).toHaveLength(1);
  });

  it('calls onChange with the option value, not the event', async () => {
    const onChange = vi.fn();
    renderSegmented({ onChange });

    await userEvent.click(screen.getByRole('button', { name: 'Alle' }));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('all');
  });

  it('reports the already-selected segment too, so a caller can no-op it', async () => {
    const onChange = vi.fn();
    renderSegmented({ onChange, value: 'upcoming' });

    await userEvent.click(screen.getByRole('button', { name: 'Kommende' }));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('upcoming');
  });

  it('defaults every segment to type=button so none submits a surrounding form', () => {
    renderSegmented();

    for (const button of screen.getAllByRole('button')) {
      expect(button).toHaveAttribute('type', 'button');
    }
  });

  it('applies a distinct class for every size', () => {
    const classes = (['sm', 'md'] as const).map((size) => {
      const { unmount } = renderSegmented({ size });
      const { className } = screen.getByRole('button', { name: 'Kommende' });
      unmount();
      return className;
    });

    expect(new Set(classes).size).toBe(2);
  });

  it('divides the segments without doubling the outer border', () => {
    // Each segment but the first draws the hairline to its left; the group draws the frame.
    renderSegmented();
    const [first, ...rest] = screen.getAllByRole('button');

    expect(first.className).not.toContain('border-l');
    for (const button of rest) {
      expect(button.className).toContain('border-l');
    }
  });

  it('merges a caller-supplied className instead of dropping it', () => {
    renderSegmented({ className: 'w-full' });
    expect(screen.getByRole('group')).toHaveClass('w-full');
  });

  it('forwards arbitrary container attributes', () => {
    renderSegmented({ id: 'scope-switcher' });
    expect(screen.getByRole('group')).toHaveAttribute('id', 'scope-switcher');
  });

  it('exposes the underlying element through a ref', () => {
    const ref = { current: null as HTMLDivElement | null };
    renderSegmented({ ref });
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('carries segment and never a competing transition utility', () => {
    // `segment` sets `transition` in full. A second transition-property utility would win or
    // lose by stylesheet order and silently drop half the interaction.
    renderSegmented();

    for (const button of screen.getAllByRole('button')) {
      const classes = button.className.split(/\s+/);
      expect(classes).toContain('segment');
      expect(classes.filter((name) => /^transition(-|$)/.test(name))).toHaveLength(0);
    }
  });

  it('never lifts — joined segments cannot travel without tearing the group', () => {
    renderSegmented();

    for (const button of screen.getAllByRole('button')) {
      const classes = button.className.split(/\s+/);
      expect(classes.filter((name) => /^lift(-|$)/.test(name))).toHaveLength(0);
    }
  });

  it('pins the selected segment to the dark shadow its orange fill can carry', () => {
    // White-on-orange is 2.18:1; the inset rule has to stay `surface-light` in both themes.
    renderSegmented({ value: 'past' });
    expect(screen.getByRole('button', { name: 'Tidligere' })).toHaveClass('surface-light');
  });
});
