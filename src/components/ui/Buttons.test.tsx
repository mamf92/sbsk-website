import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Buttons';
import { buttonSizes, buttonVariants } from './buttonClasses';

describe('Button', () => {
  it('renders its children as an accessible button', () => {
    render(<Button>Meld deg på</Button>);
    expect(screen.getByRole('button', { name: 'Meld deg på' })).toBeInTheDocument();
  });

  it('forwards clicks', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Send</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('forwards arbitrary button attributes', () => {
    render(
      <Button type="submit" aria-label="Send skjema" data-x="1">
        Send
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Send skjema' });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('data-x', '1');
  });

  it('applies a distinct class list for every variant and every size', () => {
    const variantClasses = buttonVariants.map((variant) => {
      const { unmount } = render(<Button variant={variant}>x</Button>);
      const className = screen.getByRole('button').className;
      unmount();
      return className;
    });
    const sizeClasses = buttonSizes.map((size) => {
      const { unmount } = render(<Button size={size}>x</Button>);
      const className = screen.getByRole('button').className;
      unmount();
      return className;
    });
    expect(new Set(variantClasses).size).toBe(buttonVariants.length);
    expect(new Set(sizeClasses).size).toBe(buttonSizes.length);
  });

  it('merges a caller-supplied className', () => {
    render(<Button className="w-full">x</Button>);
    expect(screen.getByRole('button')).toHaveClass('w-full');
  });

  it('exposes the underlying element through a ref', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>x</Button>);
    expect(ref.current).toBe(screen.getByRole('button'));
  });

  it('renders no icon by default, and a decorative one on request', () => {
    const { container, rerender } = render(<Button>x</Button>);
    expect(container.querySelector('svg')).toBeNull();
    rerender(<Button icon="right">x</Button>);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('puts a left icon before the label and any other icon after it', () => {
    const { container, rerender } = render(<Button icon="left">Tilbake</Button>);
    expect(container.querySelector('button')?.firstElementChild?.tagName).toBe('svg');
    rerender(<Button icon="right">Neste</Button>);
    expect(container.querySelector('button')?.lastElementChild?.tagName).toBe('svg');
  });

  it('honours disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        x
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('disables itself while loading, so a form cannot be submitted twice', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Sender
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Sender' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('keeps its label and swaps the icon for a spinner while loading', () => {
    const { container } = render(
      <Button loading icon="right">
        Send
      </Button>,
    );
    expect(screen.getByRole('button')).toHaveTextContent('Send');
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeNull();
  });

  it('is not busy and not disabled by default', () => {
    render(<Button>x</Button>);
    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
    expect(button).not.toHaveAttribute('aria-busy');
  });
});
