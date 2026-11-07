import * as React from 'react';
import Expand from '../../assets/icons/arrows/expand.svg?react';
import { fieldBase, fieldDisabled, fieldLine, fieldPaddingWithIcon } from './fieldClasses';

export type SelectOption<T extends string> = {
  value: T;
  label: string;
};

type SelectProps<T extends string> = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'onChange' | 'value' | 'children'
> & {
  options: readonly SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** The visible label, e.g. "Sorter etter". */
  label: string;
  /** Keep the label for assistive tech only, for tight filter rows. */
  labelHidden?: boolean;
  ref?: React.Ref<HTMLSelectElement>;
};

/**
 * The native `<select>` in the field look (decision 10). The browser draws the option list,
 * so it works the way the visitor's device always does, including the phone's own picker.
 * Only the closed box is styled, with our own chevron in place of the native arrow.
 */
export function Select<T extends string>({
  options,
  value,
  onChange,
  label,
  labelHidden = false,
  id,
  className = '',
  ref,
  ...props
}: SelectProps<T>) {
  const autoId = React.useId();
  const selectId = id ?? autoId;

  return (
    <div className={['flex flex-col gap-1', className].filter(Boolean).join(' ')}>
      <label
        htmlFor={selectId}
        className={labelHidden ? 'sr-only' : 'font-body text-fg text-sm font-semibold'}
      >
        {label}
      </label>
      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          value={value}
          onChange={(event) => onChange(event.target.value as T)}
          className={[
            fieldBase,
            fieldLine.rest,
            fieldDisabled,
            fieldPaddingWithIcon,
            'cursor-pointer appearance-none',
          ].join(' ')}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Expand
          aria-hidden="true"
          className="text-fg-muted pointer-events-none absolute right-3 size-4 fill-current"
        />
      </div>
    </div>
  );
}
