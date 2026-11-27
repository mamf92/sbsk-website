import { useState } from 'react';
import { Link } from 'react-router-dom';
import Check from '../../assets/icons/symbols/check.svg?react';
import { Alert, FieldError } from '../ui/Alert';
import { Button } from '../ui/Buttons';
import { Eyebrow } from '../ui/Eyebrow';
import { Input } from '../ui/Input';
import { MembershipCardFace } from '../ui/MembershipCardFace';
import { StepStrip } from '../ui/StepStrip';
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
import { clockTime, formatDayLong } from '../../utils/eventDateFormat';
import { downloadIcs } from '../../utils/ics';
import type { CalendarEventTypes } from '../../sanity/queryHelpers/events';

type FieldName = keyof MembershipApplicationValues;

const BENEFITS = [
  'Meld deg på turneringer og arrangementer',
  'Medlemskort med QR-kode til innsjekk',
  'Samle merker for kvelder og turneringer',
  '15 % rabatt hos Outland',
];

const STEPS = ['Send inn', 'Styret legger deg til', 'Lag profil'];

const EMPTY: MembershipApplicationValues = {
  name: '',
  surname: '',
  email: '',
  birthYear: '',
  message: '',
};

/**
 * `/bli-medlem` once member sign-up is on: the application the board approves in the member
 * list. Left, why join, with a membership card that fills in with the name as it is typed;
 * right, the form on a cream sheet with the three steps (Send inn → Styret legger deg til →
 * Lag profil). After sending, the strip moves to step 2, the card gets a «Søkt» stamp, and
 * the next game night is offered while they wait. Approval puts the person on the register, and they then make their own login with the
 * same email. Payment (Vipps) joins this flow in phase 6.
 *
 * Same spam defence as Kontakt oss: a honeypot field a person never sees (see `ContactSection`
 * for why it is zero-size rather than hidden), answered with the same success a real
 * applicant gets.
 */
export default function MembershipApplicationSection({
  send = createApplication,
  nextGameNight = null,
}: {
  /** For tests; the real insert otherwise. */
  send?: (input: ApplicationInput) => Promise<void>;
  /** Shown as «Mens du venter» after sending; the note is left out without one. */
  nextGameNight?: CalendarEventTypes | null;
}) {
  const [values, setValues] = useState<MembershipApplicationValues>(EMPTY);
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [sending, setSending] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [sent, setSent] = useState(false);
  // What the thank-you speaks to, frozen at send time. A honeypot hit has no real name.
  const [sentTo, setSentTo] = useState<{ name: string; email: string } | null>(null);

  const set = <K extends FieldName>(field: K, value: MembershipApplicationValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(false);
    if (honeypot) {
      // Looks exactly like a real success, so a bot cannot tell it was caught.
      setSentTo({ name: values.name.trim(), email: values.email.trim() });
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
      setSentTo({ name: result.data.name, email: result.data.email });
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
    optional = false,
  ) => (
    <div className="flex w-full flex-col gap-2">
      <label htmlFor={`apply-${name}`} className="font-body text-sm">
        {label} {optional && <span className="text-gray-500">(valgfritt)</span>}
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

  const cardName = `${values.name.trim()} ${values.surname.trim()}`.trim();

  return (
    <section className="bg-darkblue surface-dark dot-pattern w-full text-white">
      <div className="max-w-shell mx-auto grid items-start gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12 lg:py-16">
        {/* Why join, with your own card filling in as you type. */}
        <div className="flex flex-col gap-6">
          <Eyebrow>Bli medlem</Eyebrow>
          <h1 className="font-heading text-display font-bold">Få din plass ved bordet</h1>
          <p className="font-body max-w-[60ch] text-lg text-white/90">
            Spillkveldene er åpne for alle. Som medlem får du litt mer:
          </p>
          <ul className="flex flex-col gap-2.5">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="font-body flex items-center gap-3">
                <span className="bg-orange text-darkestblue flex size-6 flex-none items-center justify-center">
                  <Check aria-hidden="true" className="h-4 w-4 fill-current" />
                </span>
                {benefit}
              </li>
            ))}
          </ul>
          {/* Hidden on small screens so the form starts high. */}
          <div className="pt-4 pl-2 max-lg:hidden">
            <MembershipCardFace name={cardName} stamp={sent ? 'Søkt' : undefined} />
          </div>
        </div>

        {/* The form, on paper. The sheet casts the band's white shadow (`surface-dark` on the
            section: darkestblue on darkblue is only 1.24:1); what is on it takes
            `surface-light`, set on the inner blocks because the utility also re-points the
            element it sits on. */}
        <div className="bg-cream text-darkestblue shadow-4 border-2 border-black">
          <div className="flex flex-col gap-1 p-5 pb-0 sm:p-7 sm:pb-0">
            <h2 className="font-heading text-h2 font-bold">
              {sent ? (sentTo ? `Takk, ${sentTo.name}!` : 'Takk!') : 'Meld deg inn'}
            </h2>
            <p className="font-body text-sm text-gray-500">
              {sent
                ? 'Nå er det styret sin tur.'
                : 'Fyll inn navn og e-post, så ordner styret resten.'}
            </p>
          </div>
          <div className="px-5 pt-4 sm:px-7">
            <StepStrip steps={STEPS} active={sent ? 2 : 1} />
          </div>

          {sent ? (
            <div className="surface-light flex flex-col gap-5 p-5 sm:p-7" role="status">
              <p className="font-body">
                Styret legger deg til og sender en e-post
                {sentTo ? (
                  <>
                    {' '}
                    til <strong>{sentTo.email}</strong>
                  </>
                ) : null}
                . Der finner du en lenke for å lage profilen din.
              </p>
              {nextGameNight && <WhileYouWait event={nextGameNight} />}
            </div>
          ) : (
            <form
              noValidate
              onSubmit={handleSubmit}
              className="surface-light flex flex-col gap-5 p-5 sm:p-7 sm:pt-6"
            >
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
              <div className="grid gap-5 sm:grid-cols-2">
                {field('name', 'Fornavn', { autoComplete: 'given-name', maxLength: 80 })}
                {field('surname', 'Etternavn', { autoComplete: 'family-name', maxLength: 80 })}
              </div>
              {field('email', 'E-post', { type: 'email', autoComplete: 'email' })}
              <div className="sm:w-40">
                {field(
                  'birthYear',
                  'Fødselsår',
                  {
                    inputMode: 'numeric',
                    autoComplete: 'bday-year',
                    maxLength: 4,
                    placeholder: '1990',
                  },
                  true,
                )}
              </div>
              <div className="flex w-full flex-col gap-2">
                <label htmlFor="apply-message" className="font-body text-sm">
                  Noe du vil si til oss? <span className="text-gray-500">(valgfritt)</span>
                </label>
                <Textarea
                  id="apply-message"
                  name="message"
                  rows={3}
                  maxLength={1000}
                  placeholder="For eksempel hvilke spill du liker"
                  value={values.message}
                  onChange={(e) => set('message', e.target.value)}
                  invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? 'apply-message-error' : undefined}
                  disabled={sending}
                />
                {errors.message && (
                  <FieldError id="apply-message-error">{errors.message}</FieldError>
                )}
              </div>
              <div className="flex flex-col gap-3 border-t border-black pt-4">
                <p className="font-body text-sm">
                  Vi bruker dette bare til innmeldingen.{' '}
                  <Link to="/personvern" className={`${linkClassesInherit} underline`}>
                    Les personvernerklæringen
                  </Link>
                  .
                </p>
                {apiError && (
                  <Alert>Kunne ikke sende. Noe gikk galt hos oss. Prøv igjen om litt.</Alert>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  icon="right"
                  loading={sending}
                  className="w-full"
                >
                  Meld meg inn
                </Button>
                <p className="font-body text-center text-sm text-gray-500">
                  Spørsmål?{' '}
                  <a href={CLUB_EMAIL_HREF} className={`${linkClassesInherit} underline`}>
                    {CLUB_EMAIL}
                  </a>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

/** The next game night, with an .ics download, for someone waiting to be added. */
function WhileYouWait({ event }: { event: CalendarEventTypes }) {
  const start = new Date(event.eventStartTime);
  const end = new Date(event.eventEndTime);
  return (
    <div className="border-darkestblue flex flex-col gap-3 border-l-4 bg-white p-4">
      <span className="font-heading text-darkestorange text-xs font-bold tracking-[0.16em] uppercase">
        Mens du venter
      </span>
      <p className="font-heading text-h3 font-bold">
        Kom på spillkveld {formatDayLong(start, 'nb')}
      </p>
      <p className="font-body text-sm">
        {event.location ? `${event.location} fra ${clockTime(start)}` : `Fra ${clockTime(start)}`}.
        Ingen påmelding.
      </p>
      <Button
        type="button"
        variant="primary"
        size="md"
        icon="calendar"
        className="w-fit"
        onClick={() =>
          downloadIcs(
            { title: event.title, start, end, location: event.location },
            'spillkveld.ics',
          )
        }
      >
        Legg i kalenderen
      </Button>
    </div>
  );
}
