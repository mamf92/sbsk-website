import { useId, useState } from 'react';
import { Alert } from '../../ui/Alert';
import { Button } from '../../ui/Buttons';
import { Dialog } from '../../ui/Dialog';
import { Input } from '../../ui/Input';
import type { Member } from '../../../supabase/queryHelpers/getMember';

type MemberStatusDialogProps = {
  member: Member;
  onSubmit: (status: 'active' | 'disabled', reason?: string) => Promise<void>;
  onClose: () => void;
};

/** Postgres raises `last_admin` when the change would leave the club without an active admin. */
function messageFor(error: unknown): string {
  // supabase-js returns a plain PostgrestError object, not an Error instance.
  const text =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error ?? '');
  if (text.includes('last_admin')) {
    return 'Klubben må ha minst én aktiv administrator. Gjør en annen til administrator først.';
  }
  return 'Kunne ikke lagre endringen. Prøv igjen.';
}

/**
 * Disable or re-enable a member. Disabling is the "removal" the plan asks for: the member can no
 * longer log in, but their history (payments, check-ins) is kept. Erasing a person entirely is a
 * GDPR request and a separate flow.
 */
export default function MemberStatusDialog({ member, onSubmit, onClose }: MemberStatusDialogProps) {
  const reasonId = useId();
  const disabling = member.status === 'active';
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const name = `${member.name} ${member.surname}`.trim();

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const reason = String(new FormData(e.currentTarget).get('reason') ?? '');
    setSubmitError(null);
    setSubmitting(true);
    try {
      await onSubmit(disabling ? 'disabled' : 'active', disabling ? reason : undefined);
      onClose();
    } catch (error) {
      setSubmitError(messageFor(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog title={disabling ? `Deaktiver ${name}?` : `Aktiver ${name}?`} onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <p className="font-body text-white">
          {disabling
            ? 'Medlemmet kan ikke lenger logge inn. Betalinger og innsjekk beholdes, og du kan aktivere medlemmet igjen senere.'
            : 'Medlemmet kan logge inn igjen og vises i medlemslisten.'}
        </p>
        {disabling && (
          <div className="flex flex-col gap-1">
            <label htmlFor={reasonId} className="font-body text-white">
              Årsak (valgfritt, bare for styret)
            </label>
            <Input
              id={reasonId}
              name="reason"
              maxLength={500}
              placeholder="For eksempel: Flyttet"
            />
          </div>
        )}
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
          <Button
            type="submit"
            variant={disabling ? 'danger' : 'primary'}
            size="md"
            loading={submitting}
          >
            {disabling ? 'Deaktiver' : 'Aktiver'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
