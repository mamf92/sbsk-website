import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ApplicationsPanel from './ApplicationsPanel';
import { welcomeMailto } from '../../../utils/membershipApplication';
import type { Application } from '../../../supabase/queryHelpers/membershipApplications';

vi.mock('react-router-dom', () => ({ useRevalidator: () => ({ revalidate: vi.fn() }) }));

const sara: Application = {
  id: 'app-1',
  created_at: '2026-11-20T10:00:00Z',
  name: 'Sara',
  surname: 'Søker',
  email: 'sara@example.no',
  birth_year: 1990,
  message: 'Jeg liker Carcassonne.',
};

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
    expect(screen.getByRole('link', { name: 'Send velkomst-e-post' })).toHaveAttribute(
      'href',
      expect.stringMatching(/^mailto:sara@example\.no\?/),
    );
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

  it('writes a welcome email with spaces, not plus signs', () => {
    const href = welcomeMailto(sara);
    expect(href).not.toContain('+');
    expect(decodeURIComponent(href)).toContain('/lag-medlemsprofil');
  });
});
