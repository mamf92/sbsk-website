import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { Dialog } from './Dialog';

// The contract for Dialog. jsdom has no top layer, no focus trap and no Escape handling —
// those belong to `showModal()` and are checked in e2e/dialog.spec.ts. What is pinned here
// is everything this component adds on top of the native element: the labelling, the
// heading level, the scroll lock, and focus restoration to the opener.
describe('Dialog', () => {
  it('renders as a modal dialog with an accessible name', () => {
    render(
      <Dialog title="Rediger medlem" onClose={vi.fn()}>
        <p>Innhold</p>
      </Dialog>,
    );

    expect(screen.getByRole('dialog', { name: 'Rediger medlem' })).toBeInTheDocument();
  });

  it('titles itself with an h2, so a route h1 stays the only one', () => {
    render(
      <Dialog title="Rediger profil" onClose={vi.fn()}>
        <p>Innhold</p>
      </Dialog>,
    );

    const heading = screen.getByRole('heading', { name: 'Rediger profil' });
    expect(heading.tagName).toBe('H2');
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', heading.id);
  });

  it('renders its children and a headerEnd slot', () => {
    render(
      <Dialog title="Tittel" headerEnd={<img alt="Profilbilde" src="x.png" />} onClose={vi.fn()}>
        <p>Skjema</p>
      </Dialog>,
    );

    expect(screen.getByText('Skjema')).toBeInTheDocument();
    expect(screen.getByAltText('Profilbilde')).toBeInTheDocument();
  });

  it('opens itself when it is rendered', () => {
    render(
      <Dialog title="Tittel" onClose={vi.fn()}>
        <p>x</p>
      </Dialog>,
    );

    expect(screen.getByRole('dialog')).toHaveAttribute('open');
  });

  it('does not open while `open` is false, and opens when it flips', () => {
    const { rerender } = render(
      <Dialog title="Tittel" open={false} onClose={vi.fn()}>
        <p>x</p>
      </Dialog>,
    );
    expect(document.querySelector('dialog')).not.toHaveAttribute('open');

    rerender(
      <Dialog title="Tittel" open onClose={vi.fn()}>
        <p>x</p>
      </Dialog>,
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('open');
  });

  it('reports a browser-driven close, but not one the caller asked for', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Dialog title="Tittel" onClose={onClose}>
        <p>x</p>
      </Dialog>,
    );

    // What Escape does: the browser closes the dialog and fires `close`.
    (screen.getByRole('dialog') as HTMLDialogElement).close();
    expect(onClose).toHaveBeenCalledOnce();

    onClose.mockClear();
    rerender(
      <Dialog title="Tittel" open={false} onClose={onClose}>
        <p>x</p>
      </Dialog>,
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it('locks page scroll while open and releases it on unmount', () => {
    const { unmount } = render(
      <Dialog title="Tittel" onClose={vi.fn()}>
        <p>x</p>
      </Dialog>,
    );

    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('returns focus to the element that was focused when it opened', async () => {
    function Host() {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Rediger</button>
          {open && (
            <Dialog title="Tittel" onClose={() => setOpen(false)}>
              <button onClick={() => setOpen(false)}>Avbryt</button>
            </Dialog>
          )}
        </>
      );
    }

    render(<Host />);
    const opener = screen.getByRole('button', { name: 'Rediger' });
    await userEvent.click(opener);
    await userEvent.click(screen.getByRole('button', { name: 'Avbryt' }));

    expect(opener).toHaveFocus();
  });

  it('returns focus to `returnFocusTo` when the opener is gone', async () => {
    function Host() {
      const [open, setOpen] = React.useState(true);
      const fallback = React.useRef<HTMLButtonElement>(null);
      return (
        <>
          <button ref={fallback}>Tilbake</button>
          {open && (
            <Dialog title="Tittel" onClose={() => setOpen(false)} returnFocusTo={fallback}>
              <button onClick={() => setOpen(false)}>Avbryt</button>
            </Dialog>
          )}
        </>
      );
    }

    render(<Host />);
    await userEvent.click(screen.getByRole('button', { name: 'Avbryt' }));

    expect(screen.getByRole('button', { name: 'Tilbake' })).toHaveFocus();
  });

  it('forwards arbitrary attributes and merges a caller className', () => {
    render(
      <Dialog title="Tittel" onClose={vi.fn()} data-testid="skjema" className="max-w-content">
        <p>x</p>
      </Dialog>,
    );

    const dialog = screen.getByTestId('skjema');
    expect(dialog.className).toContain('max-w-content');
    expect(dialog.className).toContain('sbsk-dialog');
  });

  it('forwards a ref to the dialog element', () => {
    const ref = React.createRef<HTMLDialogElement>();
    render(
      <Dialog ref={ref} title="Tittel" onClose={vi.fn()}>
        <p>x</p>
      </Dialog>,
    );

    expect(ref.current).toBe(screen.getByRole('dialog'));
  });
});
