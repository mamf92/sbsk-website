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

function messageFor(error: unknown): string {
  const text =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : '';
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
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [approved, setApproved] = useState<Application | null>(null);
  const [decided, setDecided] = useState<ReadonlySet<string>>(() => new Set());

  if (applications === null) {
    return <Alert tone="warning">Søknadene kunne ikke hentes akkurat nå.</Alert>;
  }
  const open = applications.filter((application) => !decided.has(application.id));
  if (open.length === 0 && !approved) return null;

  const decide = async (application: Application, yes: boolean) => {
    setBusy(application.id);
    setError(null);
    setApproved(null);
    try {
      if (yes) await approve(application.id);
      else await reject(application.id);
      setDecided((prev) => new Set(prev).add(application.id));
      if (yes) setApproved(application);
      revalidator.revalidate();
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Panel title={`Søknader (${open.length})`} tone="orange">
      {approved && (
        <Alert tone="success">
          {approved.name} {approved.surname} står nå i medlemslisten.{' '}
          <a href={welcomeMailto(approved)} className="underline">
            Send velkomst-e-post
          </a>{' '}
          med lenke til å lage profil.
        </Alert>
      )}
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
                  loading={busy === application.id}
                  disabled={busy !== null && busy !== application.id}
                  onClick={() => void decide(application, true)}
                >
                  Godkjenn
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  aria-label={`Avslå ${fullName}`}
                  disabled={busy !== null}
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
        Avslår dere, kan dere svare søkeren fra {CLUB_EMAIL}. Behandlede søknader slettes automatisk
        etter 30 dager (godkjent) eller 90 dager (avslått).
      </p>
    </Panel>
  );
}
