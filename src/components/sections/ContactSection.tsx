import { useState } from 'react';
import { Alert, FieldError } from '../ui/Alert';
import { Button } from '../ui/Buttons';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { createContactMessage } from '../../supabase/queryHelpers/createContactMessage';
import { contactSchema, type ContactValues } from '../../schemas/contact';

type FieldName = keyof ContactValues;

const EMPTY_VALUES: ContactValues = { name: '', email: '', message: '' };

const GENERIC_ERROR = 'Kunne ikke sende meldingen. Noe gikk galt på vår side — prøv igjen om litt.';
const SUCCESS_MESSAGE = 'Meldingen din er sendt. Vi svarer så snart vi kan.';

/**
 * Drops one key from a `Partial<Record<FieldName, T>>` without mutating it — used to clear a
 * single field's error or valid-state as the user retypes, per the handoff: errors clear on
 * change rather than waiting for the next submit.
 */
function without<T>(
  record: Partial<Record<FieldName, T>>,
  field: FieldName,
): Partial<Record<FieldName, T>> {
  if (!(field in record)) return record;
  const next = { ...record };
  delete next[field];
  return next;
}

/**
 * Kontakt oss (#180). One column — heading and intro on top, fields stacked below — on the
 * same `bg-darkblue surface-dark` panel treatment `LoginSection` uses, full width rather than
 * centered to a narrow column, matching the design handoff's screenshot.
 *
 * Validation is `contactSchema` (`src/schemas/contact.ts`), the first form on `src/schemas/` —
 * the pattern #83 wants the rest of the site's forms to eventually move onto. It runs on
 * submit, not on every keystroke, and a field's error clears as soon as the user changes it.
 *
 * The green `valid` state is separate from that: it needs a field to have been *blurred* and
 * pass validation, so a field confirms once someone has finished it rather than praising every
 * keystroke. `Input`/`Textarea` already resolve `invalid` over `valid` on their own, so passing
 * both here is enough — a field mid-error from a submit attempt never also shows green.
 *
 * Delivery is a straight insert into `public.contact_messages` (see the migration this shipped
 * with) rather than an email — no provider is chosen yet (#133). No `.select()` on the insert:
 * the table's RLS policy gives an anonymous sender no read grant, so reading the row back
 * would fail even though the insert itself succeeded.
 */
export default function ContactSection() {
  const [values, setValues] = useState<ContactValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [validFields, setValidFields] = useState<Partial<Record<FieldName, boolean>>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isValid = contactSchema.safeParse(values).success;

  const handleChange =
    (field: FieldName) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setValues((v) => ({ ...v, [field]: value }));
      setErrors((prev) => without(prev, field));
      setValidFields((prev) => without(prev, field));
    };

  const handleBlur = (field: FieldName) => () => {
    const result = contactSchema.shape[field].safeParse(values[field]);
    setValidFields((prev) => ({ ...prev, [field]: result.success }));
    setErrors((prev) =>
      result.success ? without(prev, field) : { ...prev, [field]: result.error.issues[0].message },
    );
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    setSuccess(false);
    setApiError(null);

    const result = contactSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Partial<Record<FieldName, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as FieldName;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await createContactMessage(result.data);
      setValues(EMPTY_VALUES);
      setValidFields({});
      setSuccess(true);
    } catch {
      // Not `err.message` on purpose: a Supabase/Postgres error is not Norwegian, user-facing
      // copy, and this form has no authenticated audience to show it to. The handoff's fixed
      // default stands in for it.
      setApiError(GENERIC_ERROR);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-darkblue surface-dark flex w-full flex-1 justify-center px-4 py-16 md:py-24">
      <div className="max-w-form flex w-full flex-col gap-8">
        <div className="flex flex-col gap-4 text-white">
          <h1 className="font-heading text-h1 tracking-heading font-bold">Kontakt oss!</h1>
          <p className="font-body">
            Ta kontakt hvis du ønsker å bli medlem, har spørsmål, tilbakemeldinger eller andre ting
            du ønsker å ta opp med klubben. Vi svarer så fort vi kan og vanligvis i løpet av en uke.
          </p>
          <p className="font-body">
            Du kan også nå oss på{' '}
            <a href="mailto:hei@sbsk.no" className="underline">
              hei@sbsk.no
            </a>
            , eller i{' '}
            <a
              href="https://www.facebook.com/groups/1699569943629396"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Facebook-gruppa vår
            </a>
            .
          </p>
        </div>

        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Label and field are siblings, not label-wraps-field: `FieldError` sits in this
              div too, and nesting it inside the `<label>` would fold its text into the
              field's accessible name the moment an error appears — "Navn Navn er påkrevd" on
              every future tab-in. `aria-describedby` is the association that is meant to
              carry the message instead. */}
          <div className="flex w-full flex-col gap-1">
            <label htmlFor="name" className="font-body text-white">
              Navn
            </label>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              placeholder="Ditt navn"
              value={values.name}
              onChange={handleChange('name')}
              onBlur={handleBlur('name')}
              invalid={!!errors.name}
              valid={validFields.name}
              disabled={loading}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && <FieldError id="name-error">{errors.name}</FieldError>}
          </div>

          <div className="flex w-full flex-col gap-1">
            <label htmlFor="email" className="font-body text-white">
              E-post
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="deg@epost.no"
              value={values.email}
              onChange={handleChange('email')}
              onBlur={handleBlur('email')}
              invalid={!!errors.email}
              valid={validFields.email}
              disabled={loading}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && <FieldError id="email-error">{errors.email}</FieldError>}
          </div>

          <div className="flex w-full flex-col gap-1">
            <label htmlFor="message" className="font-body text-white">
              Melding
            </label>
            <Textarea
              id="message"
              name="message"
              placeholder="Skriv din melding her..."
              value={values.message}
              onChange={handleChange('message')}
              onBlur={handleBlur('message')}
              invalid={!!errors.message}
              valid={validFields.message}
              disabled={loading}
              aria-describedby={errors.message ? 'message-error' : undefined}
            />
            {errors.message && <FieldError id="message-error">{errors.message}</FieldError>}
          </div>

          {apiError && <Alert>{apiError}</Alert>}
          {success && <Alert tone="success">{SUCCESS_MESSAGE}</Alert>}

          <Button
            type="submit"
            variant="primary"
            size="md"
            icon="right"
            loading={loading}
            disabled={!isValid}
          >
            Send melding
          </Button>

          <p className="font-body text-sm text-white/80">
            Meldingen din lagres slik at klubben kan svare deg.
          </p>
        </form>
      </div>
    </div>
  );
}
