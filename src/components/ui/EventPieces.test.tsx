import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { EventHeroBand } from './EventHeroBand';
import { HeroFact, HeroFactNote } from './HeroFact';
import { InfoCard, InfoList, InfoRow } from './InfoCard';
import { Polaroid } from './Polaroid';
import Clock from '../../assets/icons/symbols/clock.svg?react';

describe('EventHeroBand', () => {
  it('links back and renders its content and picture', () => {
    render(
      <MemoryRouter>
        <EventHeroBand back={{ to: '/kalender', label: 'Kalender' }} media={<img alt="Bilde" />}>
          <h1>Vårturnering</h1>
        </EventHeroBand>
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Kalender' })).toHaveAttribute('href', '/kalender');
    expect(screen.getByRole('heading', { level: 1, name: 'Vårturnering' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Bilde' })).toBeInTheDocument();
  });
});

describe('HeroFact', () => {
  it('says the fact in text, with the icon hidden', () => {
    const { container } = render(
      <HeroFact icon={Clock}>
        Lørdag 13. mars <HeroFactNote>Dørene åpner 09:30</HeroFactNote>
      </HeroFact>,
    );
    expect(container).toHaveTextContent('Lørdag 13. mars Dørene åpner 09:30');
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('InfoCard', () => {
  it('names its rows as a description list', () => {
    render(
      <InfoCard title="Godt å vite">
        <InfoList>
          <InfoRow label="Oppmøte">Hovedsalen</InfoRow>
        </InfoList>
      </InfoCard>,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Godt å vite' })).toBeInTheDocument();
    expect(screen.getByRole('term')).toHaveTextContent('Oppmøte');
    expect(screen.getByRole('definition')).toHaveTextContent('Hovedsalen');
  });
});

describe('Polaroid', () => {
  it('writes the caption on the print only when there is one', () => {
    const { rerender, container } = render(<Polaroid caption="Spillkveld">x</Polaroid>);
    expect(screen.getByText('Spillkveld')).toBeInTheDocument();
    rerender(<Polaroid>x</Polaroid>);
    expect(container).toHaveTextContent(/^x$/);
  });
});
