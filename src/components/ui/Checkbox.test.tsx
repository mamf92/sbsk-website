import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renders a checkbox a label can reach', () => {
    render(
      <label>
        <Checkbox name="is_admin" />
        Administrator
      </label>,
    );

    expect(screen.getByRole('checkbox', { name: 'Administrator' })).toBeInTheDocument();
  });

  it('toggles and reports the change', async () => {
    const onChange = vi.fn();
    render(<Checkbox aria-label="Administrator" onChange={onChange} />);

    const box = screen.getByRole('checkbox');
    expect(box).not.toBeChecked();

    await userEvent.click(box);
    expect(box).toBeChecked();
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('honours defaultChecked and native attributes', () => {
    render(<Checkbox aria-label="Administrator" name="is_admin" defaultChecked />);

    const box = screen.getByRole('checkbox');
    expect(box).toBeChecked();
    expect(box).toHaveAttribute('name', 'is_admin');
  });

  it('renders the tick glyph, which the native control never painted', () => {
    const { container } = render(<Checkbox aria-label="Administrator" />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('applies a distinct class list when invalid', () => {
    const { unmount } = render(<Checkbox aria-label="x" />);
    const resting = screen.getByRole('checkbox').className;
    unmount();

    render(<Checkbox aria-label="x" invalid />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('checkbox').className).not.toBe(resting);
  });

  it('merges a caller className onto the input itself', () => {
    render(<Checkbox aria-label="x" className="size-5" />);
    expect(screen.getByRole('checkbox').className).toContain('size-5');
  });

  it('forwards a ref to the input element', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Checkbox ref={ref} aria-label="x" />);
    expect(ref.current).toBe(screen.getByRole('checkbox'));
  });

  it('uses the hard offset shadow as its focus treatment, not an outline or a ring', () => {
    render(<Checkbox aria-label="x" />);
    const { className } = screen.getByRole('checkbox');

    expect(className).toContain('focus-visible:shadow-focus-2');
    expect(className).not.toContain('focus-visible:outline');
    expect(className).not.toContain('focus:ring');
  });
});
