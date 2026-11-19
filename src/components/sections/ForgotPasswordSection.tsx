import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Buttons';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { linkClassesInherit } from '../ui/Link';
import { requestPasswordReset } from '../../supabase/queryHelpers/passwordReset';

// Identical whether or not the address has an account: the form must not leak who is a member.
export const RESET_SENT =
  'Hvis det finnes en konto med denne e-postadressen, har vi sendt en lenke for å lage nytt passord. Sjekk også søppelpost.';

export default function ForgotPasswordSection() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch {
      // Only a real failure (rate limit, offline) lands here; it says nothing about the account.
      setError('Vi klarte ikke å sende e-posten akkurat nå. Vent litt og prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-darkblue surface-dark max-w-form my-4 flex w-full items-center justify-center px-4">
      <div className="flex w-full flex-col gap-8 py-24">
        <div className="flex flex-col items-center gap-4">
          <h1 className="font-heading text-h1 text-center text-white">Glemt passord?</h1>
          <p className="font-body w-full text-center text-white">
            Skriv inn e-postadressen til medlemsprofilen din, så sender vi deg en lenke for å lage
            et nytt passord.
          </p>
        </div>

        <div className="w-full px-8">
          {sent ? (
            <div className="flex flex-col gap-5">
              <Alert tone="success">{RESET_SENT}</Alert>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
              {error && <Alert>{error}</Alert>}
              <Button type="submit" variant="primary" size="md" icon="right" loading={loading}>
                Send lenke
              </Button>
            </form>
          )}
          <p className="font-body mt-6 text-center text-white">
            <Link to="/login" className={`${linkClassesInherit} underline`}>
              Tilbake til innlogging
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
