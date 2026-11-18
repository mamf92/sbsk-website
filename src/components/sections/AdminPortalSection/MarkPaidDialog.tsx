import { useId, useState } from 'react';
import { Alert, FieldError } from '../../ui/Alert';
import { Button } from '../../ui/Buttons';
import { Dialog } from '../../ui/Dialog';
import { Input } from '../../ui/Input';
import { Dropdown } from '../../ui/Dropdown';
import { manualPaymentSchema } from '../../../schemas/payment';
import type { Member } from '../../../supabase/queryHelpers/getMember';
import type {
  ManualPayment,
  ManualPaymentMethod,
} from '../../../supabase/queryHelpers/markMembershipPaid';

const methods = [
  { value: 'bank', label: 'Bank' },
  { value: 'vipps', label: 'Vipps' },
  { value: 'cash', label: 'Kontant' },
  { value: 'manual', label: 'Annet' },
] as const satisfies readonly { value: ManualPaymentMethod; label: string }[];

type FieldName = 'amountNok' | 'paidOn' | 'note';

type MarkPaidDialogProps = {
  member: Member;
  season: number;
  onSubmit: (payment: ManualPayment) => Promise<void>;
  onClose: () => void;
};

function todayInOslo(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Oslo' }).format(new Date());
}

/**
 * The board's manual "paid" tick. Records a payment row rather than flipping a flag, so the
 * treasurer can see when, how and how much, and the audit log can see who. The fee amount is
 * not known yet, so the field starts empty rather than guessing a price.
 */
export default function MarkPaidDialog({ member, season, onSubmit, onClose }: MarkPaidDialogProps) {
  const ids = { amountNok: useId(), paidOn: useId(), note: useId() };
  const [method, setMethod] = useState<ManualPaymentMethod>('bank');
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = manualPaymentSchema.safeParse({
      amountNok: form.get('amountNok'),
      method,
      paidOn: form.get('paidOn'),
      note: form.get('note') || undefined,
    });
    if (!parsed.success) {
      const next: Partial<Record<FieldName, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as FieldName;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
    setSubmitError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        memberId: member.id,
        payerName: `${member.name} ${member.surname}`.trim(),
        season,
        ...parsed.data,
      });
      onClose();
    } catch {
      setSubmitError('Kunne ikke registrere betalingen. Prøv igjen.');
    } finally {
      setSubmitting(false);
    }
  };

  const field = (name: FieldName, label: string, input: React.ReactElement) => (
    <div className="flex flex-col gap-1">
      <label htmlFor={ids[name]} className="font-body text-white">
        {label}
      </label>
      {input}
      {errors[name] && <FieldError id={`${ids[name]}-error`}>{errors[name]}</FieldError>}
    </div>
  );

  const described = (name: FieldName) => ({
    id: ids[name],
    name,
    invalid: Boolean(errors[name]),
    'aria-describedby': errors[name] ? `${ids[name]}-error` : undefined,
  });

  return (
    <Dialog title="Marker som betalt" onClose={onClose}>
      <p className="font-body text-white">
        {member.name} {member.surname}, kontingent {season}.
      </p>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {field(
          'amountNok',
          'Beløp (kr)',
          <Input {...described('amountNok')} inputMode="numeric" autoFocus />,
        )}
        <div className="flex flex-col gap-1">
          <span className="font-body text-white">Betalt med</span>
          {/* Dropdown, not Segmented: its white trigger reads on the dialog's navy, where
              Segmented's dark text does not. */}
          <Dropdown
            label="Betalt med"
            options={methods}
            value={method}
            onChange={setMethod}
            className="w-fit"
          />
        </div>
        {field(
          'paidOn',
          'Dato',
          <Input {...described('paidOn')} type="date" defaultValue={todayInOslo()} />,
        )}
        {field('note', 'Notat (valgfritt)', <Input {...described('note')} maxLength={500} />)}
        {submitError && <Alert>{submitError}</Alert>}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="tertiary"
            size="md"
            className="border border-white/50"
            onClick={onClose}
          >
            Avbryt
          </Button>
          <Button type="submit" variant="primary" size="md" loading={submitting}>
            Marker som betalt
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
