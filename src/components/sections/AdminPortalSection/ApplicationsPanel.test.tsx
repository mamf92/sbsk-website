import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ApplicationsPanel from './ApplicationsPanel';
import { welcomeMailto } from '../../../utils/membershipApplication';
import type { Application } from '../../../supabase/queryHelpers/membershipApplications';

const revalidate = vi.fn();
vi.mock('react-router-dom', () => ({ useRevalidator: () => ({ revalidate }) }));

const sara: Application = {
  id: 'app-1',
  created_at: '2026-11-20T10:00:00Z',
  name: 'Sara',
  surname: 'Søker',
  email: 'sara@example.no',
  birth_year: 1990,
  message: 'Jeg liker Carcassonne.',
};
const ola: Application = { ...sara, id: 'app-2', name: 'Ola', email: 'ola@example.no' };

describe('ApplicationsPanel', () => {
  it('renders nothing when there is nothing to decide', () => {
    const { container } = render(<ApplicationsPanel applications={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('approves, then offers the welcome email', async () => {
    const approve = vi.fn().mockResolvedValue('member-9');
    render(<ApplicationsPanel applications={[sara]} approve={approve} reject={vi.fn()} />);
    expect(screen.getByRole('region', { name: 'Søknader (1)' })).toBeInTheDocument();
    expect(screen.getByText('«Jeg liker Carcassonne.»')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Godkjenn Sara Søker' }));

    expect(approve).toHaveBeenCalledWith('app-1');
    expect(screen.getByText(/står nå i medlemslisten/)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Send velkomst-e-post til Sara Søker' }),
    ).toHaveAttribute('href', expect.stringMatching(/^mailto:sara@example\.no\?/));
    expect(screen.queryByRole('button', { name: 'Godkjenn Sara Søker' })).not.toBeInTheDocument();
  });

  it('explains an applicant who is already a member', async () => {
    const approve = vi.fn().mockRejectedValue({ message: 'already_member' });
    render(<ApplicationsPanel applications={[sara]} approve={approve} reject={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Godkjenn Sara Søker' }));
    expect(await screen.findByText(/står allerede i medlemslisten/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Godkjenn Sara Søker' })).toBeInTheDocument();
  });

  it('rejects and removes the row', async () => {
    const reject = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <ApplicationsPanel applications={[sara]} approve={vi.fn()} reject={reject} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Avslå Sara Søker' }));
    expect(reject).toHaveBeenCalledWith('app-1');
    expect(container).toBeEmptyDOMElement();
  });

  it('warns when applications could not be read', () => {
    render(<ApplicationsPanel applications={null} />);
    expect(screen.getByText('Søknadene kunne ikke hentes akkurat nå.')).toBeInTheDocument();
  });

  it('keeps every welcome link when the board approves several in a row', async () => {
    const approve = vi.fn().mockResolvedValue('member-9');
    render(<ApplicationsPanel applications={[sara, ola]} approve={approve} reject={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Godkjenn Sara Søker' }));
    await userEvent.click(screen.getByRole('button', { name: 'Godkjenn Ola Søker' }));
    expect(
      screen.getByRole('link', { name: 'Send velkomst-e-post til Sara Søker' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Send velkomst-e-post til Ola Søker' }),
    ).toBeInTheDocument();
  });

  it('shows the spinner on the button that was pressed', async () => {
    let finish: () => void = () => {};
    const reject = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    render(<ApplicationsPanel applications={[sara]} approve={vi.fn()} reject={reject} />);
    await userEvent.click(screen.getByRole('button', { name: 'Avslå Sara Søker' }));
    expect(screen.getByRole('button', { name: 'Avslå Sara Søker' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Godkjenn Sara Søker' })).not.toHaveAttribute(
      'aria-busy',
    );
    finish();
  });

  it('reloads when someone else in the board decided first', async () => {
    revalidate.mockClear();
    const approve = vi.fn().mockRejectedValue({ message: 'not_pending' });
    render(<ApplicationsPanel applications={[sara]} approve={approve} reject={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Godkjenn Sara Søker' }));
    expect(await screen.findByText(/allerede behandlet/)).toBeInTheDocument();
    expect(revalidate).toHaveBeenCalled();
  });

  it("encodes the applicant's address, so it cannot add recipients", () => {
    const href = welcomeMailto({ name: 'X', email: 'x@evil.no?cc=victim@example.com&body=hi#' });
    expect(href).toMatch(/^mailto:x@evil\.no%3Fcc%3Dvictim@example\.com%26body%3Dhi%23\?subject=/);
  });

  it('writes a welcome email with spaces, not plus signs', () => {
    const href = welcomeMailto(sara);
    expect(href).not.toContain('+');
    expect(decodeURIComponent(href)).toContain('/lag-medlemsprofil');
  });
});
