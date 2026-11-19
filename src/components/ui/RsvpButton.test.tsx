import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RsvpButton } from './RsvpButton';

function setup(attending: boolean, onClick = vi.fn()) {
  render(
    <RsvpButton
      attending={attending}
      joinLabel="Bli med"
      attendingLabel="Påmeldt!"
      leaveLabel="Meld av"
      ariaLabel={attending ? 'Meld deg av Spillkveld' : 'Meld deg på Spillkveld'}
      onClick={onClick}
    />,
  );
  return onClick;
}

describe('RsvpButton', () => {
  it('shows only the join label when not signed up', () => {
    setup(false);
    const button = screen.getByRole('button', { name: 'Meld deg på Spillkveld' });
    expect(button).toHaveTextContent('Bli med');
    expect(button).not.toHaveTextContent('Meld av');
  });

  it('carries both labels when signed up so the width never changes', () => {
    setup(true);
    const button = screen.getByRole('button', { name: 'Meld deg av Spillkveld' });
    expect(button.querySelector('[data-rsvp-label="attending"]')).toHaveTextContent('Påmeldt!');
    const leave = button.querySelector('[data-rsvp-label="leave"]');
    expect(leave).toHaveTextContent('Meld av');
    expect(leave).toHaveClass('invisible', 'group-hover:visible', 'group-focus-visible:visible');
    expect(leave).toHaveAttribute('aria-hidden', 'true');
  });

  it('fires onClick in both states, so a tap on touch still cancels', async () => {
    const onClick = setup(true);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
