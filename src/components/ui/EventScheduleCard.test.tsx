import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EventScheduleCard } from './EventScheduleCard';
import * as ics from '../../utils/ics';

describe('EventScheduleCard', () => {
  const ics_event = {
    title: 'Dag 1 av BGM',
    start: new Date('2026-01-23T17:00:00Z'),
    end: new Date('2026-01-23T23:45:00Z'),
    location: 'Tasta bydelshus, Stavanger',
  };

  it('renders the date, title, meta and optional description', () => {
    render(
      <EventScheduleCard
        day="23."
        month="JAN"
        title="Dag 1 av BGM"
        meta="Torsdag 23. januar 2026 · 17:00–23:45"
        description="Kveldens hovedøkt."
        ics={ics_event}
      />,
    );

    expect(screen.getByText('23.')).toBeInTheDocument();
    expect(screen.getByText('JAN')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dag 1 av BGM' })).toBeInTheDocument();
    expect(screen.getByText('Torsdag 23. januar 2026 · 17:00–23:45')).toBeInTheDocument();
    expect(screen.getByText('Kveldens hovedøkt.')).toBeInTheDocument();
  });

  it('omits the description when none is given', () => {
    render(<EventScheduleCard day="23." month="JAN" title="Dag 1" meta="17:00" ics={ics_event} />);
    expect(screen.queryByText('Kveldens hovedøkt.')).not.toBeInTheDocument();
  });

  it('downloads an .ics file for the event when the calendar button is clicked', async () => {
    const downloadIcsSpy = vi.spyOn(ics, 'downloadIcs').mockImplementation(() => {});

    render(
      <EventScheduleCard day="23." month="JAN" title="Dag 1 av BGM" meta="17:00" ics={ics_event} />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Legg til Dag 1 av BGM i kalenderen' }),
    );

    expect(downloadIcsSpy).toHaveBeenCalledWith(ics_event, 'Dag 1 av BGM.ics');
    downloadIcsSpy.mockRestore();
  });
});
