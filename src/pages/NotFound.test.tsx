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
    expect(headings[0]).toHaveTextContent('Finner ikke siden');
  });

  it('does not render a second <main> landmark inside the shell', () => {
    const { container } = renderPage();
    expect(container.querySelector('main')).toBeNull();
  });

  it('sends the user back to the front page', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Til forsiden' }));
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('uses only brand tokens, not Tailwind debug colours', () => {
    const { container } = renderPage();

    const markup = container.innerHTML;
    expect(markup).not.toMatch(/bg-(amber|emerald)-/);
    expect(markup).toMatch(/dark:bg-darkestblue/);
  });
});
