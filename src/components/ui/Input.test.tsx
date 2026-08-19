import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { Input } from './Input';

// The design-system contract for Input. Classes change when the system is re-themed; what
// is pinned here must not.
describe('Input', () => {
  it('renders a textbox that a label can reach by id', () => {
    render(
      <>
        <label htmlFor="email">E-post</label>
        <Input id="email" />
      </>,
    );

    expect(screen.getByLabelText('E-post')).toBeInTheDocument();
  });

  it('forwards typing and native attributes', async () => {
    const onChange = vi.fn();
    render(<Input type="email" placeholder="E-post" autoComplete="email" onChange={onChange} />);

    const input = screen.getByPlaceholderText('E-post');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('autocomplete', 'email');

    await userEvent.type(input, 'a');
    expect(onChange).toHaveBeenCalled();
  });

  it('is valid by default and says so by saying nothing', () => {
    render(<Input placeholder="Fornavn" />);
    expect(screen.getByPlaceholderText('Fornavn')).not.toHaveAttribute('aria-invalid');
  });

  it('marks itself invalid for assistive tech and shows the error glyph', () => {
    const { container } = render(<Input invalid placeholder="Fornavn" />);

    expect(screen.getByPlaceholderText('Fornavn')).toHaveAttribute('aria-invalid', 'true');
    expect(container.querySelectorAll('svg')).toHaveLength(1);
  });

  it('applies a distinct class list when invalid', () => {
    const { unmount } = render(<Input placeholder="x" />);
    const resting = screen.getByPlaceholderText('x').className;
    unmount();

    render(<Input invalid placeholder="x" />);
    expect(screen.getByPlaceholderText('x').className).not.toBe(resting);
  });

  it('renders a trailing icon when asked, and none by default', () => {
    const { container, unmount } = render(<Input placeholder="Søk" />);
    expect(container.querySelector('svg')).toBeNull();
    unmount();

    const withIcon = render(<Input icon="search" placeholder="Søk" />);
    expect(withIcon.container.querySelector('svg')).not.toBeNull();
  });

  it('lets the error glyph win over the icon — a field says one thing at a time', () => {
    const { container } = render(<Input icon="search" invalid placeholder="Søk" />);
    expect(container.querySelectorAll('svg')).toHaveLength(1);
  });

  it('supports the disabled state the newsletter field needs', () => {
    render(<Input disabled placeholder="E-postadresse" />);
    expect(screen.getByPlaceholderText('E-postadresse')).toBeDisabled();
  });

  it('merges a caller className onto the field itself', () => {
    render(<Input className="max-w-form" placeholder="x" />);
    expect(screen.getByPlaceholderText('x').className).toContain('max-w-form');
  });

  it('forwards a ref to the input element', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} placeholder="x" />);
    expect(ref.current).toBe(screen.getByPlaceholderText('x'));
  });

  it('uses the outline focus treatment the rest of the system uses, not a ring', () => {
    render(<Input placeholder="x" />);
    const { className } = screen.getByPlaceholderText('x');

    expect(className).toContain('focus-visible:outline');
    expect(className).not.toContain('focus:ring');
  });
});
