import * as React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Buttons';
import UserIcon from '../../assets/icons/symbols/user.svg?react';
import ShieldIcon from '../../assets/icons/symbols/shield.svg?react';
import LogoutIcon from '../../assets/icons/symbols/logout.svg?react';

type ProfileMenuProps = {
  /** Trigger text, e.g. "Hei, Martin". */
  label: string;
  /** Adds the Styreportal entry above Min side. */
  isAdmin?: boolean;
  onLogout: () => void;
  className?: string;
};

// Every entry is one 44px row (`h-control-md`, the same height as the trigger), so the menu
// reads as a stack of touch-sized targets. The hover fill is a plain tint rather than `lift`:
// rows sit flush inside one panel, and a travelling row would tear the stack apart. `hover:`
// is already gated to real pointers (src/index.css), so touch never gets a stuck highlight;
// `focus-visible` carries the keyboard state on its own.
const item =
  'flex h-control-md w-full cursor-pointer items-center gap-3 px-4 text-left font-heading ' +
  'text-base text-white no-underline transition-colors duration-(--duration-fast) ' +
  'ease-standard hover:bg-white/10 focus-visible:bg-white/10 ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 ' +
  'focus-visible:outline-focus-ring';

const icon = 'h-5 w-5 flex-none fill-none text-orange';

/**
 * The signed-in header menu: the trigger greets the member, the panel holds their way into
 * Min side (and Styreportal for board admins) and Logg ut.
 *
 * The panel is a `role="menu"` with real links, so a middle click or "open in new tab" works
 * and navigation needs no `navigate()` call. Focus moves into the panel on keyboard open and
 * arrow keys, Home and End walk the rows; Escape returns to the trigger, Tab out of the menu and an
 * outside press just close it. It sits on the header, which is dark in both themes, so it needs no
 * `dark:` variants of its own.
 */
export function ProfileMenu({
  label,
  isAdmin = false,
  onLogout,
  className = '',
}: ProfileMenuProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const menuId = React.useId();

  const items = () =>
    Array.from(panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

  function close(focusTrigger = false) {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  }

  React.useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  function focusItem(index: number) {
    const rows = items();
    if (rows.length === 0) return;
    rows[(index + rows.length) % rows.length].focus();
  }

  // A keyboard open lands on the first row; a pointer open leaves focus where it is.
  function handleTriggerKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => focusItem(event.key === 'ArrowDown' ? 0 : -1));
    }
  }

  function handlePanelKeyDown(event: React.KeyboardEvent) {
    const current = items().indexOf(document.activeElement as HTMLElement);
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusItem(current + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusItem(current - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusItem(0);
        break;
      case 'End':
        event.preventDefault();
        focusItem(-1);
        break;
      case 'Escape':
        event.preventDefault();
        close(true);
        break;
    }
  }

  function handleEscapeOnTrigger(event: React.KeyboardEvent) {
    if (event.key === 'Escape' && open) close(true);
    else handleTriggerKeyDown(event);
  }

  return (
    <div
      ref={containerRef}
      className={['relative z-50', className].join(' ')}
      onBlur={(event) => {
        // Tab moves focus first and closes after, so the focused row is never unmounted
        // underneath the browser's own Tab motion. A null `relatedTarget` (a click on
        // non-focusable panel space) is left to the outside-press handler.
        const next = event.relatedTarget as Node | null;
        if (open && next && !containerRef.current?.contains(next)) setOpen(false);
      }}
    >
      <Button
        ref={triggerRef}
        variant="primary"
        size="md"
        icon="expand"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen(!open)}
        onKeyDown={handleEscapeOnTrigger}
      >
        {label}
      </Button>
      {open && (
        <div
          ref={panelRef}
          id={menuId}
          role="menu"
          aria-label="Profil"
          onKeyDown={handlePanelKeyDown}
          className="bg-darkestblue shadow-2 absolute top-full right-0 z-50 mt-2 w-56 border border-white/12 py-1"
        >
          {isAdmin && (
            <Link to="/styreportal" role="menuitem" className={item} onClick={() => close()}>
              <ShieldIcon aria-hidden="true" className={icon} />
              Styreportal
            </Link>
          )}
          <Link to="/medlemsportal" role="menuitem" className={item} onClick={() => close()}>
            <UserIcon aria-hidden="true" className={icon} />
            Min side
          </Link>
          <div role="separator" className="my-1 border-t border-white/12" />
          <button
            type="button"
            role="menuitem"
            className={item}
            onClick={() => {
              close();
              onLogout();
            }}
          >
            <LogoutIcon aria-hidden="true" className={icon} />
            Logg ut
          </button>
        </div>
      )}
    </div>
  );
}

ProfileMenu.displayName = 'ProfileMenu';
