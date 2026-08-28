import { useRef, useState } from 'react';
import { Alert, FieldError } from '../ui/Alert';
import { Button } from '../ui/Buttons';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { createContactMessage } from '../../supabase/queryHelpers/createContactMessage';
import { contactSchema, type ContactValues } from '../../schemas/contact';
import { useAutofillSync } from '../../hooks/useAutofillSync';

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
 * same `bg-darkblue surface-dark max-w-form` framed panel `LoginSection` and `RegisterSection`
 * use, sitting on the page's own `bg-white dark:bg-darkestblue` background (`ContactUs.tsx`)
 * rather than spanning full width on its own navy backdrop.
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
 *
 * `honeypot` (#202) is a field no real visitor can see or reach — zero-size, `tabIndex={-1}`,
 * `aria-hidden` — that a bot filling every input in the DOM will fill anyway. It isn't
 * `display:none`/`visibility:hidden`, since a bot that reads computed style would skip it same
 * as a screen reader does; zero size and `opacity-0` are invisible to both without being
 * detectable as a trap. A non-empty value short-circuits `handleSubmit` before validation or
 * the API call, and reports the same success the sender would have gotten otherwise — reacting
 * differently would tell a scripted sender its message was caught and worth retrying past.
 */
export default function ContactSection() {
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<ContactValues>(EMPTY_VALUES);
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [validFields, setValidFields] = useState<Partial<Record<FieldName, boolean>>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // A saved-password-style autofill can write straight into the DOM before this component's
  // first paint, without ever firing `change` — so `values` stays the empty state below and
  // `isValid` never sees what is actually sitting in the fields until the user edits something
  // by hand. One mount-time read of the form's own `FormData` closes that gap.
  useAutofillSync(formRef, ['name', 'email', 'message'], (filled) =>
    setValues((v) => ({ ...v, ...filled })),
  );

  const isValid = contactSchema.safeParse(values).success;

  const handleChange =
    (field: FieldName) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setValues((v) => ({ ...v, [field]: value }));
      setErrors((prev) => without(prev, field));
      setValidFields((prev) => without(prev, field));
    };

  const handleBlur =
    (field: FieldName) => (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      // Read `e.target.value`, not `values[field]`: the same autofill gap `useAutofillSync`
      // closes at mount can also fill a field between renders — the browser's own suggestion
      // dropdown, picked after the page has already painted — and `values` would still be
      // stale for it at the moment this fires. Synced into state here too, so the value this
      // validates is the one the field actually shows.
      const value = e.target.value;
      setValues((v) => (v[field] === value ? v : { ...v, [field]: value }));

      const result = contactSchema.shape[field].safeParse(value);
      setValidFields((prev) => ({ ...prev, [field]: result.success }));
      setErrors((prev) =>
        result.success
          ? without(prev, field)
          : { ...prev, [field]: result.error.issues[0].message },
      );
    };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    setSuccess(false);
    setApiError(null);

    if (honeypot) {
      setValues(EMPTY_VALUES);
      setHoneypot('');
      setValidFields({});
      setSuccess(true);
      return;
    }

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
    <div className="bg-darkblue surface-dark max-w-form my-4 flex w-full items-center justify-center px-4">
      <div className="flex w-full flex-col gap-8 py-16 md:py-24">
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

        <form ref={formRef} noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Honeypot (#202): zero-size and `opacity-0`, not `display:none`, so a bot that
              checks computed style still finds it fillable. `tabIndex={-1}` and `aria-hidden`
              keep it out of the tab order and the accessibility tree for real visitors. */}
          <div className="h-0 w-0 overflow-hidden opacity-0">
            <label htmlFor="website" aria-hidden="true">
              Nettside
            </label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {/* Label and field are siblings, not label-wraps-field: `FieldError` sits in this
              div too, and nesting it inside the `<label>` would fold its text into the
              field's accessible name the moment an error appears — "Navn Navn er påkrevd" on
              every future tab-in. `aria-describedby` is the association that is meant to
              carry the message instead.

              `gap-2`, not the `gap-1` the label/field pair used to share: `fieldStateShadow`'s
              hard offset shadow reaches 4px below the field, which touched `FieldError`'s text
              directly at `gap-1`. */}
          <div className="flex w-full flex-col gap-2">
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

          <div className="flex w-full flex-col gap-2">
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

          <div className="flex w-full flex-col gap-2">
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

          {/* `variant="disabled"` is cosmetic only — `Buttons.tsx` still needs the `disabled`
              attribute below to actually stop the submit, but without the variant the button
              stayed orange and looked live while every click did nothing. `isValid` covers
              both: it never goes false while `loading` (the values it was computed from are
              already known-valid at that point), so the button never flips grey mid-submit. */}
          <Button
            type="submit"
            variant={isValid ? 'primary' : 'disabled'}
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
