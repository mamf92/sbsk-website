import * as React from 'react';

export type TabOption<T extends string> = {
  value: T;
  label: string;
};

type TabsProps<T extends string> = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange' | 'children'
> & {
  options: readonly TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Names the group for assistive tech; the tabs themselves have no visible group label. */
  label: string;
  ref?: React.Ref<HTMLDivElement>;
};

const tab =
  '-mb-px inline-flex min-h-11 cursor-pointer items-center border-b-2 px-4 ' +
  'font-body text-base whitespace-nowrap ' +
  'transition-colors duration-150 motion-reduce:transition-none ' +
  'focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-focus';

const states = {
  on: 'border-primary font-semibold text-heading',
  off: 'border-transparent text-fg-muted hover:border-border-strong hover:text-fg',
} as const;

/**
 * Underline tabs for switching between views of one list, like Kommende / Tidligere / Alle
 * (decision 10). A thin rule runs under the whole row and the current tab sits on it with an
 * orange bar.
 *
 * They switch a filter on the list below rather than swapping panels, so they are a group of
 * `aria-pressed` buttons, each reached with Tab, rather than an ARIA `tablist`.
 */
export function Tabs<T extends string>({
  options,
  value,
  onChange,
  label,
  className = '',
  ref,
  ...props
}: TabsProps<T>) {
  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      className={['border-border flex w-full overflow-x-auto border-b', className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={[tab, value === option.value ? states.on : states.off].join(' ')}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
