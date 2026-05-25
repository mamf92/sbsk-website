import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../ui/Buttons';
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
        setError('Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-darkblue my-4 flex w-full max-w-150 items-center justify-center px-4">
      <div className="flex w-full flex-col gap-8 py-24">
        <div className="flex flex-col items-center gap-4">
          <h1 className="font-heading text-center text-3xl text-white">Velkommen tilbake!</h1>
          {reason === 'not_authenticated' && (
            <p className="text-body text-orange text-center">
              Det ser ut som at du ikke er logget inn. Logg inn igjen for å fortsette.
            </p>
          )}
          <p className="text-body w-full text-center text-white">
            Er du medlem i klubben kan du lage din egen medlemsprofil ved å klikke på lenken under.
          </p>
          <Link to="/lag-medlemsprofil" className="text-white hover:underline">
            Er du medlem kan du registrere deg her!
          </Link>
        </div>

        <div className="w-full px-8 pt-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <label className="flex w-full flex-col gap-1">
              <span className="font-body text-white">Email</span>
              <input
                type="email"
                id="email"
                autoComplete="email"
                placeholder="your@email.com"
                className="focus:ring-orange border-darkblue dark:border-orange placeholder:text-placeholder text-darkblue placeholder:font-body w-full border bg-white px-3 py-2 focus:ring-2 focus:outline-none md:px-4 md:py-3"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="flex w-full flex-col gap-1">
              <span className="font-body text-white">Password</span>
              <input
                type="password"
                id="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="focus:ring-orange border-darkblue dark:border-orange placeholder:text-placeholder text-darkblue placeholder:font-body w-full border bg-white px-3 py-2 focus:ring-2 focus:outline-none md:px-4 md:py-3"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {error && <div className="text-orange text-sm">{error}</div>}

            <Button type="submit" variant="primary" size="md" icon="right">
              {loading ? 'Logging in...' : 'Log In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
