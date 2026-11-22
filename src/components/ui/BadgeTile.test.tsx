import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BadgeTile } from './BadgeTile';

describe('BadgeTile', () => {
  it('says whether the badge is earned in its accessible name', () => {
    render(
      <>
        <BadgeTile name="Stamgjest" earned detail="Oppnådd 3. mars 2026" />
        <BadgeTile name="Veteran" earned={false} detail="3 av 25 innsjekkinger" />
      </>,
    );
    expect(
      screen.getByRole('button', { name: 'Stamgjest, oppnådd, Oppnådd 3. mars 2026' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Veteran, ikke oppnådd ennå, 3 av 25 innsjekkinger' }),
    ).toBeInTheDocument();
    expect(screen.getByText('3 av 25 innsjekkinger')).toBeInTheDocument();
  });

  it('is a plain button that does not submit a form', async () => {
    const onClick = vi.fn();
    render(<BadgeTile name="Trofast" earned={false} onClick={onClick} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
