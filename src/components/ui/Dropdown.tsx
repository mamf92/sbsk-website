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

// `right-0` by default: the trigger sits at the right-hand end of the filter row on both list
// pages, so a panel wider than the trigger has to grow leftward to stay on screen. `alignment`
// below flips this to `left-0` when the row has wrapped and the trigger is near the left edge,
// where growing leftward is what puts the labels off screen instead (#223). The viewport clamp
// is the backstop for a label longer than the screen is wide, in either alignment.
const panelBase =
  'absolute z-10 mt-1 flex max-h-60 min-w-full max-w-[calc(100vw-1rem)] flex-col overflow-auto ' +
  'rounded-none border border-darkestblue bg-white py-1 shadow-2 dark:border-white ' +
  'dark:bg-darkestblue';

const panelAlignment = { end: 'right-0', start: 'left-0' } as const;

/** Keep this much of the viewport clear of the panel on the side it would otherwise overflow. */
const VIEWPORT_GUTTER = 8;

const option =
  'cursor-pointer px-4 py-2 text-left font-body text-xs font-bold whitespace-nowrap ' +
  'text-darkestblue dark:text-white';

const optionActive = 'bg-gray-100 dark:bg-white/10';
// `darkestorange`, not `orange` — `orange` on the panel's white fill measures 2.18:1, well
// under the 4.5:1 AA text needs (this is a bold `text-xs` label, not large text); `darkestorange`
// clears it at 4.51:1, the same tone `docs/DESIGN_LANGUAGE.md`'s "Field state" table reaches for
// whenever body-sized orange-family text has to sit directly on white.
const optionSelected = 'text-darkestorange dark:text-orange';

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
  const [alignment, setAlignment] = React.useState<keyof typeof panelAlignment>('end');
  const selectedIndex = Math.max(
    0,
    options.findIndex((candidate) => candidate.value === value),
  );
  const [activeIndex, setActiveIndex] = React.useState(selectedIndex);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLUListElement>(null);
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
    // Every open starts from the default alignment, so a panel that only needed to flip at one
    // scroll position or viewport width does not stay flipped for the rest of the session.
    setAlignment('end');
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

  // `useLayoutEffect`, so the corrected alignment is in place before the browser paints and the
  // panel never appears in the wrong spot for a frame. Measuring is the only way to know: which
  // side overflows depends on where the wrapped filter row left the trigger and on how wide the
  // longest option renders, neither of which CSS can branch on.
  //
  // One-way, and it runs once per open — `openMenu` has already reset to `end`. Correcting in
  // both directions instead would oscillate: a panel wide enough to overflow the left edge when
  // right-aligned can also overflow the right edge when left-aligned, and each correction
  // re-triggers the measurement that undoes it. Right overflow needs no correction from the
  // default anyway, since a right-aligned panel ends where the trigger does; past that, the
  // `max-w` clamp is what keeps a very long label on screen.
  React.useLayoutEffect(() => {
    if (!open) return;

    const rect = panelRef.current?.getBoundingClientRect();
    // jsdom reports every rect as zero — there is no layout to correct there, and a zero-width
    // panel would otherwise look like it overflows the left edge and flip on every open.
    if (!rect || rect.width === 0) return;

    if (rect.left < VIEWPORT_GUTTER) setAlignment('start');
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
      {/* The trigger is named by this plus its own visible value, rather than by an
          `aria-label`, so that the name *contains* the visible text instead of replacing it. An
          `aria-label="Sorter innlegg"` on a trigger reading "Nyeste først" leaves someone driving
          the page by voice with nothing to say — WCAG 2.5.3 Label in Name, and the audit
          Lighthouse fails the page on (label-content-name-mismatch, #222).

          Two `aria-labelledby` references rather than a hidden span inside the button: the
          algorithm joins referenced elements with a space, where it concatenates adjacent inline
          children with nothing between them and trims the whitespace out of any separator you
          try to add. So this announces as "Sorter innlegg Nyeste først" — the field's name and
          its current value, which is what the trigger of a collapsed listbox should say anyway. */}
      <span id={`${listboxId}-label`} className="sr-only">
        {label}
      </span>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-labelledby={`${listboxId}-label ${listboxId}-value`}
        aria-activedescendant={open ? `${listboxId}-option-${activeIndex}` : undefined}
        className={trigger}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={handleKeyDown}
      >
        <span id={`${listboxId}-value`}>{selected?.label ?? ''}</span>
        <Expand
          aria-hidden="true"
          className={
            'h-3.5 w-3.5 fill-current transition-transform duration-(--duration-base) ease-out ' +
            (open ? 'rotate-180' : 'rotate-0')
          }
        />
      </button>
      {open && (
        <ul
          ref={panelRef}
          id={listboxId}
          role="listbox"
          aria-label={label}
          className={[panelBase, panelAlignment[alignment]].join(' ')}
        >
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
