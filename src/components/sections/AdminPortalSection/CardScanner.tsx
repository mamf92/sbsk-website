import { useEffect, useId, useRef, useState } from 'react';
import { Alert } from '../../ui/Alert';
import { Button } from '../../ui/Buttons';
import { Dialog } from '../../ui/Dialog';
import { Input } from '../../ui/Input';
import { parseCardCode } from '../../../utils/membershipCard';

// The Shape Detection API is not in TypeScript's DOM library yet.
interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>;
}
type BarcodeDetectorConstructor = new (options: { formats: string[] }) => BarcodeDetectorLike;

/** Reads every QR code in the current video frame. */
type FrameReader = (video: HTMLVideoElement) => Promise<string[]>;

const hasCamera = () =>
  typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function';

/**
 * The browser's own detector where there is one (Chrome on Android, Edge); otherwise jsQR on a
 * canvas copy of the frame (Safari and Firefox), loaded only when the scanner opens.
 */
async function frameReader(): Promise<FrameReader> {
  const Native = (globalThis as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
  if (Native) {
    const detector = new Native({ formats: ['qr_code'] });
    return async (video) => (await detector.detect(video)).map((code) => code.rawValue);
  }
  const { default: jsQR } = await import('jsqr');
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  return async (video) => {
    if (!context || !video.videoWidth) return [];
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    const frame = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(frame.data, frame.width, frame.height, { inversionAttempts: 'dontInvert' });
    return code ? [code.data] : [];
  };
}

type CardScannerProps = {
  /** Called with the card token; the scanner closes itself first. */
  onCode: (token: string) => void;
};

const SCAN_INTERVAL_MS = 250;

/**
 * "Skann medlemskort" at the door, with the phone's camera (any browser that allows camera
 * access), or a field to type the code or take a hand-held scanner's input. Frames are decoded
 * on the phone; only the code itself is sent, to the lookup.
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
  const camera = hasCamera();
  // Latest callback without restarting the camera when the parent re-renders.
  const onCodeRef = useRef(onCode);
  useEffect(() => {
    onCodeRef.current = onCode;
  }, [onCode]);

  useEffect(() => {
    if (!camera) return;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    let read: FrameReader | null = null;

    const scan = async () => {
      if (stopped) return;
      const video = videoRef.current;
      if (read && video && video.readyState >= 2) {
        try {
          const codes = await read(video);
          const token = codes.map(parseCardCode).find((value) => value !== null);
          if (token && !stopped) {
            stopped = true;
            onCodeRef.current(token);
            return;
          }
          // Shown only while a foreign code is in view, so it clears when the card arrives.
          setWrongCode(codes.length > 0);
        } catch {
          // A frame the decoder could not read; the next one usually works.
        }
      }
      timer = setTimeout(() => void scan(), SCAN_INTERVAL_MS);
    };

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(async (media) => {
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
        try {
          read = await frameReader();
        } catch {
          media.getTracks().forEach((track) => track.stop());
          setCameraError('Kunne ikke starte skanningen. Skriv koden i stedet.');
          return;
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
  }, [camera]);

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
        {camera && !cameraError && (
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
        {!camera && (
          <p className="text-sm">
            Denne nettleseren gir ikke tilgang til kameraet. Skriv koden under QR-koden, eller bruk
            en skanner.
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
            autoFocus={!camera}
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
