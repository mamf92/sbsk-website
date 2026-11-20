import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PosterPromptPanel from './PosterPromptPanel';

describe('PosterPromptPanel', () => {
  afterEach(() => vi.restoreAllMocks());

  it('asks for a description instead of copying an empty prompt', async () => {
    const user = userEvent.setup();
    render(<PosterPromptPanel />);
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');

    await user.click(screen.getByRole('button', { name: 'Kopier prompt' }));

    expect(screen.getByText('Skriv først hva plakaten gjelder.')).toBeVisible();
    expect(writeText).not.toHaveBeenCalled();
  });

  it('copies the house prompt with the typed subject and confirms', async () => {
    const user = userEvent.setup();
    render(<PosterPromptPanel />);
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');

    await user.type(screen.getByLabelText('Hva gjelder plakaten?'), 'Julespillkveld');
    await user.click(screen.getByRole('button', { name: 'Kopier prompt' }));

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Julespillkveld'));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('#002F5F'));
    expect(screen.getByText(/Prompten er kopiert/)).toBeVisible();
  });

  it('says so when the clipboard is blocked', async () => {
    const user = userEvent.setup();
    render(<PosterPromptPanel />);
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('blocked'));

    await user.type(screen.getByLabelText('Hva gjelder plakaten?'), 'Turnering');
    await user.click(screen.getByRole('button', { name: 'Kopier prompt' }));

    expect(screen.getByText('Kunne ikke kopiere. Prøv igjen.')).toBeVisible();
  });
});
