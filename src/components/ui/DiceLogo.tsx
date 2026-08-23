import * as React from 'react';

export interface DiceLogoHandle {
  roll: () => void;
}

type DiceLogoProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  size?: number;
  initialFace?: 1 | 2 | 3 | 4 | 5 | 6;
  onRoll?: (face: number) => void;
};

const COLS = { l: 58, c: 90, r: 122 } as const;
const ROWS = { t: 52, m: 90, b: 128 } as const;
type Col = keyof typeof COLS;
type Row = keyof typeof ROWS;
const P = (col: Col, row: Row): [number, number] => [COLS[col], ROWS[row]];

const PIPS: Record<number, [number, number][]> = {
  1: [P('c', 'm')],
  2: [P('l', 't'), P('r', 'b')],
  3: [P('l', 't'), P('c', 'm'), P('r', 'b')],
  4: [P('l', 't'), P('r', 't'), P('l', 'b'), P('r', 'b')],
  5: [P('l', 't'), P('r', 't'), P('c', 'm'), P('l', 'b'), P('r', 'b')],
  6: [P('l', 't'), P('r', 't'), P('l', 'm'), P('r', 'm'), P('l', 'b'), P('r', 'b')],
};

const STORAGE_KEY = 'sbsk-dice-face';
const ROLL_DURATION = 900;
const FACE_SWAP_INTERVAL = 70;

function getStoredFace(): number {
  try {
    const s = Number(localStorage.getItem(STORAGE_KEY));
    return s >= 1 && s <= 6 ? s : 6;
  } catch {
    return 6;
  }
}

export const DiceLogo = React.forwardRef<DiceLogoHandle, DiceLogoProps>(
  ({ className = '', size = 40, initialFace, onRoll, onClick, ...props }, ref) => {
    const [face, setFace] = React.useState<number>(() => {
      if (initialFace && initialFace >= 1 && initialFace <= 6) return initialFace;
      return getStoredFace();
    });
    const [rolling, setRolling] = React.useState(false);
    const timers = React.useRef<number[]>([]);
    const reducedMotion = React.useRef(false);

    React.useEffect(() => {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      reducedMotion.current = media.matches;
      const handleChange = (e: MediaQueryListEvent) => {
        reducedMotion.current = e.matches;
      };
      media.addEventListener('change', handleChange);
      return () => media.removeEventListener('change', handleChange);
    }, []);
    const roll = React.useCallback(() => {
      if (rolling || reducedMotion.current) return;
      setRolling(true);
      const iv = window.setInterval(
        () => setFace(1 + Math.floor(Math.random() * 6)),
        FACE_SWAP_INTERVAL,
      );
      const t = window.setTimeout(() => {
        clearInterval(iv);
        const final = 1 + Math.floor(Math.random() * 6);
        setFace(final);
        try {
          if (!initialFace) localStorage.setItem(STORAGE_KEY, String(final));
        } catch {
          /* storage unavailable */
        }
        setRolling(false);
        onRoll?.(final);
      }, ROLL_DURATION);
      timers.current = [iv, t];
    }, [rolling, initialFace, onRoll]);

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        roll();
        onClick?.(e);
      },
      [roll, onClick],
    );

    React.useEffect(
      () => () =>
        timers.current.forEach((t) => {
          clearTimeout(t);
          clearInterval(t);
        }),
      [],
    );

    React.useImperativeHandle(ref, () => ({ roll }), [roll]);

    return (
      <button
        type="button"
        className={['sbsk-dice', rolling ? 'rolling' : '', className].filter(Boolean).join(' ')}
        onClick={handleClick}
        aria-label={`Terning viser ${face}. Klikk for å kaste.`}
        title="Kast terningen!"
        {...props}
      >
        <svg viewBox="0 0 180 180" style={{ height: size, width: size }} aria-hidden="true">
          <rect x="4" y="4" width="172" height="172" rx="30" fill="var(--color-orange)" />
          {PIPS[face].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="16" fill="#fff" />
          ))}
        </svg>
      </button>
    );
  },
);

DiceLogo.displayName = 'DiceLogo';
