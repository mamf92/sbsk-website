import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VenueCard } from './VenueCard';
import { mapUrl } from '../../utils/mapUrl';

vi.mock('../../sanity/editors/portableTextComponents', () => ({ components: {} }));

describe('VenueCard', () => {
  it('renders nothing without a place name', () => {
    const { container } = render(<VenueCard venue={{ address: 'Et sted' }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the place, a map link, doors-open time and the optional parts', () => {
    render(
      <VenueCard
        venue={{
          name: 'Tasta bydelshus',
          address: 'Tastarustå 6, 4027 Stavanger',
          doorsOpen: '09:30',
          meetingPoint: { nb: 'Inngang fra parkeringsplassen' },
          accessibility: { nb: 'Trinnfri inngang' },
          contact: 'Kari',
        }}
      />,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Oppmøte' })).toBeInTheDocument();
    const map = screen.getByRole('link', { name: /Vis i kart/ });
    expect(map).toHaveAttribute('href', mapUrl('Tastarustå 6, 4027 Stavanger'));
    expect(map).toHaveAttribute('rel', 'noopener noreferrer');
    expect(map).toHaveTextContent('(åpnes i ny fane)');
    expect(screen.getByText('Dørene åpner 09:30')).toBeInTheDocument();
    expect(screen.getByText('Inngang fra parkeringsplassen')).toBeInTheDocument();
    expect(screen.getByText('Trinnfri inngang')).toBeInTheDocument();
    expect(screen.getByText('Kontaktperson på stedet: Kari')).toBeInTheDocument();
  });

  it('builds an OpenStreetMap search that cannot break out of the query', () => {
    expect(mapUrl('a&b "c"')).toBe('https://www.openstreetmap.org/search?query=a%26b%20%22c%22');
  });

  it('takes a heading level and title', () => {
    render(<VenueCard venue={{ name: 'Sted' }} headingLevel="h3" title="Annet sted fredag" />);
    expect(
      screen.getByRole('heading', { level: 3, name: 'Annet sted fredag' }),
    ).toBeInTheDocument();
  });
});
