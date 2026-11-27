import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import MembershipApplicationSection from './MembershipApplicationSection';
import { CURRENT_LEGAL_VERSION } from '../../utils/legal';
import type { CalendarEventTypes } from '../../sanity/queryHelpers/events';

const renderForm = (
  send = vi.fn().mockResolvedValue(undefined),
  nextGameNight: CalendarEventTypes | null = null,
) => {
  render(
    <MemoryRouter>
      <MembershipApplicationSection send={send} nextGameNight={nextGameNight} />
    </MemoryRouter>,
  );
  return send;
};

const gameNight: CalendarEventTypes = {
  _id: 'spillkveld-1',
  title: 'Spillkveld',
  category: 'spillkveld',
  location: 'Byhaugkafeen',
  eventStartTime: new Date('2026-12-03T16:00:00Z'),
  eventEndTime: new Date('2026-12-03T22:00:00Z'),
};

async function fill() {
  await userEvent.type(screen.getByLabelText('Fornavn'), 'Sara');
  await userEvent.type(screen.getByLabelText('Etternavn'), 'Søker');
  await userEvent.type(screen.getByLabelText('E-post'), 'sara@example.no');
}

describe('MembershipApplicationSection', () => {
  it('sends a complete application with the privacy version shown', async () => {
    const send = renderForm();
    await fill();
    await userEvent.type(screen.getByLabelText('Fødselsår (valgfritt)'), '1990');
    await userEvent.click(screen.getByRole('button', { name: 'Meld meg inn' }));

    expect(send).toHaveBeenCalledWith({
      name: 'Sara',
      surname: 'Søker',
      email: 'sara@example.no',
      birthYear: 1990,
      message: null,
      privacyVersion: CURRENT_LEGAL_VERSION,
    });
    expect(await screen.findByRole('heading', { name: 'Takk, Sara!' })).toBeInTheDocument();
    expect(screen.getByText('sara@example.no')).toBeInTheDocument();
    expect(screen.getByRole('listitem', { current: 'step' })).toHaveTextContent(
      'Styret legger deg til',
    );
  });

  it('asks for a real birth year before sending', async () => {
    const send = renderForm();
    await fill();
    await userEvent.type(screen.getByLabelText('Fødselsår (valgfritt)'), '90');
    await userEvent.click(screen.getByRole('button', { name: 'Meld meg inn' }));

    expect(screen.getByText('Skriv fødselsåret med fire sifre')).toBeInTheDocument();
    expect(send).not.toHaveBeenCalled();
  });

  it('tells the applicant how the data is used, with a link to the privacy policy', () => {
    renderForm();
    expect(screen.getByText(/Vi bruker dette bare til innmeldingen/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Les personvernerklæringen' })).toHaveAttribute(
      'href',
      '/personvern',
    );
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('answers a filled honeypot with the normal success and sends nothing', async () => {
    const send = renderForm();
    await fill();
    await userEvent.type(screen.getByLabelText('Nettside'), 'spam.example');
    await userEvent.click(screen.getByRole('button', { name: 'Meld meg inn' }));
    expect(screen.getByRole('heading', { name: 'Takk, Sara!' })).toBeInTheDocument();
    expect(screen.getByText('sara@example.no')).toBeInTheDocument();
    expect(send).not.toHaveBeenCalled();
  });

  it('keeps the form and says so when sending fails', async () => {
    renderForm(vi.fn().mockRejectedValue(new Error('offline')));
    await fill();
    await userEvent.click(screen.getByRole('button', { name: 'Meld meg inn' }));
    expect(await screen.findByText(/Kunne ikke sende/)).toBeInTheDocument();
    expect(screen.getByLabelText('Fornavn')).toHaveValue('Sara');
  });

  it('starts on step 1 of the three steps', () => {
    renderForm();
    expect(screen.getByRole('heading', { name: 'Meld deg inn' })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { current: 'step' })).toHaveTextContent('Send inn');
    expect(screen.getByText('Lag profil')).toBeInTheDocument();
  });

  it('offers the next game night after sending, when there is one', async () => {
    renderForm(undefined, gameNight);
    await fill();
    await userEvent.click(screen.getByRole('button', { name: 'Meld meg inn' }));
    expect(await screen.findByText('Mens du venter')).toBeInTheDocument();
    expect(screen.getByText('Kom på spillkveld torsdag 3. desember')).toBeInTheDocument();
    expect(screen.getByText(/Byhaugkafeen fra 17:00/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Legg i kalenderen' })).toBeInTheDocument();
  });

  it('leaves the game night note out when there is none', async () => {
    renderForm();
    await fill();
    await userEvent.click(screen.getByRole('button', { name: 'Meld meg inn' }));
    await screen.findByRole('heading', { name: 'Takk, Sara!' });
    expect(screen.queryByText('Mens du venter')).not.toBeInTheDocument();
  });
});
