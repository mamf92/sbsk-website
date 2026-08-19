import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../ui/Buttons';
import { Input } from '../ui/Input';
import { useAuthActions } from '../../hooks/useAuthActions';

export default function RegisterSection() {
  const navigate = useNavigate();
  const { registerWithPassword } = useAuthActions();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const { isAdmin } = await registerWithPassword({ email, password });
      navigate(isAdmin ? '/styreportal' : '/medlemsportal');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(
          'Noe gikk galt: ' +
            err.message +
            '. Er du nylig blitt medlem av klubben? Det kan ta litt tid før kontoen din er klar til bruk. Prøv igjen senere, eller kontakt oss hvis problemet vedvarer.',
        );
      } else {
        setError(
          'Noe gikk galt. Er du nylig blitt medlem av klubben? Det kan ta litt tid før kontoen din er klar til bruk. Prøv igjen senere, eller kontakt oss hvis problemet vedvarer.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-darkblue surface-dark max-w-form my-4 flex w-full items-center justify-center px-4">
      <div className="flex w-full flex-col gap-8 py-24">
        <div className="flex flex-col items-center gap-4">
          <h1 className="font-heading text-h1 text-center text-white">Lag medlemsprofil</h1>
          <p className="font-body w-full text-center text-white">
            Er du medlem i klubben kan du lage din egen medlemsprofil for å melde deg på
            arrangementer, se medlemsfordeler og på sikt mye mer!
          </p>
          <Link to="/login" className="text-white hover:underline">
            Har du allerede en profil kan du logge inn her!
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
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {error && <div className="text-orange text-sm">{error}</div>}

            {/* See LoginSection — registering twice was reachable. */}
            <Button
              type="submit"
              variant={loading ? 'disabled' : 'primary'}
              size="md"
              icon="right"
              disabled={loading}
            >
              {loading ? 'Registrerer…' : 'Registrer deg'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
