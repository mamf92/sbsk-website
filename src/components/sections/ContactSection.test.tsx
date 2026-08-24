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

  it('shows an error under every empty field on submit, and never calls the helper', async () => {
    const user = userEvent.setup();
    render(<ContactSection />);

    await user.click(fields().submit);

    expect(screen.getByText('Navn er påkrevd')).toBeInTheDocument();
    expect(screen.getByText('E-post er påkrevd')).toBeInTheDocument();
    expect(screen.getByText('Skriv en melding før du sender')).toBeInTheDocument();
    expect(createContactMessage).not.toHaveBeenCalled();
  });

  it('flags a malformed email without complaining about the fields that are fine', async () => {
    const user = userEvent.setup();
    render(<ContactSection />);

    const { name, email, message } = fields();
    await user.type(name, 'Ola Nordmann');
    await user.type(email, 'ikke-en-epost');
    await user.type(message, 'Hei!');
    await user.click(fields().submit);

    expect(screen.getByText('Ugyldig e-post — må inneholde @ og et domene')).toBeInTheDocument();
    expect(screen.queryByText('Navn er påkrevd')).not.toBeInTheDocument();
    expect(screen.queryByText('Skriv en melding før du sender')).not.toBeInTheDocument();
  });

  it('clears a field error as soon as the user retypes it, without a second submit', async () => {
    const user = userEvent.setup();
    render(<ContactSection />);

    await user.click(fields().submit);
    expect(screen.getByText('Navn er påkrevd')).toBeInTheDocument();

    await user.type(fields().name, 'O');
    expect(screen.queryByText('Navn er påkrevd')).not.toBeInTheDocument();
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

  it('disables the submit button while the request is in flight', async () => {
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

    expect(fields().submit).toBeDisabled();

    resolveSubmit();
    await waitFor(() => expect(fields().submit).not.toBeDisabled());
  });
});
