import { useState } from 'react';
import { Button } from '../ui/Buttons';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { useAuthActions, MemberDisabledError, type SignInResult } from '../../hooks/useAuthActions';
import { norwegianErrorMessage } from '../../utils/errorMessage';

type Step = 'email' | 'code';

interface CodeSignInFormProps {
  /** Carried over from the password form, so the member does not type it twice. */
  initialEmail?: string;
  onSignedIn: (result: SignInResult) => void;
  /** Shown under the form, e.g. a way back to the password form. */
  footer?: React.ReactNode;
}

export const CODE_SENT =
  'Vi har sendt en kode til e-posten din. Koden virker i 10 minutter. Sjekk søppelpost hvis du ikke finner den.';

/**
 * Sign in with a one-time code sent by email. Also how a member creates their login: the first
 * code for a listed email creates it (phase 3 decision 4). A code rather than a magic link,
 * because a link opens in whatever browser the mail app picks (decision 3).
 */
export default function CodeSignInForm({
  initialEmail = '',
  onSignedIn,
  footer,
}: CodeSignInFormProps) {
  const { requestSignInCode, signInWithCode } = useAuthActions();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async (event?: React.SubmitEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await requestSignInCode(email);
      setCode('');
      setStep('code');
    } catch (err: unknown) {
      setError(norwegianErrorMessage(err, 'Vi fikk ikke sendt koden. Prøv igjen.'));
    } finally {
      setLoading(false);
    }
  };

  const verify = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      onSignedIn(await signInWithCode(email, code));
    } catch (err: unknown) {
      setError(
        err instanceof MemberDisabledError
          ? 'Kontoen er deaktivert. Kontakt styret.'
          : norwegianErrorMessage(err, 'Noe gikk galt. Prøv igjen.'),
      );
    } finally {
      setLoading(false);
    }
  };

  if (step === 'code') {
    return (
      <form onSubmit={verify} className="flex flex-col gap-5">
        <Alert tone="info">{CODE_SENT}</Alert>
        <label className="flex w-full flex-col gap-1">
          <span className="font-body text-white">Kode fra e-posten</span>
          <Input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]{6,10}"
            maxLength={10}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            autoFocus
          />
        </label>
        {error && <Alert>{error}</Alert>}
        <Button type="submit" variant="primary" size="md" icon="right" loading={loading}>
          Logg inn
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={() => void sendCode()}
          disabled={loading}
        >
          Send ny kode
        </Button>
        <Button
          type="button"
          variant="tertiary"
          size="md"
          onClick={() => {
            setStep('email');
            setError(null);
          }}
        >
          Bruk en annen e-post
        </Button>
        {footer}
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="flex flex-col gap-5">
      <label className="flex w-full flex-col gap-1">
        <span className="font-body text-white">E-post</span>
        <Input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="din@epost.no"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      {error && <Alert>{error}</Alert>}
      <Button type="submit" variant="primary" size="md" icon="right" loading={loading}>
        Send meg en kode
      </Button>
      {footer}
    </form>
  );
}
