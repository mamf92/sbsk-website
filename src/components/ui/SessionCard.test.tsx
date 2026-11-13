import { createRef } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SessionCard } from './SessionCard';
import type { FestivalSessionTypes } from '../../sanity/queryHelpers/festivals';
import { setLocale } from '../../utils/locale';

const start = new Date('2027-01-29T17:00:00Z');
const end = new Date('2027-01-29T20:00:00Z');
const session = (extra: Partial<FestivalSessionTypes> = {}): FestivalSessionTypes => ({
  _key: 's1',
  start: '18:00',
  end: '21:00',
  ...extra,
});

describe('SessionCard', () => {
  it('shows the time in Oslo, the title, and where', () => {
    render(
      <SessionCard
        session={session({ title: { nb: 'Innledende runder' }, room: 'Sal A', seats: 1 })}
        start={start}
        end={end}
      />,
    );
    expect(screen.getByText('18:00–21:00')).toHaveAttribute('datetime', start.toISOString());
    expect(screen.getByRole('heading', { name: 'Innledende runder' })).toBeInTheDocument();
    expect(screen.getByText('Sal A')).toBeInTheDocument();
    expect(screen.getByText('1 plass')).toBeInTheDocument();
  });

  it('tags competitive and teaching formats, and names the rest in plain text', () => {
    const { rerender } = render(
      <SessionCard session={session({ format: 'turnering' })} start={start} end={end} />,
    );
    expect(screen.getAllByText('Turnering')[0].className).toMatch(/uppercase/);
    rerender(<SessionCard session={session({ format: 'pause' })} start={start} end={end} />);
    expect(screen.getAllByText('Pause')[0].className).not.toMatch(/uppercase/);
  });

  it('falls back to the game, then the format, for a heading', () => {
    const { rerender } = render(
      <SessionCard session={session({ game: { name: 'Brass' } })} start={start} end={end} />,
    );
    expect(screen.getByRole('heading', { name: 'Brass' })).toBeInTheDocument();
    rerender(<SessionCard session={session({ format: 'pause' })} start={start} end={end} />);
    expect(screen.getByRole('heading', { name: 'Pause' })).toBeInTheDocument();
  });

  it('writes «Nå» and «Neste» out, not only as colour', () => {
    const { rerender } = render(
      <SessionCard session={session()} start={start} end={end} status="now" />,
    );
    expect(screen.getByText('Nå')).toBeInTheDocument();
    rerender(<SessionCard session={session()} start={start} end={end} status="next" />);
    expect(screen.getByText('Neste')).toBeInTheDocument();
  });

  it('collapses a long description behind a toggle', async () => {
    render(
      <SessionCard
        session={session({ description: { nb: 'Lang tekst. '.repeat(20) } })}
        start={start}
        end={end}
      />,
    );
    const toggle = screen.getByRole('button', { name: 'Vis mer' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Vis mindre' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('marks a Norwegian title on an English page', () => {
    act(() => setLocale('en'));
    render(
      <SessionCard session={session({ title: { nb: 'Fri spilling' } })} start={start} end={end} />,
    );
    expect(screen.getByRole('heading', { name: 'Fri spilling' })).toHaveAttribute('lang', 'nb');
  });

  it('forwards its ref', () => {
    const ref = createRef<HTMLElement>();
    render(<SessionCard ref={ref} session={session()} start={start} end={end} />);
    expect(ref.current?.tagName).toBe('ARTICLE');
  });
});
