import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Panel } from '../../ui/Panel';
import { Button } from '../../ui/Buttons';
import { Input } from '../../ui/Input';
import { Alert } from '../../ui/Alert';
import { linkClassesInherit } from '../../ui/Link';
import { setPassword, signOutEverywhere } from '../../../supabase/queryHelpers/memberAuth';
import type { Profile } from '../../../supabase/queryHelpers/getProfile';
import { norwegianErrorMessage } from '../../../utils/errorMessage';
import { MIN_PASSWORD_LENGTH } from '../RegisterSection';
import { useAuth } from '../../../hooks/authContext/authContext';
import { memberPortalEnabled } from '../../../utils/featureFlags';

const dateFormat = new Intl.DateTimeFormat('nb-NO', { dateStyle: 'long' });

/**
 * `/medlemsportal/innstillinger`: password, sign-in sessions and privacy. "Last ned mine data"
 * and "Slett kontoen min" join the privacy panel in phase 3 PR 7 (docs/plans/gdpr.md).
 */
export default function MemberSettingsSection({ profile }: { profile: Profile }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <PasswordPanel />
      <SessionsPanel />
      {/* The legal pages only exist once member sign-up is on (phase 3 PR 1). */}
      {memberPortalEnabled && (
        <Panel title="Personvern" className="md:col-span-2">
          <p>
            {profile.terms_accepted_version && profile.terms_accepted_at
              ? `Du godtok personvernerklæringen og vilkårene (versjon ${profile.terms_accepted_version}) ${dateFormat.format(new Date(profile.terms_accepted_at))}.`
              : 'Du har ikke godtatt personvernerklæringen og vilkårene ennå.'}
          </p>
          <p>
            Les{' '}
            <Link to="/personvern" className={`${linkClassesInherit} underline`}>
              personvernerklæringen
            </Link>{' '}
            og{' '}
            <Link to="/vilkår" className={`${linkClassesInherit} underline`}>
              vilkårene
            </Link>
            .
          </p>
        </Panel>
      )}
    </div>
  );
}

function PasswordPanel() {
  const [password, setPasswordValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setMessage({ tone: 'error', text: `Passordet må ha minst ${MIN_PASSWORD_LENGTH} tegn.` });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await setPassword(password);
      setPasswordValue('');
      setMessage({ tone: 'success', text: 'Passordet er lagret.' });
    } catch (err: unknown) {
      setMessage({
        tone: 'error',
        text: norwegianErrorMessage(
          err,
          'Vi fikk ikke lagret passordet. Logg ut, logg inn med en kode og prøv igjen.',
        ),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title="Passord">
      <p>Du kan alltid logge inn med en kode på e-post. Et passord er valgfritt.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span>Nytt passord</span>
          <Input
            type="password"
            name="new-password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(e) => setPasswordValue(e.target.value)}
            required
          />
        </label>
        {message && <Alert tone={message.tone}>{message.text}</Alert>}
        <Button type="submit" variant="primary" size="md" loading={saving} className="self-start">
          Lagre passord
        </Button>
      </form>
    </Panel>
  );
}

function SessionsPanel() {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signOutAll = async () => {
    setBusy(true);
    setError(null);
    try {
      await signOutEverywhere();
      await refreshSession();
      navigate('/login');
    } catch (err: unknown) {
      setError(norwegianErrorMessage(err, 'Vi fikk ikke logget deg ut. Prøv igjen.'));
      setBusy(false);
    }
  };

  return (
    <Panel title="Innlogging">
      <p>
        Har du logget inn på en telefon eller PC du ikke bruker lenger? Logg ut overalt, så må alle
        enheter logge inn på nytt.
      </p>
      {error && <Alert>{error}</Alert>}
      <Button
        type="button"
        variant="secondary"
        size="md"
        loading={busy}
        onClick={() => void signOutAll()}
        className="self-start"
      >
        Logg ut på alle enheter
      </Button>
    </Panel>
  );
}
