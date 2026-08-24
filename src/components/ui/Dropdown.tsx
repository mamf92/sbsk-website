import * as React from 'react';
import Expand from '../../assets/icons/arrows/expand.svg?react';

export type DropdownOption<T extends string> = {
  value: T;
  label: string;
};

type DropdownProps<T extends string> = Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> & {
  options: readonly DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /**
   * Names the control for assistive tech — there is no visible `<label>`, the trigger button's
   * own text is the current value rather than a name for the field. Doubles as the listbox's
   * name, matching `Segmented`'s `label`.
   */
  label: string;
  /**
   * React 19 passes `ref` as an ordinary prop, which is what lets this stay a generic
   * function the way `Segmented` does.
   */
  ref?: React.Ref<HTMLDivElement>;
};

// Sized and coloured to sit flush with the `Chip` row this always appears beside —
// `px-4 py-2 text-xs font-bold`, one border, no fixed height — rather than `Select`'s taller
// `fieldPadding`. `Select`'s own doc comment defended keeping the native picker; this reverses
// that call (#203): every option is drawn by this component now, in both themes, so nothing
// here depends on the browser's own listbox chrome.
const trigger =
  'inline-flex cursor-pointer items-center justify-between gap-2 whitespace-nowrap ' +
  'rounded-none border border-gray-neutral bg-white px-4 py-2 font-body text-xs font-bold ' +
  'text-gray-500 hover:border-darkestblue focus-visible:outline focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 focus-visible:outline-focus-ring ' +
  'dark:bg-transparent dark:text-white dark:hover:border-orange';

const panel =
  'absolute right-0 z-10 mt-1 flex max-h-60 min-w-full flex-col overflow-auto rounded-none ' +
  'border border-darkestblue bg-white py-1 shadow-2 dark:border-white dark:bg-darkestblue';

const option =
  'cursor-pointer px-4 py-2 text-left font-body text-xs font-bold whitespace-nowrap ' +
  'text-darkestblue dark:text-white';

const optionActive = 'bg-gray-100 dark:bg-white/10';
const optionSelected = 'text-orange dark:text-orange';

const NAV_KEYS = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' ', 'Escape', 'Tab'];

/**
 * A fully custom single-choice listbox, styled and sized to sit beside `Chip` — the sort
 * control on both list pages (#203). See `docs/DESIGN_LANGUAGE.md`'s "Which single-choice
 * control" for why sorting is this and not `Chip` or `Segmented`.
 *
 * Focus never leaves the trigger button — the WAI-ARIA "collapsible listbox" shape, not a
 * focus-trapped popup. `aria-activedescendant` on the button points at the active `role="option"`
 * `<li>`, so a screen reader announces the highlighted option without moving DOM focus into the
 * panel; arrow keys, Home/End, Enter/Space and Escape are all handled on the button itself.
 */
export function Dropdown<T extends string>({
  options,
  value,
  onChange,
  label,
  className = '',
  ref,
  ...props
}: DropdownProps<T>) {
  const [open, setOpen] = React.useState(false);
  const selectedIndex = Math.max(
    0,
    options.findIndex((candidate) => candidate.value === value),
  );
  const [activeIndex, setActiveIndex] = React.useState(selectedIndex);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const listboxId = React.useId();

  const setRefs = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as React.RefObject<HTMLDivElement | null>).current = node;
  };

  const selected = options[selectedIndex];

  function close(focusTrigger = true) {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  }

  function openMenu() {
    setActiveIndex(selectedIndex);
    setOpen(true);
  }

  function commit(index: number) {
    const chosen = options[index];
    if (chosen) onChange(chosen.value);
    close();
  }

  React.useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) close(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
        event.preventDefault();
        openMenu();
      }
      return;
    }

    if (!NAV_KEYS.includes(event.key)) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % options.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((index) => (index - 1 + options.length) % options.length);
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        commit(activeIndex);
        break;
      case 'Escape':
        event.preventDefault();
        close();
        break;
      case 'Tab':
        // No `preventDefault` — the browser's own Tab motion is what should happen next, this
        // only drops the panel out of its way instead of leaving it open over whatever is now
        // focused.
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={setRefs} className={['relative inline-block', className].join(' ')} {...props}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={label}
        aria-activedescendant={open ? `${listboxId}-option-${activeIndex}` : undefined}
        className={trigger}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={handleKeyDown}
      >
        <span>{selected?.label ?? ''}</span>
        <Expand
          aria-hidden="true"
          className={
            'h-3.5 w-3.5 fill-current transition-transform duration-(--duration-base) ease-out ' +
            (open ? 'rotate-180' : 'rotate-0')
          }
        />
      </button>
      {open && (
        <ul id={listboxId} role="listbox" aria-label={label} className={panel}>
          {options.map((candidate, index) => (
            <li
              key={candidate.value}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={candidate.value === value}
              className={[
                option,
                index === activeIndex ? optionActive : '',
                candidate.value === value ? optionSelected : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => commit(index)}
            >
              {candidate.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

Dropdown.displayName = 'Dropdown';
