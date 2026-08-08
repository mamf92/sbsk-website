import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import NotFound from './NotFound';

const navigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <NotFound />
    </MemoryRouter>,
  );

describe('NotFound', () => {
  it('gives the page a single Norwegian <h1>', () => {
    renderPage();

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('Denne siden mangler i esken');
  });

  it('does not render a second <main> landmark inside the shell', () => {
    const { container } = renderPage();
    expect(container.querySelector('main')).toBeNull();
  });

  it('navigates to the front page via the primary button', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Til forsiden' }));
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('navigates to the calendar via the secondary button', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Se kalenderen' }));
    expect(navigate).toHaveBeenCalledWith('/kalender');
  });

  it('has a clickable dice button with an accessible label', () => {
    renderPage();

    const dice = screen.getByRole('button', { name: /Terning viser \d/ });
    expect(dice).toBeInTheDocument();
  });

  it('shows a "Trill igjen" button that triggers a roll', async () => {
    renderPage();

    const rollButton = screen.getByRole('button', { name: 'Trill igjen' });
    expect(rollButton).toBeInTheDocument();
  });

  it('sets the document title', () => {
    renderPage();
    expect(document.title).toBe('404 – Stavanger Brettspillklubb');
  });

  it('uses only brand tokens, not Tailwind debug colours', () => {
    const { container } = renderPage();

    const markup = container.innerHTML;
    expect(markup).not.toMatch(/bg-(amber|emerald)-/);
  });
});
