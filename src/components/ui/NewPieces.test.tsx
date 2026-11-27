import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { SectionHeading } from './SectionHeading';
import { FactsStrip } from './FactsStrip';
import { DateStamp } from './DateStamp';
import { EventPosterCard } from './EventPosterCard';
import { posterArt } from '../../utils/posterArt';
import { TextLink } from './TextLink';

describe('SectionHeading', () => {
  it('renders the title as a heading with its kicker and action', () => {
    render(
      <MemoryRouter>
        <SectionHeading
          title="Oppslagstavla"
          kicker="Siste fra klubben"
          action={<TextLink to="/innlegg">Alle innlegg</TextLink>}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Oppslagstavla' })).toBeInTheDocument();
    expect(screen.getByText('Siste fra klubben')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Alle innlegg' })).toHaveAttribute('href', '/innlegg');
  });
});

describe('FactsStrip', () => {
  it('renders every fact', () => {
    render(
      <FactsStrip
        facts={[
          { key: 'a', icon: null, content: 'Første' },
          { key: 'b', icon: null, content: 'Andre' },
        ]}
      />,
    );
    expect(screen.getByText('Første')).toBeInTheDocument();
    expect(screen.getByText('Andre')).toBeInTheDocument();
  });
});

describe('DateStamp', () => {
  it('names the full date for assistive tech', () => {
    render(<DateStamp start={new Date('2026-12-17T16:00:00Z')} />);
    expect(screen.getByRole('img')).toHaveAccessibleName(/17\. desember/);
  });

  it('shows a span of days as a range', () => {
    render(
      <DateStamp start={new Date('2027-01-29T16:00:00Z')} end={new Date('2027-01-31T16:00:00Z')} />,
    );
    expect(screen.getByRole('img')).toHaveTextContent('29–31');
  });
});

describe('EventPosterCard', () => {
  const props = {
    kind: 'turnering' as const,
    title: 'Vårturnering i Catan',
    start: new Date('2027-03-13T09:00:00Z'),
    end: new Date('2027-03-13T16:00:00Z'),
    location: 'Tasta bydelshus, Stavanger',
    image: null,
    attendance: 'Påmelding',
  };

  it('links «Les mer» to the event page and shows its facts', () => {
    render(
      <MemoryRouter>
        <EventPosterCard {...props} href="/arrangementer/catan" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Vårturnering i Catan' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Les mer/ })).toHaveAttribute(
      'href',
      '/arrangementer/catan',
    );
    expect(screen.getByText('10:00–17:00')).toBeInTheDocument();
    expect(screen.getByText('Tasta bydelshus')).toBeInTheDocument();
  });

  it('shows no link without a page', () => {
    render(
      <MemoryRouter>
        <EventPosterCard {...props} href={null} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('falls back to house art by kind', () => {
    expect(posterArt('festival', 'x')).toContain('festival');
    expect(posterArt('spillkveld', 'Julespillkveld')).toContain('jul');
  });
});
