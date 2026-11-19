import { useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Buttons';
import { Input } from '../ui/Input';
import { Alert, FieldError } from '../ui/Alert';
import { linkClassesInherit } from '../ui/Link';
import { newPasswordSchema } from '../../schemas/password';
import { useAutofillSync } from '../../hooks/useAutofillSync';
import { updatePassword } from '../../supabase/queryHelpers/passwordReset';

/** Set-new-password form (or the expired-link message) behind the recovery email. */
export default function NewPasswordSection({ linkValid }: { linkValid: boolean }) {
  const navigate = useNavigate();
  const errorId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Password managers can fill both fields without firing `change`; see LoginSection.
  useAutofillSync(formRef, ['password', 'confirm'], (filled) => {
    if (filled.password !== undefined) setPassword(filled.password);
    if (filled.confirm !== undefined) setConfirm(filled.confirm);
  });

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(null);
    const parsed = newPasswordSchema.safeParse({ password, confirm });
    if (!parsed.success) {
      const next: { password?: string; confirm?: string } = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] === 'confirm' ? 'confirm' : 'password';
        next[key] ??= issue.message;
      }
      setFieldErrors(next);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      await updatePassword(parsed.data.password);
      navigate('/login?reason=password_changed', { replace: true });
    } catch {
      setApiError(
        'Vi klarte ikke å lagre passordet. Lenken kan ha utløpt, eller passordet er for enkelt å gjette. Prøv igjen eller be om en ny lenke.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-darkblue surface-dark max-w-form my-4 flex w-full items-center justify-center px-4">
      <div className="flex w-full flex-col gap-8 py-24">
        <h1 className="font-heading text-h1 text-center text-white">Nytt passord</h1>
        <div className="w-full px-8">
          {linkValid ? (
            <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              <label className="flex w-full flex-col gap-1">
                <span className="font-body text-white">Nytt passord</span>
                <Input
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? `${errorId}-p` : undefined}
                />
                {fieldErrors.password && (
                  <FieldError id={`${errorId}-p`}>{fieldErrors.password}</FieldError>
                )}
              </label>
              <label className="flex w-full flex-col gap-1">
                <span className="font-body text-white">Gjenta passordet</span>
                <Input
                  type="password"
                  name="confirm"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  invalid={!!fieldErrors.confirm}
                  aria-describedby={fieldErrors.confirm ? `${errorId}-c` : undefined}
                />
                {fieldErrors.confirm && (
                  <FieldError id={`${errorId}-c`}>{fieldErrors.confirm}</FieldError>
                )}
              </label>
              {apiError && <Alert>{apiError}</Alert>}
              <Button type="submit" variant="primary" size="md" icon="right" loading={loading}>
                Lagre passord
              </Button>
            </form>
          ) : (
            <div className="flex flex-col gap-5">
              <Alert>Lenken er utløpt eller allerede brukt. Be om en ny lenke.</Alert>
              <Link
                to="/glemt-passord"
                className={`${linkClassesInherit} text-center text-white underline`}
              >
                Send ny lenke
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
