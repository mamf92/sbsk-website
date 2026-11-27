import Check from '../../assets/icons/symbols/check.svg?react';

/**
 * A short numbered process shown as one hairline strip: done steps carry a green check, the
 * current one an orange number, the rest stay grey. Built for light fills (the cream form
 * card); the ink is darkestblue in both themes.
 *
 * `active` is 1-based. The current step is marked with `aria-current="step"`, and a done
 * step's check has a text alternative, so the state is never colour alone.
 */
export function StepStrip({ steps, active }: { steps: string[]; active: number }) {
  return (
    <ol className="text-darkestblue flex border-y border-black">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < active;
        const current = n === active;
        return (
          <li
            key={label}
            aria-current={current ? 'step' : undefined}
            className={`flex flex-1 items-center justify-center gap-2 p-2 text-center ${
              i
                ? 'relative before:absolute before:top-2.5 before:bottom-2.5 before:left-0 before:w-px before:bg-gray-300'
                : ''
            }`}
          >
            <span
              className={`font-heading flex size-6 flex-none items-center justify-center border text-xs font-bold ${
                done
                  ? 'bg-success border-success text-white'
                  : current
                    ? 'bg-orange border-darkestblue text-darkestblue'
                    : 'border-gray-300 text-gray-500'
              }`}
            >
              {done ? (
                <>
                  <Check aria-hidden="true" className="h-3.5 w-3.5 fill-current" />
                  <span className="sr-only">Ferdig:</span>
                </>
              ) : (
                n
              )}
            </span>
            <span
              className={`font-heading text-xs font-bold ${done || current ? '' : 'text-gray-500'}`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

StepStrip.displayName = 'StepStrip';
