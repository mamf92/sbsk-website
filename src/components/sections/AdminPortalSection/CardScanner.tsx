import { useEffect, useId, useRef, useState } from 'react';
import { Alert } from '../../ui/Alert';
import { Button } from '../../ui/Buttons';
import { Dialog } from '../../ui/Dialog';
import { Input } from '../../ui/Input';
import { parseCardCode } from '../../../utils/membershipCard';

// The Shape Detection API is not in TypeScript's DOM library yet.
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
}
type BarcodeDetectorConstructor = new (options: { formats: string[] }) => BarcodeDetectorLike;

function barcodeDetector(): BarcodeDetectorConstructor | null {
  const ctor = (globalThis as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
  return ctor && typeof navigator.mediaDevices?.getUserMedia === 'function' ? ctor : null;
}

type CardScannerProps = {
  /** Called with the card token; the scanner closes itself first. */
  onCode: (token: string) => void;
};

const SCAN_INTERVAL_MS = 250;

/**
 * "Skann medlemskort" at the door. The camera path uses `BarcodeDetector` (Chrome on Android,
 * Safari 17+); everywhere else, and for a hand-held scanner that types the code, there is a
 * field to type or paste it. Nothing leaves the phone but the lookup itself.
 */
export default function CardScanner({ onCode }: CardScannerProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="secondary" size="md" onClick={() => setOpen(true)}>
        Skann medlemskort
      </Button>
      {open && (
        <ScannerDialog
          onClose={() => setOpen(false)}
          onCode={(token) => {
            setOpen(false);
            onCode(token);
          }}
        />
      )}
    </>
  );
}

function ScannerDialog({
  onClose,
  onCode,
}: {
  onClose: () => void;
  onCode: (token: string) => void;
}) {
  const codeId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [typedError, setTypedError] = useState<string | null>(null);
  const [wrongCode, setWrongCode] = useState(false);
  const Detector = barcodeDetector();
  // Latest callback without restarting the camera when the parent re-renders.
  const onCodeRef = useRef(onCode);
  useEffect(() => {
    onCodeRef.current = onCode;
  }, [onCode]);

  useEffect(() => {
    if (!Detector) return;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    const detector = new Detector({ formats: ['qr_code'] });

    const scan = async () => {
      if (stopped) return;
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        try {
          for (const code of await detector.detect(video)) {
            const token = parseCardCode(code.rawValue);
            if (token) {
              stopped = true;
              onCodeRef.current(token);
              return;
            }
            setWrongCode(true);
          }
        } catch {
          // A frame the detector could not read; the next one usually works.
        }
      }
      timer = setTimeout(() => void scan(), SCAN_INTERVAL_MS);
    };

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((media) => {
        if (stopped) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = media;
        const video = videoRef.current;
        if (video) {
          video.srcObject = media;
          void video.play().catch(() => undefined);
        }
        void scan();
      })
      .catch(() =>
        setCameraError('Fikk ikke tilgang til kameraet. Gi nettleseren lov, eller skriv koden.'),
      );

    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [Detector]);

  const submitTyped = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = parseCardCode(String(new FormData(e.currentTarget).get('code') ?? ''));
    if (!token) {
      setTypedError('Det ser ikke ut som en kode fra et medlemskort.');
      return;
    }
    onCode(token);
  };

  return (
    <Dialog title="Skann medlemskort" onClose={onClose}>
      <div className="flex flex-col gap-4 text-white">
        {Detector && !cameraError && (
          <>
            {/* Muted and inline, or iOS refuses to play a camera stream without a tap. */}
            <video
              ref={videoRef}
              muted
              playsInline
              aria-label="Kamera"
              className="aspect-square w-full bg-black object-cover"
            />
            <p className="text-sm">Hold QR-koden på medlemskortet foran kameraet.</p>
            {wrongCode && <Alert tone="warning">Den koden er ikke fra et medlemskort.</Alert>}
          </>
        )}
        {!Detector && (
          <p className="text-sm">
            Denne nettleseren kan ikke lese QR-koder med kameraet. Skriv koden under QR-koden, eller
            bruk en skanner.
          </p>
        )}
        {cameraError && <Alert tone="warning">{cameraError}</Alert>}
        <form className="flex flex-col gap-2" onSubmit={submitTyped} noValidate>
          <label htmlFor={codeId}>Kode fra medlemskortet</label>
          <Input
            id={codeId}
            name="code"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus={!Detector}
            invalid={Boolean(typedError)}
            onChange={() => setTypedError(null)}
          />
          {typedError && <Alert>{typedError}</Alert>}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="tertiary"
              size="md"
              className="border border-white/50"
              onClick={onClose}
            >
              Avbryt
            </Button>
            <Button type="submit" variant="primary" size="md">
              Finn medlem
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
