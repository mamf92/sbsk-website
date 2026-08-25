import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('renders a textbox that a label can reach by id', () => {
    render(
      <>
        <label htmlFor="bio">Bio</label>
        <Textarea id="bio" />
      </>,
    );

    expect(screen.getByLabelText('Bio')).toBeInTheDocument();
  });

  it('forwards typing and native attributes', async () => {
    const onChange = vi.fn();
    render(<Textarea rows={4} placeholder="Skriv litt om deg selv..." onChange={onChange} />);

    const field = screen.getByPlaceholderText('Skriv litt om deg selv...');
    expect(field).toHaveAttribute('rows', '4');

    await userEvent.type(field, 'a');
    expect(onChange).toHaveBeenCalled();
  });

  it('marks itself invalid for assistive tech and shows the error glyph', () => {
    const { container } = render(<Textarea invalid placeholder="Bio" />);

    expect(screen.getByPlaceholderText('Bio')).toHaveAttribute('aria-invalid', 'true');
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('applies a distinct class list when invalid', () => {
    const { unmount } = render(<Textarea placeholder="x" />);
    const resting = screen.getByPlaceholderText('x').className;
    unmount();

    render(<Textarea invalid placeholder="x" />);
    expect(screen.getByPlaceholderText('x').className).not.toBe(resting);
  });

  it('merges a caller className onto the field itself', () => {
    render(<Textarea className="min-h-64" placeholder="x" />);
    expect(screen.getByPlaceholderText('x').className).toContain('min-h-64');
  });

  it('forwards a ref to the textarea element', () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} placeholder="x" />);
    expect(ref.current).toBe(screen.getByPlaceholderText('x'));
  });

  it('uses the hard offset shadow as its focus treatment, not an outline or a ring', () => {
    render(<Textarea placeholder="x" />);
    const { className } = screen.getByPlaceholderText('x');

    expect(className).toContain('focus-visible:shadow-focus-2');
    expect(className).not.toContain('focus-visible:outline');
    expect(className).not.toContain('focus:ring');
  });

  it('marks itself valid with a check glyph, distinct from the resting class list', () => {
    const { unmount } = render(<Textarea placeholder="x" />);
    const resting = screen.getByPlaceholderText('x').className;
    unmount();

    const { container } = render(<Textarea valid placeholder="x" />);
    expect(screen.getByPlaceholderText('x').className).not.toBe(resting);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('lets invalid win over valid — a field says one thing at a time', () => {
    const { container } = render(<Textarea invalid valid placeholder="x" />);
    expect(screen.getByPlaceholderText('x')).toHaveAttribute('aria-invalid', 'true');
    expect(container.querySelectorAll('svg')).toHaveLength(1);
  });
});
