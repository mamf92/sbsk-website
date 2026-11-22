import { norwegianErrorMessage } from '../../utils/errorMessage';
import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../ui/Buttons';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import {
  destinationAfterSignIn,
  MemberDisabledError,
  useAuthActions,
} from '../../hooks/useAuthActions';
import CodeSignInForm from './CodeSignInForm';
import { memberPortalEnabled } from '../../utils/featureFlags';
import { useAutofillSync } from '../../hooks/useAutofillSync';
import { linkClassesInherit } from '../ui/Link';

export default function LoginSection({ reason, next }: { reason?: string; next?: string }) {
  const navigate = useNavigate();
  const { signInWithPassword } = useAuthActions();
  const formRef = useRef<HTMLFormElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [mode, setMode] = useState<'password' | 'code'>('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Saved credentials are the classic autofill case this closes: the browser can write both
  // fields before this component's first paint, without ever firing `change`, and `email` /
  // `password` above would otherwise stay `''` — a submit right after page load would then
  // send an empty password to Supabase despite the field showing one on screen.
  useAutofillSync(formRef, ['email', 'password'], (filled) => {
    if (filled.email !== undefined) setEmail(filled.email);
    if (filled.password !== undefined) setPassword(filled.password);
  });

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      navigate(destinationAfterSignIn(await signInWithPassword({ email, password }), next));
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

  return (
    <div className="bg-darkblue surface-dark max-w-form my-4 flex w-full items-center justify-center px-4">
      <div className="flex w-full flex-col gap-8 py-24">
        <div className="flex flex-col items-center gap-4">
          <h1 className="font-heading text-h1 text-center text-white">Velkommen tilbake!</h1>
          {reason === 'password_changed' && (
            <Alert tone="success">Passordet er oppdatert. Logg inn med det nye passordet.</Alert>
          )}
          {reason === 'not_authenticated' && (
            <Alert tone="info">
              Det ser ut som at du ikke er logget inn. Logg inn igjen for å fortsette.
            </Alert>
          )}
          {reason === 'disabled' && (
            <Alert tone="warning">Kontoen er deaktivert. Kontakt styret hvis dette er feil.</Alert>
          )}
          {memberPortalEnabled && (
            <p className="font-body w-full text-center text-white">
              Logg inn med passord, eller få en engangskode på e-post. Første gang? Velg kode, så
              lager vi kontoen din.
            </p>
          )}
        </div>

        <div className="w-full px-8 pt-8">
          {mode === 'code' ? (
            <CodeSignInForm
              initialEmail={email}
              onSignedIn={(result) => navigate(destinationAfterSignIn(result, next))}
              footer={
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setMode('password')}
                >
                  Logg inn med passord i stedet
                </Button>
              }
            />
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
              <label className="flex w-full flex-col gap-1">
                <span className="font-body text-white">E-post</span>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  placeholder="din@epost.no"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label className="flex w-full flex-col gap-1">
                <span className="font-body text-white">Passord</span>
                <Input
                  type="password"
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>

              {error && <Alert>{error}</Alert>}

              <Button type="submit" variant="primary" size="md" icon="right" loading={loading}>
                Logg inn
              </Button>
              {memberPortalEnabled && (
                <Button type="button" variant="secondary" size="md" onClick={() => setMode('code')}>
                  Send meg en engangskode i stedet
                </Button>
              )}
              <Link
                to="/glemt-passord"
                className={`${linkClassesInherit} text-center text-white underline`}
              >
                Glemt passord?
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
