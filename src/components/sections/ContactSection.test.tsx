import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ContactSection from './ContactSection';

const createContactMessage = vi.fn();

// The vitest config forbids a real Supabase call — the query helper is mocked, not the client,
// per the repo's own rule (see member-portal-loader.test.ts).
vi.mock('../../supabase/queryHelpers/createContactMessage', () => ({
  createContactMessage: (values: unknown) => createContactMessage(values),
}));

const fields = () => ({
  name: screen.getByPlaceholderText('Ditt navn'),
  email: screen.getByPlaceholderText('deg@epost.no'),
  message: screen.getByPlaceholderText('Skriv din melding her...'),
  submit: screen.getByRole('button', { name: 'Send melding' }),
});

const fillValid = async (user: ReturnType<typeof userEvent.setup>) => {
  const { name, email, message } = fields();
  await user.type(name, 'Ola Nordmann');
  await user.type(email, 'ola@epost.no');
  await user.type(message, 'Hei, jeg har et spørsmål.');
};

beforeEach(() => {
  createContactMessage.mockReset();
});

describe('ContactSection', () => {
  it('renders the heading, intro and static contact info', () => {
    render(<ContactSection />);

    expect(screen.getByRole('heading', { level: 1, name: 'Kontakt oss!' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'hei@sbsk.no' })).toHaveAttribute(
      'href',
      'mailto:hei@sbsk.no',
    );
    expect(screen.getByRole('link', { name: 'Facebook-gruppa vår' })).toHaveAttribute(
      'href',
      'https://www.facebook.com/groups/1699569943629396',
    );
  });

  it('disables Send until every field is valid', async () => {
    const user = userEvent.setup();
    render(<ContactSection />);

    expect(fields().submit).toBeDisabled();

    await fillValid(user);
    expect(fields().submit).not.toBeDisabled();
  });

  it('shows the invalid treatment on every field once each is blurred while still empty', async () => {
    const user = userEvent.setup();
    render(<ContactSection />);

    const { name, email, message } = fields();
    await user.click(name);
    await user.tab();
    await user.tab();
    await user.tab();

    expect(screen.getByText('Navn må være minst 2 tegn')).toBeInTheDocument();
    expect(screen.getByText('E-post er påkrevd')).toBeInTheDocument();
    expect(screen.getByText('Skriv en melding før du sender')).toBeInTheDocument();
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(message).toHaveAttribute('aria-invalid', 'true');
    expect(fields().submit).toBeDisabled();
    expect(createContactMessage).not.toHaveBeenCalled();
  });

  it('flags a malformed email on blur without complaining about the fields that are fine', async () => {
    const user = userEvent.setup();
    render(<ContactSection />);

    const { name, email, message } = fields();
    await user.type(name, 'Ola Nordmann');
    await user.type(email, 'ikke-en-epost');
    await user.tab();
    await user.type(message, 'Hei!');
    await user.tab();

    expect(screen.getByText('Ugyldig e-post — må inneholde @ og et domene')).toBeInTheDocument();
    expect(screen.queryByText('Navn må være minst 2 tegn')).not.toBeInTheDocument();
    expect(screen.queryByText('Skriv en melding før du sender')).not.toBeInTheDocument();
    expect(fields().submit).toBeDisabled();
  });

  it('clears a field error as soon as the user retypes it, without a second blur', async () => {
    const user = userEvent.setup();
    render(<ContactSection />);

    const { name } = fields();
    await user.click(name);
    await user.tab();
    expect(screen.getByText('Navn må være minst 2 tegn')).toBeInTheDocument();

    await user.click(name);
    await user.type(name, 'Ola');
    expect(screen.queryByText('Navn må være minst 2 tegn')).not.toBeInTheDocument();
  });

  it('marks a field valid once it is blurred and passes, not before', async () => {
    const user = userEvent.setup();
    render(<ContactSection />);

    const { name } = fields();
    await user.type(name, 'Ola');
    expect(name).not.toHaveAttribute('aria-invalid');
    expect(name.className).not.toMatch(/shadow-success/);

    await user.tab();
    expect(name.className).toMatch(/shadow-success/);
  });

  it('sends the trimmed values and shows the success notice on a valid submit', async () => {
    createContactMessage.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ContactSection />);

    const { name, email, message } = fields();
    await user.type(name, '  Ola Nordmann  ');
    await user.type(email, 'ola@epost.no');
    await user.type(message, 'Hei, jeg har et spørsmål.');
    await user.click(fields().submit);

    await waitFor(() => expect(createContactMessage).toHaveBeenCalledTimes(1));
    expect(createContactMessage).toHaveBeenCalledWith({
      name: 'Ola Nordmann',
      email: 'ola@epost.no',
      message: 'Hei, jeg har et spørsmål.',
    });

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Meldingen din er sendt. Vi svarer så snart vi kan.',
    );
  });

  it('keeps the honeypot field out of the tab order and the accessibility tree', () => {
    const { container } = render(<ContactSection />);

    expect(screen.queryByRole('textbox', { name: 'Nettside' })).not.toBeInTheDocument();
    const honeypot = container.querySelector('#website');
    expect(honeypot).toHaveAttribute('tabindex', '-1');
    expect(honeypot).toHaveAttribute('aria-hidden', 'true');
  });

  it('pretends to succeed without sending anything when the honeypot field is filled', async () => {
    const user = userEvent.setup();
    const { container } = render(<ContactSection />);

    await fillValid(user);
    const honeypot = container.querySelector('#website') as HTMLInputElement;
    await user.type(honeypot, 'http://spam.example');
    await user.click(fields().submit);

    expect(createContactMessage).not.toHaveBeenCalled();
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Meldingen din er sendt. Vi svarer så snart vi kan.',
    );
  });

  it('shows the generic failure banner when the helper rejects, not the raw backend error', async () => {
    createContactMessage.mockRejectedValue(new Error('duplicate key value violates unique...'));
    const user = userEvent.setup();
    render(<ContactSection />);

    await fillValid(user);
    await user.click(fields().submit);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Kunne ikke sende meldingen. Noe gikk galt på vår side — prøv igjen om litt.',
    );
    expect(alert).not.toHaveTextContent('duplicate key');
  });

  it('disables the submit button and every field while the request is in flight', async () => {
    let resolveSubmit!: () => void;
    createContactMessage.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      }),
    );
    const user = userEvent.setup();
    render(<ContactSection />);

    await fillValid(user);
    await user.click(fields().submit);

    const { name, email, message, submit } = fields();
    expect(submit).toBeDisabled();
    expect(name).toBeDisabled();
    expect(email).toBeDisabled();
    expect(message).toBeDisabled();

    resolveSubmit();
    await waitFor(() => expect(fields().name).not.toBeDisabled());

    // The form resets to empty on success, so Send goes back to disabled — now because
    // there is nothing valid to send, not because a request is in flight.
    expect(fields().submit).toBeDisabled();
  });
});
