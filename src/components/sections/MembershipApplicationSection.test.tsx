import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import MembershipApplicationSection from './MembershipApplicationSection';
import { CURRENT_LEGAL_VERSION } from '../../utils/legal';

const renderForm = (send = vi.fn().mockResolvedValue(undefined)) => {
  render(
    <MemoryRouter>
      <MembershipApplicationSection send={send} />
    </MemoryRouter>,
  );
  return send;
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
    await userEvent.click(screen.getByRole('button', { name: 'Send søknad' }));

    expect(send).toHaveBeenCalledWith({
      name: 'Sara',
      surname: 'Søker',
      email: 'sara@example.no',
      birthYear: 1990,
      message: null,
      privacyVersion: CURRENT_LEGAL_VERSION,
    });
    expect(await screen.findByText(/Søknaden er sendt/)).toBeInTheDocument();
  });

  it('asks for a real birth year before sending', async () => {
    const send = renderForm();
    await fill();
    await userEvent.type(screen.getByLabelText('Fødselsår (valgfritt)'), '90');
    await userEvent.click(screen.getByRole('button', { name: 'Send søknad' }));

    expect(screen.getByText('Skriv fødselsåret med fire sifre')).toBeInTheDocument();
    expect(send).not.toHaveBeenCalled();
  });

  it('tells the applicant how the data is used, with a link to the privacy policy', () => {
    renderForm();
    expect(screen.getByText(/Vi bruker opplysningene til å behandle søknaden/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Les personvernerklæringen' })).toHaveAttribute(
      'href',
      '/personvern',
    );
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('answers a filled honeypot with the normal success and sends nothing', async () => {
    const send = renderForm();
    await userEvent.type(screen.getByLabelText('Nettside'), 'spam.example');
    await userEvent.click(screen.getByRole('button', { name: 'Send søknad' }));
    expect(screen.getByText(/Søknaden er sendt/)).toBeInTheDocument();
    expect(send).not.toHaveBeenCalled();
  });

  it('keeps the form and says so when sending fails', async () => {
    renderForm(vi.fn().mockRejectedValue(new Error('offline')));
    await fill();
    await userEvent.click(screen.getByRole('button', { name: 'Send søknad' }));
    expect(await screen.findByText(/Kunne ikke sende søknaden/)).toBeInTheDocument();
    expect(screen.getByLabelText('Fornavn')).toHaveValue('Sara');
  });
});
