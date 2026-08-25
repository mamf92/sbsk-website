import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { CalendarEventTypes } from '../sanity/queryHelpers/events';
import SingleEventPage from './SingleEventPage';

let loaderData: { event: CalendarEventTypes };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useLoaderData: () => loaderData };
});

vi.mock('../sanity/editors/portableTextComponents', () => ({ components: {} }));

vi.mock('../sanity/sanityImageUrl', () => ({
  urlFor: () => ({
    width: () => ({
      fit: () => ({ url: () => 'https://example.test/image.jpg' }),
      url: () => 'https://example.test/image.jpg',
    }),
  }),
}));

const body = [
  {
    _type: 'block',
    _key: 'block-1',
    children: [{ _type: 'span', _key: 'span-1', text: 'Beskrivelse av arrangementet.' }],
  },
] as CalendarEventTypes['content'];

const minimalEvent: CalendarEventTypes = {
  _id: 'minimal',
  title: 'Ukentlig spillkveld',
  category: 'spillkveld',
  location: 'Klubbhuset',
  eventStartTime: new Date('2026-09-03T18:00:00'),
  eventEndTime: new Date('2026-09-03T22:00:00'),
  hasDetailPage: true,
};

const fullEvent: CalendarEventTypes = {
  _id: 'full',
  title: 'Board Game Masters 2026',
  category: 'turnering',
  location: 'Tasta bydelshus, Stavanger',
  eventStartTime: new Date('2026-01-23T17:00:00'),
  eventEndTime: new Date('2026-01-26T18:00:00'),
  hasDetailPage: true,
  content: body,
  signupUrl: { label: 'Meld deg på', url: 'https://spond.com/invite/abc' },
  showSponsors: true,
  sponsors: [
    { altText: 'Outland sin logo', link: 'https://outland.no', ctaLabel: 'Få 10 % rabatt' },
  ],
  pricingInfo: body,
  programInfo: body,
  schedule: [
    {
      _key: 'day-1',
      label: 'Dag 1 av BGM',
      startTime: new Date('2026-01-23T17:00:00'),
      endTime: new Date('2026-01-23T23:45:00'),
    },
  ],
};

const renderPage = (event: CalendarEventTypes) => {
  loaderData = { event };
  return render(
    <MemoryRouter>
      <SingleEventPage />
    </MemoryRouter>,
  );
};

describe('SingleEventPage', () => {
  it('always shows the title and a summary card, even for a minimal event', () => {
    renderPage(minimalEvent);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Ukentlig spillkveld' }),
    ).toBeInTheDocument();
    // The summary card repeats the title as its own heading.
    expect(screen.getAllByText('Ukentlig spillkveld').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('button', { name: /Legg til .* i kalenderen/ })).toBeInTheDocument();
  });

  it('omits sections a minimal event has no data for', () => {
    renderPage(minimalEvent);

    expect(screen.queryByRole('button', { name: 'Meld deg på' })).not.toBeInTheDocument();
    expect(screen.queryByText('Med støtte fra')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Priser' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Program' })).not.toBeInTheDocument();
  });

  it('renders every optional section when the event has the data', () => {
    renderPage(fullEvent);

    expect(screen.getByRole('button', { name: 'Meld deg på' })).toBeInTheDocument();
    expect(screen.getByText('Med støtte fra')).toBeInTheDocument();
    expect(screen.getByLabelText('Outland sin logo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Få 10 % rabatt' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Priser' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Program' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dag 1 av BGM' })).toBeInTheDocument();
  });

  it('gives the multi-day summary card a date range', () => {
    renderPage(fullEvent);
    expect(screen.getByText('23.–26.')).toBeInTheDocument();
  });
});
