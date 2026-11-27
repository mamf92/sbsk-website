import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { FestivalTypes } from '../../../sanity/queryHelpers/festivals';
import { FestivalPageRedesign } from './FestivalPageRedesign';

vi.mock('../../../sanity/editors/portableTextComponents', () => ({ components: {} }));
vi.mock('../../../sanity/sanityImageUrl', () => {
  const chain: Record<string, unknown> = {};
  for (const key of ['width', 'height', 'fit', 'auto']) chain[key] = () => chain;
  chain.url = () => 'https://cdn.test/i.jpg';
  return { urlFor: () => chain };
});

const block = (text: string) => ({
  nb: [{ _type: 'block', _key: text, children: [{ _type: 'span', _key: `${text}-s`, text }] }],
});

const bgm: FestivalTypes = {
  _id: 'bgm',
  slug: 'board-game-masters-xix',
  series: 'bgm',
  edition: 'XIX',
  title: { nb: 'Board Game Masters XIX' },
  startDate: '2099-01-28',
  endDate: '2099-01-31',
  venue: { name: 'Tasta bydelshus' },
  intro: block('Fire dager med brettspill.') as never,
  pricing: block('Prisene kommer.') as never,
  faq: [{ _key: 'q', question: { nb: 'Må jeg melde meg på?' }, answer: block('Nei.') as never }],
  contactEmail: 'post@example.no',
  days: ['28', '29', '30', '31'].map((d) => ({ _key: d, date: `2099-01-${d}` })),
};

const withProgramme: FestivalTypes = {
  ...bgm,
  series: 'annet',
  edition: undefined,
  signup: { method: 'lenke', url: 'https://example.no/pamelding' },
  days: [
    {
      _key: 'fre',
      date: '2099-06-04',
      label: { nb: 'Oppvarming' },
      sessions: [{ _key: 's1', start: '18:00', end: '22:00', title: { nb: 'Fri spilling' } }],
    },
    {
      _key: 'lor',
      date: '2099-06-05',
      label: { nb: 'Turneringsdag' },
      opens: '10:00',
      closes: '23:00',
      sessions: [
        { _key: 's2', start: '10:00', end: '13:00', title: { nb: 'Innledende runder' } },
        { _key: 's3', start: '14:00', end: '17:00', title: { nb: 'Finale' } },
      ],
    },
  ],
};

const renderPage = (festival: FestivalTypes, url = '/board-game-masters') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <FestivalPageRedesign festival={festival} />
    </MemoryRouter>,
  );

describe('FestivalPageRedesign', () => {
  it('calls Board Game Masters a tournament, with its edition', () => {
    renderPage(bgm);
    expect(screen.getByText('Turnering · XIX')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Board Game Masters XIX' })).toBeVisible();
  });

  it('before the programme, shows the days once with «Programmet kommer» and no programme button', () => {
    renderPage(bgm);
    expect(screen.getByRole('heading', { name: '4 dager' })).toBeInTheDocument();
    expect(screen.getByText(/Programmet kommer/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Se programmet' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Legg hele festivalen i kalenderen' })).toBeVisible();
  });

  it('shows prices, questions and the contact address', () => {
    renderPage(bgm);
    expect(screen.getByRole('heading', { name: 'Påmelding og priser' })).toBeInTheDocument();
    expect(screen.getByText('Må jeg melde meg på?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'post@example.no' })).toBeInTheDocument();
  });

  it('with a programme, lets the days switch the sessions shown', () => {
    renderPage(withProgramme, '/arrangementer/x?dag=1');
    expect(screen.getByText('Festival')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Meld deg på/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Se programmet' })).toHaveAttribute('href', '#program');
    expect(screen.getByText('Fri spilling')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /5\. juni/ }));
    expect(screen.getByText('Innledende runder')).toBeInTheDocument();
    expect(screen.queryByText('Fri spilling')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /5\. juni/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it("before the programme, keeps a day's own sign-up and other venue reachable", () => {
    renderPage({
      ...bgm,
      days: [
        { _key: '28', date: '2099-01-28' },
        {
          _key: '29',
          date: '2099-01-29',
          signup: { method: 'lenke', url: 'https://example.no/finale' },
          venue: {
            name: 'Sølvberget',
            address: 'Kulturtorget 1',
            meetingPoint: { nb: 'Inngang B' },
          },
        },
      ],
    });
    expect(screen.getByRole('heading', { name: /29\. januar/ })).toBeInTheDocument();
    expect(screen.getByText('Sølvberget')).toBeInTheDocument();
    expect(screen.getByText('Inngang B')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Meld deg på/ })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /28\. januar/ })).not.toBeInTheDocument();
  });

  it("shows a day's other venue in its programme panel", () => {
    const days = withProgramme.days!.map((d) =>
      d._key === 'lor' ? { ...d, venue: { name: 'Sølvberget', contact: 'Kari, 99 99 99 99' } } : d,
    );
    renderPage({ ...withProgramme, days }, '/arrangementer/x?dag=2');
    expect(screen.getAllByText('Sølvberget').length).toBeGreaterThan(0);
    expect(screen.getByText('Kari, 99 99 99 99')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Vis i kart' })).toHaveLength(2);
  });
});
