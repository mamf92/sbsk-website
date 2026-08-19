import * as React from 'react';
import { Button } from '../ui/Buttons';
import { DiceLogo } from '../ui/DiceLogo';
import type { DiceLogoHandle } from '../ui/DiceLogo';

type ErrorStateVariant = 'dark' | 'rules' | 'photo';

type ErrorStateProps = React.HTMLAttributes<HTMLElement> & {
  variant?: ErrorStateVariant;
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

export default function ErrorState({
  variant = 'dark',
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

  if (variant !== 'dark') return null;

  return (
    <section
      className={[
        'bg-darkestblue surface-dark flex flex-1 items-center justify-center overflow-hidden text-white',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        padding: 'clamp(40px, 7vw, 96px) clamp(20px, 5vw, 48px)',
        boxSizing: 'border-box',
      }}
      {...props}
    >
      <div
        className="w-full items-center"
        style={{
          maxWidth: 1100,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'clamp(32px, 6vw, 72px)',
        }}
      >
        {/* Text column */}
        <div className="flex flex-col items-start" style={{ gap: 22 }}>
          <span
            className="font-heading border-darkorange text-orange font-bold uppercase"
            style={{
              fontSize: 12,
              lineHeight: '16px',
              letterSpacing: '.18em',
              borderWidth: 1,
              borderStyle: 'solid',
              padding: '7px 12px',
            }}
          >
            {eyebrow}
          </span>

          <h1
            className="font-heading m-0 font-bold text-white"
            style={{
              fontSize: 'clamp(34px, 5vw, 56px)',
              lineHeight: 1.1,
              letterSpacing: '-.01em',
              textWrap: 'balance',
            }}
          >
            {title}
          </h1>

          <p
            className="font-body m-0"
            style={{
              fontSize: 18,
              lineHeight: 1.65,
              color: 'rgba(255, 255, 255, .78)',
              maxWidth: '44ch',
              textWrap: 'pretty',
            }}
          >
            {body}
          </p>

          <div className="flex flex-wrap gap-3" style={{ marginTop: 6 }}>
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
        <div
          className="flex items-center justify-center select-none"
          style={{ gap: 'clamp(6px, 2vw, 18px)' }}
        >
          <span
            className="font-heading text-darkblue font-bold"
            style={{
              fontSize: 'clamp(96px, 15vw, 180px)',
              lineHeight: 0.8,
            }}
            aria-hidden="true"
          >
            {code.slice(0, 1)}
          </span>

          <span className="sbsk-err-die">
            <DiceLogo ref={diceRef} size={diceSize} />
          </span>

          <span
            className="font-heading text-darkblue font-bold"
            style={{
              fontSize: 'clamp(96px, 15vw, 180px)',
              lineHeight: 0.8,
            }}
            aria-hidden="true"
          >
            {code.slice(2)}
          </span>
        </div>
      </div>
    </section>
  );
}
