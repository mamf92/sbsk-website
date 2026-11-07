import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import EmptyState from './EmptyState';
import { Button } from './Buttons';
import SearchIcon from '../../assets/icons/symbols/search.svg?react';

describe('EmptyState', () => {
  it('renders a heading and body copy', () => {
    render(<EmptyState title="Ingen innlegg" body="Sjekk igjen senere." />);

    expect(screen.getByRole('heading', { name: 'Ingen innlegg' })).toBeInTheDocument();
    expect(screen.getByText('Sjekk igjen senere.')).toBeInTheDocument();
  });

  it('heads at h2 by default and drops to h3 when a section already owns the h2', () => {
    const { unmount } = render(<EmptyState title="Ingen treff" />);
    expect(screen.getByRole('heading', { name: 'Ingen treff' }).tagName).toBe('H2');
    unmount();

    render(<EmptyState title="Ingen treff" headingLevel={3} />);
    expect(screen.getByRole('heading', { name: 'Ingen treff' }).tagName).toBe('H3');
  });

  it('renders an optional action and forwards its clicks', async () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="Ingen arrangementer matcher søket"
        action={<Button onClick={onClick}>Fjern filtre</Button>}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Fjern filtre' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('omits the heading, body and action when they are not given', () => {
    const { container } = render(<EmptyState body="Bare tekst." />);

    expect(screen.queryByRole('heading')).toBeNull();
    expect(container.querySelector('button')).toBeNull();
  });

  it('applies a distinct class list for every variant', () => {
    const variants = ['page', 'inline'] as const;

    const classes = variants.map((variant) => {
      const { container, unmount } = render(<EmptyState variant={variant} title="x" />);
      const className = (container.firstChild as HTMLElement).className;
      unmount();
      return className;
    });

    expect(new Set(classes).size).toBe(variants.length);
  });

  it('forwards native attributes and merges a caller className', () => {
    const { container } = render(<EmptyState title="x" className="text-white" data-testid="tom" />);

    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('text-white');
    expect(root).toHaveAttribute('data-testid', 'tom');
  });

  it('shows an optional decorative icon above the title', () => {
    const { container, unmount } = render(<EmptyState title="Ingen treff" icon={SearchIcon} />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    unmount();

    const { container: bare } = render(<EmptyState title="Ingen treff" />);
    expect(bare.querySelector('svg')).toBeNull();
  });

  it('takes its colours from the roles, so it reads on the page and on a navy panel', () => {
    render(<EmptyState title="Ingen treff" body="Prøv et annet søk." />);
    expect(screen.getByRole('heading')).toHaveClass('text-heading');
    expect(screen.getByText('Prøv et annet søk.')).toHaveClass('text-fg-muted');
  });
});
