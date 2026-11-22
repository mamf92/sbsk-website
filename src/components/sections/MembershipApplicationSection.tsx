import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, FieldError } from '../ui/Alert';
import { Button } from '../ui/Buttons';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { linkClassesInherit } from '../ui/Link';
import {
  membershipApplicationSchema,
  type MembershipApplicationValues,
} from '../../schemas/membershipApplication';
import {
  createApplication,
  type ApplicationInput,
} from '../../supabase/queryHelpers/membershipApplications';
import { CURRENT_LEGAL_VERSION } from '../../utils/legal';
import { CLUB_EMAIL, CLUB_EMAIL_HREF } from '../../utils/contact';

type FieldName = keyof MembershipApplicationValues;

const EMPTY: MembershipApplicationValues = {
  name: '',
  surname: '',
  email: '',
  birthYear: '',
  message: '',
};

/**
 * `/bli-medlem` once member sign-up is on: the application the board approves in the member
 * list. Approval puts the person on the register, and they then make their own login with the
 * same email. Payment (Vipps) joins this flow in phase 6.
 *
 * Same spam defence as Kontakt oss: a honeypot field a person never sees (see `ContactSection`
 * for why it is zero-size rather than hidden), answered with the same success a real
 * applicant gets.
 */
export default function MembershipApplicationSection({
  send = createApplication,
}: {
  /** For tests; the real insert otherwise. */
  send?: (input: ApplicationInput) => Promise<void>;
}) {
  const [values, setValues] = useState<MembershipApplicationValues>(EMPTY);
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [sending, setSending] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [sent, setSent] = useState(false);

  const set = <K extends FieldName>(field: K, value: MembershipApplicationValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(false);
    if (honeypot) {
      setSent(true);
      return;
    }
    const result = membershipApplicationSchema.safeParse(values);
    if (!result.success) {
      const next: Partial<Record<FieldName, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as FieldName;
        next[field] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setSending(true);
    try {
      await send({
        name: result.data.name,
        surname: result.data.surname,
        email: result.data.email,
        birthYear: result.data.birthYear ? Number(result.data.birthYear) : null,
        message: result.data.message || null,
        privacyVersion: CURRENT_LEGAL_VERSION,
      });
      setSent(true);
    } catch {
      setApiError(true);
    } finally {
      setSending(false);
    }
  };

  const field = (
    name: 'name' | 'surname' | 'email' | 'birthYear',
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement>,
  ) => (
    <div className="flex w-full flex-col gap-2">
      <label htmlFor={`apply-${name}`} className="font-body text-white">
        {label}
      </label>
      <Input
        id={`apply-${name}`}
        name={name}
        value={values[name]}
        onChange={(e) => set(name, e.target.value)}
        invalid={Boolean(errors[name])}
        disabled={sending}
        aria-describedby={errors[name] ? `apply-${name}-error` : undefined}
        {...props}
      />
      {errors[name] && <FieldError id={`apply-${name}-error`}>{errors[name]}</FieldError>}
    </div>
  );

  return (
    <div className="bg-darkblue surface-dark max-w-form my-4 flex w-full items-center justify-center px-4">
      <div className="flex w-full flex-col gap-8 py-16 md:py-24">
        <div className="font-body flex flex-col gap-4 text-white">
          <h1 className="font-heading text-h1 tracking-heading font-bold">Bli medlem</h1>
          <p>
            Som medlem kan du melde deg på arrangementer, få medlemskort og samle merker. Send en
            søknad, så legger styret deg inn i medlemslisten og sender deg en e-post om hvordan du
            lager profilen din.
          </p>
          <p>
            Spørsmål? Send oss en e-post på{' '}
            <a href={CLUB_EMAIL_HREF} className={`${linkClassesInherit} underline`}>
              {CLUB_EMAIL}
            </a>
            .
          </p>
        </div>

        {sent ? (
          <Alert tone="success">
            Takk! Søknaden er sendt. Styret ser på den og tar kontakt på e-post.
          </Alert>
        ) : (
          <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="h-0 w-0 overflow-hidden opacity-0">
              <label htmlFor="apply-website" aria-hidden="true">
                Nettside
              </label>
              <input
                id="apply-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>
            {field('name', 'Fornavn', { autoComplete: 'given-name', maxLength: 80 })}
            {field('surname', 'Etternavn', { autoComplete: 'family-name', maxLength: 80 })}
            {field('email', 'E-post', { type: 'email', autoComplete: 'email' })}
            {field('birthYear', 'Fødselsår (valgfritt)', {
              inputMode: 'numeric',
              autoComplete: 'bday-year',
              maxLength: 4,
              placeholder: 'For eksempel 1990',
            })}
            <div className="flex w-full flex-col gap-2">
              <label htmlFor="apply-message" className="font-body text-white">
                Noe du vil fortelle oss? (valgfritt)
              </label>
              <Textarea
                id="apply-message"
                name="message"
                maxLength={1000}
                value={values.message}
                onChange={(e) => set('message', e.target.value)}
                invalid={Boolean(errors.message)}
                disabled={sending}
              />
              {errors.message && <FieldError>{errors.message}</FieldError>}
            </div>
            <p className="font-body text-white">
              Vi bruker opplysningene til å behandle søknaden.{' '}
              <Link to="/personvern" className={`${linkClassesInherit} underline`}>
                Les personvernerklæringen
              </Link>
              .
            </p>
            {apiError && (
              <Alert>
                Kunne ikke sende søknaden. Noe gikk galt på vår side — prøv igjen om litt.
              </Alert>
            )}
            <Button type="submit" variant="primary" size="md" icon="right" loading={sending}>
              Send søknad
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
