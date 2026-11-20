import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PosterPromptPanel from './PosterPromptPanel';

describe('PosterPromptPanel', () => {
  afterEach(() => vi.restoreAllMocks());

  it('asks for a title instead of copying an empty prompt', async () => {
    const user = userEvent.setup();
    render(<PosterPromptPanel />);
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');

    await user.click(screen.getByRole('button', { name: 'Kopier prompt' }));

    expect(screen.getByText('Skriv først en tittel.')).toBeVisible();
    expect(writeText).not.toHaveBeenCalled();
  });

  it('copies the house prompt with the typed subject and confirms', async () => {
    const user = userEvent.setup();
    render(<PosterPromptPanel />);
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');

    await user.type(screen.getByLabelText('Tittel'), 'Juleavslutning');
    await user.type(screen.getByLabelText('Dato'), '13. desember');
    await user.type(screen.getByLabelText('Sted'), 'Klubbhuset');
    await user.click(screen.getByRole('button', { name: 'Kopier prompt' }));

    const prompt = writeText.mock.calls[0][0];
    expect(prompt).toContain('Title: "Juleavslutning"');
    expect(prompt).toContain('Date: "13. desember"');
    expect(prompt).toContain('Place: "Klubbhuset"');
    expect(prompt).not.toContain('Time:');
    expect(prompt).toContain('#002F5F');
    expect(prompt).toContain('finished, ready-to-print poster');
    expect(prompt).not.toMatch(/No text, no letters/);
    expect(prompt).toContain('Portrait A-format');
    expect(screen.getByText(/Prompten er kopiert/)).toBeVisible();
  });

  it('switches to a landscape poster', async () => {
    const user = userEvent.setup();
    render(<PosterPromptPanel />);
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');

    await user.type(screen.getByLabelText('Tittel'), 'Turnering');
    await user.click(screen.getByLabelText('Liggende'));
    await user.click(screen.getByRole('button', { name: 'Kopier prompt' }));

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('landscape poster'));
  });

  it('says so when the clipboard is blocked', async () => {
    const user = userEvent.setup();
    render(<PosterPromptPanel />);
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('blocked'));

    await user.type(screen.getByLabelText('Tittel'), 'Turnering');
    await user.click(screen.getByRole('button', { name: 'Kopier prompt' }));

    expect(screen.getByText('Kunne ikke kopiere. Prøv igjen.')).toBeVisible();
  });
});
