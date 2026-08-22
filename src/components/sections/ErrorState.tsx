import * as React from 'react';
import { Button } from '../ui/Buttons';
import { DiceLogo } from '../ui/DiceLogo';
import type { DiceLogoHandle } from '../ui/DiceLogo';

/**
 * No `variant`. It used to declare `'dark' | 'rules' | 'photo'` while the component
 * early-returned `null` for anything but `'dark'`, so two thirds of its own API rendered a blank
 * page — and with one treatment left the prop chooses nothing. #63 is where alternative error
 * treatments would actually get designed, and can reintroduce it once there is a second one.
 */
type ErrorStateProps = React.HTMLAttributes<HTMLElement> & {
  code?: string;
  eyebrow?: string;
  title?: string;
  body?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  showRoll?: boolean;
  rollLabel?: string;
  diceSize?: number;
};

// The two numerals flanking the die. `--text-errorcode` is the one-off display size they sit at,
// in the `--text-daymark` mould: decorative digits, not a heading, so they take a named size of
// their own rather than a step off the h1–h4 scale.
const numeralClasses = 'font-heading text-errorcode text-darkblue font-bold';

export default function ErrorState({
  code = '404',
  eyebrow = 'Feil 404',
  title = 'Denne siden mangler i esken',
  body = 'Vi finner ikke siden du leter etter. Den kan ha flyttet, blitt slettet, eller lenken kan være skrevet feil. Prøv en av veiene under.',
  primaryLabel = 'Til forsiden',
  secondaryLabel = 'Se kalenderen',
  onPrimary,
  onSecondary,
  showRoll = true,
  rollLabel = 'Trill igjen',
  diceSize = 140,
  className = '',
  ...props
}: ErrorStateProps) {
  const diceRef = React.useRef<DiceLogoHandle>(null);

  return (
    <section
      className={[
        // The fill is the same in both themes today, which is a decision rather than an
        // oversight — a 404 is the one page that should not change character underfoot. It is
        // stated in utilities now, so a future `dark:` pass can reach it; while this file was
        // inline styles it could not have.
        'bg-darkestblue surface-dark flex flex-1 items-center justify-center overflow-hidden text-white',
        // The discrete ladder the section's two `clamp()`s became. Steps chosen where the
        // clamp actually sat at each breakpoint rather than at round numbers, so the page keeps
        // its proportions on the way up: within a few pixels of the old fluid padding at every
        // width, and identical at the ends.
        'px-5 py-10 md:px-10 md:py-14 lg:px-12 lg:py-18 xl:py-24',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {/* Two columns while both fit at their 320px floor, one when they do not — the copy and
          the numerals stack on a phone without a breakpoint having to know their widths. */}
      <div className="max-w-shell grid w-full grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-center gap-8 md:gap-12 xl:gap-18">
        {/* Text column */}
        <div className="flex flex-col items-start gap-6">
          <span className="font-heading border-darkorange text-orange border px-3 py-1.5 text-xs font-bold tracking-[0.18em] uppercase">
            {eyebrow}
          </span>

          <h1 className="font-heading text-display font-bold tracking-[-0.01em] text-balance text-white">
            {title}
          </h1>

          <p className="font-body max-w-[44ch] text-lg leading-relaxed text-pretty text-white/80">
            {body}
          </p>

          <div className="mt-1.5 flex flex-wrap gap-3">
            <Button variant="primary" size="lg" icon="right" onClick={onPrimary}>
              {primaryLabel}
            </Button>
            <Button variant="tertiary" size="lg" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
            {showRoll && (
              <Button variant="tertiary" size="lg" onClick={() => diceRef.current?.roll()}>
                {rollLabel}
              </Button>
            )}
          </div>
        </div>

        {/* Dice numeral column */}
        <div className="flex items-center justify-center gap-2 select-none md:gap-4 lg:gap-4.5">
          <span className={numeralClasses} aria-hidden="true">
            {code.slice(0, 1)}
          </span>

          <span className="sbsk-err-die">
            <DiceLogo ref={diceRef} size={diceSize} />
          </span>

          <span className={numeralClasses} aria-hidden="true">
            {code.slice(2)}
          </span>
        </div>
      </div>
    </section>
  );
}
