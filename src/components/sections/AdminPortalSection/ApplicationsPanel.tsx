import { useState } from 'react';
import { useRevalidator } from 'react-router-dom';
import { Alert } from '../../ui/Alert';
import { Button } from '../../ui/Buttons';
import { Panel } from '../../ui/Panel';
import {
  approveApplication,
  rejectApplication,
  type Application,
} from '../../../supabase/queryHelpers/membershipApplications';
import { CLUB_EMAIL } from '../../../utils/contact';
import { welcomeMailto } from '../../../utils/membershipApplication';

type ApplicationsPanelProps = {
  /** Open applications; null when they could not be read. */
  applications: Application[] | null;
  /** For tests; the real RPCs otherwise. */
  approve?: (id: string) => Promise<unknown>;
  reject?: (id: string) => Promise<void>;
};

const dateFormat = new Intl.DateTimeFormat('nb-NO', { dateStyle: 'medium' });

function errorText(error: unknown): string {
  return typeof error === 'object' && error !== null && 'message' in error
    ? String((error as { message: unknown }).message)
    : '';
}

const isNotPending = (error: unknown) => errorText(error).includes('not_pending');

function messageFor(error: unknown): string {
  const text = errorText(error);
  if (text.includes('already_member')) {
    return 'Denne e-posten står allerede i medlemslisten. Avslå søknaden, eller la den ligge.';
  }
  if (text.includes('not_pending')) return 'Noen i styret har allerede behandlet søknaden.';
  return 'Kunne ikke lagre valget. Prøv igjen.';
}

/**
 * "Søknader" at the top of the member list, only while there is something to decide.
 * Godkjenn puts the applicant on the register; the board then sends the welcome email from
 * their own mail app (the site sends no email of its own).
 */
export default function ApplicationsPanel({
  applications,
  approve = approveApplication,
  reject = rejectApplication,
}: ApplicationsPanelProps) {
  const revalidator = useRevalidator();
  const [busy, setBusy] = useState<{ id: string; approving: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Everyone approved while the page is open, each with their own welcome link: approved
  // applications are not listed again, so a link must not vanish with the next decision.
  const [approved, setApproved] = useState<Application[]>([]);
  const [decided, setDecided] = useState<ReadonlySet<string>>(() => new Set());

  if (applications === null) {
    return <Alert tone="warning">Søknadene kunne ikke hentes akkurat nå.</Alert>;
  }
  const open = applications.filter((application) => !decided.has(application.id));
  if (open.length === 0 && approved.length === 0) return null;

  const decide = async (application: Application, yes: boolean) => {
    setBusy({ id: application.id, approving: yes });
    setError(null);
    try {
      if (yes) await approve(application.id);
      else await reject(application.id);
      setDecided((prev) => new Set(prev).add(application.id));
      if (yes) setApproved((prev) => [...prev, application]);
      revalidator.revalidate();
    } catch (err) {
      setError(messageFor(err));
      // Someone else decided it: reload, so the stale row and its buttons go.
      if (isNotPending(err)) revalidator.revalidate();
    } finally {
      setBusy(null);
    }
  };

  return (
    <Panel title={`Søknader (${open.length})`} tone="orange">
      {approved.map((member) => (
        <Alert key={member.id} tone="success">
          {member.name} {member.surname} står nå i medlemslisten.{' '}
          <a
            href={welcomeMailto(member)}
            aria-label={`Send velkomst-e-post til ${member.name} ${member.surname}`}
            className="underline"
          >
            Send velkomst-e-post
          </a>{' '}
          med lenke til å lage profil.
        </Alert>
      ))}
      {error && <Alert>{error}</Alert>}
      <ul className="flex flex-col">
        {open.map((application) => {
          const fullName = `${application.name} ${application.surname}`.trim();
          return (
            <li
              key={application.id}
              className="border-darkestblue/30 flex flex-col gap-2 border-t py-3 first:border-t-0 first:pt-0 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <p className="font-heading font-bold break-words">{fullName}</p>
                <p className="text-sm break-all">{application.email}</p>
                <p className="text-sm">
                  Søkte {dateFormat.format(new Date(application.created_at))}
                  {application.birth_year ? ` · født ${application.birth_year}` : ''}
                </p>
                {application.message && (
                  <p className="text-sm break-words whitespace-pre-line">«{application.message}»</p>
                )}
              </div>
              <div className="flex flex-none flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="xs"
                  aria-label={`Godkjenn ${fullName}`}
                  loading={busy?.id === application.id && busy.approving}
                  disabled={busy !== null && !(busy.id === application.id && busy.approving)}
                  onClick={() => void decide(application, true)}
                >
                  Godkjenn
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  aria-label={`Avslå ${fullName}`}
                  loading={busy?.id === application.id && !busy.approving}
                  disabled={busy !== null && !(busy.id === application.id && !busy.approving)}
                  onClick={() => void decide(application, false)}
                >
                  Avslå
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-sm">
        Avslår dere, kan dere svare søkeren fra {CLUB_EMAIL}. Søknader slettes 30 dager etter at de
        er godkjent, og 90 dager etter at de er avslått eller sendt inn uten svar.
      </p>
    </Panel>
  );
}
