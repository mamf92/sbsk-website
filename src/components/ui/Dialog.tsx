import * as React from 'react';

type DialogProps = Omit<
  React.DialogHTMLAttributes<HTMLDialogElement>,
  'title' | 'onClose' | 'open'
> & {
  /** Rendered as the dialog's `<h2>` and wired to it through `aria-labelledby`. */
  title: React.ReactNode;
  /** Optional content pinned to the right of the heading — an avatar, a badge. */
  headerEnd?: React.ReactNode;
  /**
   * `'form'` (default) is the narrow, centred, padded panel every existing caller wants.
   * `'full'` is near-viewport-filling with no internal scroll — for content that has to lay
   * itself out, like the carousel lightbox, rather than stack in a scrolling column.
   */
  size?: 'form' | 'full';
  /**
   * A dialog is modal whenever it is rendered. Callers that mount it conditionally
   * (`{showForm && <Dialog …>}`) can leave this alone; callers that keep it mounted
   * drive it with the prop.
   */
  open?: boolean;
  /**
   * Called when the browser closes the dialog on its own — Escape, or a form with
   * `method="dialog"`. Not called when the caller closes it by flipping `open` or by
   * unmounting, since it already knows.
   */
  onClose: () => void;
  /**
   * Where focus goes on close. Defaults to whatever was focused when the dialog opened,
   * which is the button that opened it.
   */
  returnFocusTo?: React.RefObject<HTMLElement | null>;
};

/**
 * `<dialog>` does not stop the page behind it scrolling. Counted rather than a boolean so
 * a dialog opened from a dialog does not unlock the page when the inner one closes.
 */
let openDialogCount = 0;
let restoreOverflow = '';

function lockPageScroll() {
  if (openDialogCount === 0) {
    restoreOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  openDialogCount += 1;
}

function unlockPageScroll() {
  openDialogCount = Math.max(0, openDialogCount - 1);
  if (openDialogCount === 0) document.body.style.overflow = restoreOverflow;
}

// `sbsk-dialog` is the hook for the `::backdrop` rule in src/index.css — the scrim and its
// blur cannot be expressed as utilities on this element, because they paint on a pseudo.
// `shadow-overlay` is the system's one soft shadow and is reserved for exactly this.
const panelBase =
  'sbsk-dialog bg-darkblue surface-dark shadow-overlay ' +
  'm-auto flex w-[calc(100vw-1rem)] flex-col gap-3 rounded-none border-0 text-white';

// A lookup map, not two competing `max-w-*`/`px-*` strings concatenated — Tailwind resolves
// conflicting utilities by emit order, not by which one is listed last in a template literal,
// so the two sizes have to be mutually exclusive branches rather than layered classes.
const panelSizes = {
  // Every dialog before the carousel lightbox: a narrow column, padded, centred, and scrolling
  // internally once its content outgrows the viewport.
  form: 'max-w-form max-h-[calc(100dvh-2rem)] justify-center overflow-y-auto px-6 py-10',
  // The lightbox: near-viewport-filling with a small gutter, no internal scroll — the image
  // lays itself out inside a fixed-height panel instead of stacking in a scrolling column.
  full: 'max-w-none h-[calc(100dvh-2rem)] overflow-hidden p-3 md:p-4',
} as const;

/**
 * The modal wrapper, on the native `<dialog>` element. `showModal()` is what buys the focus
 * trap, Escape, the top layer and inertness of the page behind — none of which the two
 * hand-rolled `<div>` overlays this replaces had. What it does *not* buy, and what this
 * component adds: scroll locking, and focus restoration that survives the opener being
 * unmounted by a revalidation.
 */
export const Dialog = React.forwardRef<HTMLDialogElement, DialogProps>(function Dialog(
  {
    title,
    headerEnd,
    size = 'form',
    open = true,
    onClose,
    returnFocusTo,
    className = '',
    children,
    ...props
  },
  forwardedRef,
) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  React.useImperativeHandle(forwardedRef, () => dialogRef.current as HTMLDialogElement, []);

  const titleId = React.useId();

  // The native `close` event is queued as a task, so a flag set around our own `.close()`
  // call would have been cleared by the time it fires. Reading the latest `open` instead
  // tells us whether the close came from the browser or from us.
  const openRef = React.useRef(open);
  openRef.current = open;

  React.useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;

    if (!open) {
      if (node.open) node.close();
      return;
    }

    // Captured before `showModal()` moves focus into the dialog. `<dialog>` restores focus
    // to its invoker only while that element is still in the document, and both portals
    // revalidate on submit and unmount the button that opened the dialog — so the opener is
    // held here and restored by hand in the cleanup.
    const opener = (returnFocusTo?.current ?? document.activeElement) as HTMLElement | null;

    if (!node.open) node.showModal();
    lockPageScroll();

    return () => {
      unlockPageScroll();
      if (node.open) node.close();
      // Deliberately re-read at close time rather than captured above: the whole reason a
      // caller passes `returnFocusTo` is that the opener does not survive the dialog, so the
      // node to focus is whichever one the ref points at *now*.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const target = returnFocusTo?.current ?? opener;
      if (target && target !== document.body && target.isConnected) target.focus();
    };
  }, [open, returnFocusTo]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={() => {
        if (openRef.current) onClose();
      }}
      className={[panelBase, panelSizes[size], className].filter(Boolean).join(' ')}
      {...props}
    >
      <div className="flex items-center justify-between gap-4">
        {/* h2, not h1: every route already has an h1, and a dialog opening on top of it
            must not mint a second one. */}
        <h2 id={titleId} className="font-heading text-h2 font-bold text-white">
          {title}
        </h2>
        {headerEnd}
      </div>
      {children}
    </dialog>
  );
});
