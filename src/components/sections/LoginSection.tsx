import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../ui/Buttons';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { useAuthActions } from '../../hooks/useAuthActions';

export default function LoginSection({ reason }: { reason?: string }) {
  const navigate = useNavigate();
  const { signInWithPassword } = useAuthActions();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const { isAdmin } = await signInWithPassword({ email, password });
      navigate(isAdmin ? '/styreportal' : '/medlemsportal');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Noe gikk galt. Prøv igjen.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-darkblue surface-dark max-w-form my-4 flex w-full items-center justify-center px-4">
      <div className="flex w-full flex-col gap-8 py-24">
        <div className="flex flex-col items-center gap-4">
          <h1 className="font-heading text-h1 text-center text-white">Velkommen tilbake!</h1>
          {reason === 'not_authenticated' && (
            <p className="font-body text-orange text-center">
              Det ser ut som at du ikke er logget inn. Logg inn igjen for å fortsette.
            </p>
          )}
          <p className="font-body w-full text-center text-white">
            Her kan du logge inn på din medlemsprofil og få tilgang til arrangementer,
            medlemsfordeler og mer!
          </p>
          <p className="font-body w-full text-center text-white">
            Ingen konto enda? Er du medlem i klubben kan du lage din egen medlemsprofil ved å klikke
            på lenken under.
          </p>
          <Link to="/lag-medlemsprofil" className="text-white underline">
            Registrere deg her!
          </Link>
        </div>

        <div className="w-full px-8 pt-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <label className="flex w-full flex-col gap-1">
              <span className="font-body text-white">E-post</span>
              <Input
                type="email"
                id="email"
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
          </form>
        </div>
      </div>
    </div>
  );
}
