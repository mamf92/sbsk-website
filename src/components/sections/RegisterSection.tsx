import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Buttons';
import { Input } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import { Alert } from '../ui/Alert';
import { linkClassesInherit } from '../ui/Link';
import CodeSignInForm from './CodeSignInForm';
import { destinationAfterSignIn } from '../../hooks/useAuthActions';
import { useAuth } from '../../hooks/authContext/authContext';
import { completeOnboarding, setPassword } from '../../supabase/queryHelpers/memberAuth';
import type { Profile } from '../../supabase/queryHelpers/getProfile';
import { CURRENT_LEGAL_VERSION } from '../../utils/legal';
import { norwegianErrorMessage } from '../../utils/errorMessage';
import { safeNextPath } from '../../loaders/requireAdminSession';

/** Supabase's own minimum is 6; the club asks for more (phase 3 plan, auth config). */
export const MIN_PASSWORD_LENGTH = 10;

interface RegisterSectionProps {
  /** Null while signed out: the page then asks for an email and a code first. */
  profile: Profile | null;
  next: string | null;
}

/**
 * `/lag-medlemsprofil`. Step 1 (signed out): email → code, which creates the login for a listed
 * member. Step 2 (signed in): first-time setup — name, age, the privacy policy and terms, and an
 * optional password. Also where `requireMember` sends a member after the terms change.
 */
export default function RegisterSection({ profile, next }: RegisterSectionProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-darkblue surface-dark max-w-form my-4 flex w-full items-center justify-center px-4">
      <div className="flex w-full flex-col gap-8 py-24">
        <div className="flex flex-col items-center gap-4">
          <h1 className="font-heading text-h1 text-center text-white">Lag medlemsprofil</h1>
          {profile ? (
            <p className="font-body w-full text-center text-white">
              Nesten ferdig. Sjekk navnet ditt og godta vilkårene, så er profilen klar.
            </p>
          ) : (
            <>
              <p className="font-body w-full text-center text-white">
                Står du i medlemslisten til klubben? Skriv inn e-posten du ga styret. Vi sender deg
                en kode, og så lager vi kontoen din.
              </p>
              <Link to="/login" className={`${linkClassesInherit} text-white underline`}>
                Har du allerede en profil? Logg inn her.
              </Link>
            </>
          )}
        </div>

        <div className="w-full px-8 pt-8">
          {profile ? (
            <OnboardingForm profile={profile} next={next} />
          ) : (
            <CodeSignInForm
              onSignedIn={(result) => navigate(destinationAfterSignIn(result, next))}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function OnboardingForm({ profile, next }: { profile: Profile; next: string | null }) {
  const navigate = useNavigate();
  const { isAdmin, refreshSession } = useAuth();
  const [name, setName] = useState(profile.name ?? '');
  const [surname, setSurname] = useState(profile.surname ?? '');
  const [oldEnough, setOldEnough] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [password, setPasswordValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordTooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const updatingTerms = profile.terms_accepted_version !== null;

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passwordTooShort) {
      setError(`Passordet må ha minst ${MIN_PASSWORD_LENGTH} tegn.`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // The profile and the acceptance first: the password is optional, and its failure
      // (e.g. an admin at aal1, whom GoTrue refuses a password change) must not lose them.
      await completeOnboarding({
        supabaseId: profile.supabase_id,
        name,
        surname,
        termsVersion: CURRENT_LEGAL_VERSION,
      });
    } catch (err: unknown) {
      setError(norwegianErrorMessage(err, 'Vi fikk ikke lagret profilen. Prøv igjen.'));
      setLoading(false);
      return;
    }
    try {
      if (password) await setPassword(password);
    } catch (err: unknown) {
      setError(
        norwegianErrorMessage(
          err,
          'Profilen er lagret, men passordet ble ikke satt. Du kan sette det senere i innstillingene.',
        ),
      );
      setLoading(false);
      return;
    }
    try {
      await refreshSession();
      navigate(safeNextPath(next, isAdmin ? '/styreportal' : '/medlemsportal'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {updatingTerms && (
        <Alert tone="info">
          Vi har oppdatert personvernerklæringen og vilkårene. Les dem og godta for å fortsette.
        </Alert>
      )}
      <label className="flex w-full flex-col gap-1">
        <span className="font-body text-white">Fornavn</span>
        <Input
          name="given-name"
          autoComplete="given-name"
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>
      <label className="flex w-full flex-col gap-1">
        <span className="font-body text-white">Etternavn</span>
        <Input
          name="family-name"
          autoComplete="family-name"
          maxLength={80}
          value={surname}
          onChange={(e) => setSurname(e.target.value)}
        />
      </label>

      <label className="font-body flex items-start gap-3 text-white">
        <Checkbox
          name="age"
          checked={oldEnough}
          onChange={(e) => setOldEnough(e.target.checked)}
          required
          className="mt-1"
        />
        <span>Jeg er 13 år eller eldre.</span>
      </label>
      <label className="font-body flex items-start gap-3 text-white">
        <Checkbox
          name="terms"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          required
          className="mt-1"
        />
        <span>
          Jeg har lest{' '}
          <Link
            to="/personvern"
            target="_blank"
            className={`${linkClassesInherit} text-white underline`}
          >
            personvernerklæringen
          </Link>{' '}
          og godtar{' '}
          <Link
            to="/vilkår"
            target="_blank"
            className={`${linkClassesInherit} text-white underline`}
          >
            vilkårene
          </Link>
          .
        </span>
      </label>

      {!updatingTerms && (
        <label className="flex w-full flex-col gap-1">
          <span className="font-body text-white">Passord (valgfritt)</span>
          <span className="font-body text-sm text-white">
            Du kan alltid logge inn med en kode på e-post. Med passord går det litt raskere.
          </span>
          <Input
            type="password"
            name="new-password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(e) => setPasswordValue(e.target.value)}
            invalid={passwordTooShort}
          />
        </label>
      )}

      {error && <Alert>{error}</Alert>}

      <Button type="submit" variant="primary" size="md" icon="right" loading={loading}>
        {updatingTerms ? 'Godta og fortsett' : 'Lagre og gå til Min side'}
      </Button>
    </form>
  );
}
