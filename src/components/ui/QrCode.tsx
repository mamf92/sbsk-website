import * as React from 'react';

type QrCodeProps = Omit<React.SVGAttributes<SVGSVGElement>, 'children'> & {
  /** What the code holds. */
  value: string;
  /** Read out instead of the pattern, which means nothing to a screen reader. */
  label: string;
};

type Matrix = boolean[][];

/** The module grid for `value`, from `qrcode-generator`, loaded on first use (~20 kB). */
async function encode(value: string): Promise<Matrix> {
  const { default: qrcode } = await import('qrcode-generator');
  // Type 0 picks the smallest version that fits; M recovers from ~15% damage, enough for a
  // scratched phone screen without making the code denser than it needs to be.
  const qr = qrcode(0, 'M');
  qr.addData(value);
  qr.make();
  const size = qr.getModuleCount();
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => qr.isDark(row, col)),
  );
}

/** One path for all dark modules: a scanner wants crisp squares, and React wants one node. */
function pathFor(matrix: Matrix): string {
  let d = '';
  matrix.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (dark) d += `M${x} ${y}h1v1h-1z`;
    }),
  );
  return d;
}

const QUIET = 4; // the quiet zone the QR spec asks for, in modules

/**
 * A QR code drawn as SVG, black on white in both themes, since scanners need the contrast.
 * The encoder is a lazy chunk, so pages without a code never download it.
 */
export function QrCode({ value, label, className = '', ...props }: QrCodeProps) {
  const [matrix, setMatrix] = React.useState<Matrix | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let current = true;
    setMatrix(null);
    setFailed(false);
    encode(value)
      .then((next) => current && setMatrix(next))
      // The encoder chunk did not load (weak signal, or a deploy replaced it): say so, rather
      // than leaving an empty white square that looks like a broken card.
      .catch(() => current && setFailed(true));
    return () => {
      current = false;
    };
  }, [value]);

  const size = (matrix?.length ?? 21) + QUIET * 2;
  if (failed) {
    return (
      <p role="status" className={`font-body text-sm ${className}`}>
        QR-koden kunne ikke vises. Last siden på nytt, eller vis koden under.
      </p>
    );
  }
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`${-QUIET} ${-QUIET} ${size} ${size}`}
      shapeRendering="crispEdges"
      className={`bg-white text-black ${className}`}
      {...props}
    >
      {matrix && <path d={pathFor(matrix)} fill="currentColor" />}
    </svg>
  );
}
