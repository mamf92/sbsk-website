import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom';
import RouteError from './RouteError';

/**
 * Renders a route whose loader throws `thrown`, with RouteError as its boundary — the same wiring
 * as src/main.tsx, so these pin the behaviour a visitor actually gets rather than the component in
 * isolation.
 */
function renderThrowing(thrown: unknown) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        // Stands in for App: the point of the pathless boundary is that the error renders
        // *inside* this Outlet, leaving the shell around it intact.
        element: (
          <div>
            <span>shell</span>
            <Outlet />
          </div>
        ),
        children: [
          {
            errorElement: <RouteError />,
            children: [
              {
                path: 'ting',
                element: <div>content</div>,
                loader: () => {
                  throw thrown;
                },
              },
            ],
          },
        ],
      },
    ],
    { initialEntries: ['/ting'] },
  );

  return render(<RouterProvider router={router} />);
}

describe('RouteError', () => {
  it('renders the 404 treatment when a loader throws a 404 response', async () => {
    renderThrowing(new Response('Event not found', { status: 404 }));

    // A slug that does not resolve is, to a visitor, a page that does not exist.
    expect(
      await screen.findByRole('heading', { name: 'Denne siden mangler i esken' }),
    ).toBeVisible();
    // The title is set in an effect, which has not necessarily flushed when the heading appears.
    await waitFor(() => expect(document.title).toBe('404 – Stavanger Brettspillklubb'));
  });

  it('does not claim a page is missing when the fault is ours', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderThrowing(new TypeError("Cannot read properties of undefined (reading 'current')"));

    expect(await screen.findByRole('heading', { name: 'Noe gikk galt hos oss' })).toBeVisible();
    // Telling someone the page does not exist when our own code threw sends them away for good.
    expect(screen.queryByText('Denne siden mangler i esken')).toBeNull();
    expect(screen.getByRole('button', { name: /Prøv igjen/ })).toBeVisible();
  });

  it('treats a non-404 error response as a fault, not a missing page', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderThrowing(new Response('upstream exploded', { status: 500 }));

    expect(await screen.findByRole('heading', { name: 'Noe gikk galt hos oss' })).toBeVisible();
  });

  it('logs a real fault so a vague bug report is still diagnosable', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderThrowing(new Error('boom'));

    await screen.findByRole('heading', { name: 'Noe gikk galt hos oss' });
    await waitFor(() => expect(logged).toHaveBeenCalled());
  });

  it('stays quiet for a 404, which is not a fault', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderThrowing(new Response(null, { status: 404 }));

    await screen.findByRole('heading', { name: 'Denne siden mangler i esken' });
    expect(logged).not.toHaveBeenCalled();
  });
});
