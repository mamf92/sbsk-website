import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SignupBlock } from './SignupBlock';
import { setLocale } from '../../utils/locale';

const now = new Date('2027-01-10T12:00:00Z');
const url = 'https://spond.com/landing/event/abc';

describe('SignupBlock', () => {
  it('renders nothing without a sign-up', () => {
    const { container } = render(<SignupBlock signup={undefined} now={now} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for a link sign-up with an unsafe URL', () => {
    const { container } = render(
      <SignupBlock signup={{ method: 'lenke', url: 'javascript:alert(1)' }} now={now} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('opens the sign-up in a new tab, named by the visible label, with the host as hint', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    render(
      <SignupBlock
        signup={{ method: 'spond', url, label: { nb: 'Meld deg på turneringen' } }}
        now={now}
      />,
    );
    const button = screen.getByRole('button', { name: 'Meld deg på turneringen' });
    expect(button).toHaveAccessibleDescription('Åpner spond.com i en ny fane');
    await userEvent.click(button);
    expect(open).toHaveBeenCalledWith(url, '_blank', 'noopener,noreferrer');
  });

  it('drops an unparseable deadline instead of crashing the page', () => {
    render(<SignupBlock signup={{ method: 'spond', url, closes: 'snart' }} now={now} />);
    const button = screen.getByRole('button', { name: 'Meld deg på' });
    expect(button).toHaveAccessibleDescription('Åpner spond.com i en ny fane');
  });

  it('falls back to the default label', () => {
    render(<SignupBlock signup={{ method: 'spond', url }} now={now} />);
    expect(screen.getByRole('button', { name: 'Meld deg på' })).toBeInTheDocument();
  });

  it('names the deadline in Oslo time', () => {
    render(
      <SignupBlock signup={{ method: 'spond', url, closes: '2027-01-20T22:59:00Z' }} now={now} />,
    );
    expect(screen.getByText(/Frist onsdag 20\. januar kl\. 23:59/)).toBeInTheDocument();
  });

  it('shows a disabled button and the opening time before sign-up opens', () => {
    render(
      <SignupBlock signup={{ method: 'spond', url, opens: '2027-01-15T17:00:00Z' }} now={now} />,
    );
    expect(screen.getByRole('button', { name: 'Meld deg på' })).toBeDisabled();
    expect(screen.getByText(/Påmeldingen åpner fredag 15\. januar kl\. 18:00/)).toBeInTheDocument();
  });

  it('says when sign-up is closed, and when there is none to do', () => {
    const { rerender } = render(<SignupBlock signup={{ method: 'stengt' }} now={now} />);
    expect(screen.getByText('Påmeldingen er stengt')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    rerender(<SignupBlock signup={{ method: 'oppmote' }} now={now} />);
    expect(screen.getByText('Ingen påmelding – bare møt opp')).toBeInTheDocument();
  });

  it('is a small secondary button with no hint when compact', () => {
    render(<SignupBlock signup={{ method: 'spond', url }} now={now} compact />);
    const button = screen.getByRole('button', { name: 'Meld deg på' });
    expect(button).not.toHaveAccessibleDescription();
    expect(screen.queryByText(/spond\.com/)).not.toBeInTheDocument();
  });

  it('translates, and marks Norwegian fallback text', () => {
    act(() => setLocale('en'));
    render(
      <SignupBlock
        signup={{
          method: 'spond',
          url,
          label: { nb: 'Meld deg på' },
          note: { nb: 'Én dag om gangen' },
        }}
        now={now}
      />,
    );
    expect(screen.getByRole('button', { name: 'Meld deg på' })).toHaveAttribute('lang', 'nb');
    expect(screen.getByText('Opens spond.com in a new tab')).toBeInTheDocument();
    expect(screen.getByText('Én dag om gangen')).toHaveAttribute('lang', 'nb');
  });
});
