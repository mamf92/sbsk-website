import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, FieldError } from '../ui/Alert';
import { Button } from '../ui/Buttons';
import { Input } from '../ui/Input';
import { totpCodeSchema } from '../../schemas/totp';
import { verifyTotp } from '../../supabase/queryHelpers/mfa';

const WRONG_CODE =
  'Koden stemmer ikke. Sjekk at du bruker koden for Stavanger Brettspillklubb og prøv igjen.';

type TwoFactorSectionProps = {
  title: string;
  intro: React.ReactNode;
  factorId: string;
  /** Where to go once the code is accepted. */
  next: string;
  submitLabel: string;
  /** Rendered between the intro and the code field (the QR code, on setup). */
  children?: React.ReactNode;
};

/**
 * The shared shape of `/to-faktor` and `/to-faktor/oppsett`: the same framed `darkblue` panel
 * as `LoginSection`, one six-digit field validated with `totpCodeSchema` on submit, and
 * `verifyTotp` raising the session to aal2 before navigating on.
 */
export default function TwoFactorSection({
  title,
  intro,
  factorId,
  next,
  submitLabel,
  children,
}: TwoFactorSectionProps) {
  const navigate = useNavigate();
  const errorId = useId();
  const [code, setCode] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(null);
    const parsed = totpCodeSchema.safeParse(code);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Koden er seks siffer');
      return;
    }
    setLoading(true);
    try {
      await verifyTotp(factorId, parsed.data);
      navigate(next, { replace: true });
    } catch {
      setApiError(WRONG_CODE);
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-darkblue surface-dark max-w-form my-4 flex w-full items-center justify-center px-4">
      <div className="flex w-full flex-col gap-8 py-16 sm:py-24">
        <div className="flex flex-col gap-4 sm:px-8">
          <h1 className="font-heading text-h1 text-center text-white">{title}</h1>
          <div className="font-body flex flex-col gap-3 text-white">{intro}</div>
        </div>
        {children}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:px-8" noValidate>
          <label className="flex w-full flex-col gap-1">
            <span className="font-body text-white">Sekssifret kode</span>
            <Input
              id="totp-code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123 456"
              maxLength={7}
              autoFocus
              value={code}
              invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? errorId : undefined}
              onChange={(e) => {
                setCode(e.target.value);
                setFieldError(null);
              }}
            />
          </label>
          {fieldError && <FieldError id={errorId}>{fieldError}</FieldError>}
          {apiError && <Alert>{apiError}</Alert>}
          <Button type="submit" variant="primary" size="md" icon="right" loading={loading}>
            {submitLabel}
          </Button>
        </form>
      </div>
    </div>
  );
}
