import { useMemo, useState } from 'react';
import { useRevalidator, useSearchParams } from 'react-router-dom';
import { Alert } from '../../ui/Alert';
import { Button } from '../../ui/Buttons';
import { buttonClasses } from '../../ui/buttonClasses';
import { Chip } from '../../ui/Chip';
import EmptyState from '../../ui/EmptyState';
import { Input } from '../../ui/Input';
import { Segmented } from '../../ui/Segmented';
import { Tag } from '../../ui/Tag';
import MemberForm from '../BoardPortalSection/MemberForm';
import MarkPaidDialog from './MarkPaidDialog';
import MemberStatusDialog from './MemberStatusDialog';
import { createMember } from '../../../supabase/queryHelpers/createMember';
import { editMember } from '../../../supabase/queryHelpers/editMember';
import { markMembershipPaid } from '../../../supabase/queryHelpers/markMembershipPaid';
import { setMemberStatus } from '../../../supabase/queryHelpers/setMemberStatus';
import type { Member } from '../../../supabase/queryHelpers/getMember';
import type { SeasonStatus } from '../../../supabase/queryHelpers/getSeasonStatus';
import {
  compareMemberNames,
  currentSeason,
  filterMembers,
  memberMatches,
  membersCsv,
  paymentReminderMailto,
  type MemberFilter,
} from '../../../utils/membership';

/** Shown instead of payment status when the `member_season_status` read fails. */
export const PAYMENTS_UNAVAILABLE =
  'Betalingsstatus kunne ikke hentes akkurat nå. Medlemslisten vises uten den. Prøv å laste siden på nytt.';

const NO_STATUS: Record<string, SeasonStatus> = {};

type AdminMembersSectionProps = {
  members: Member[];
  /** `null` when the payment view could not be read: payments are then hidden, not guessed. */
  seasonStatus: Record<string, SeasonStatus> | null;
};

// The filter lives in the URL (`?status=deaktivert&betalt=nei&styret=ja`) so the overview's
// numbers can link straight into a filtered list, and a filtered list can be shared on the board.
const statusParam: Record<string, MemberFilter> = { deaktivert: 'disabled', alle: 'all' };
const statusValue: Record<MemberFilter, string | null> = {
  active: null,
  disabled: 'deaktivert',
  all: 'alle',
};

const filterOptions = [
  { value: 'active', label: 'Aktive' },
  { value: 'disabled', label: 'Deaktiverte' },
  { value: 'all', label: 'Alle' },
] as const;

type OpenDialog =
  | { kind: 'edit'; member?: Member }
  | { kind: 'paid'; member: Member }
  | { kind: 'status'; member: Member }
  | null;

function downloadCsv(csv: string, filename: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * `/styreportal/medlemmer`: the register. Filter by status and payment, search, and act on a
 * member in place: edit, tick as paid, deactivate. The CSV and the reminder use the current
 * filter, so "Ikke betalt" plus "Send påminnelse" is the treasurer's whole routine.
 */
export default function AdminMembersSection({
  members,
  seasonStatus: seasonStatusOrNull,
}: AdminMembersSectionProps) {
  const season = currentSeason();
  const paymentsKnown = seasonStatusOrNull !== null;
  const seasonStatus = seasonStatusOrNull ?? NO_STATUS;
  const revalidator = useRevalidator();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState<OpenDialog>(null);

  const filter = statusParam[params.get('status') ?? ''] ?? 'active';
  const unpaidOnly = paymentsKnown && params.get('betalt') === 'nei';
  const boardOnly = params.get('styret') === 'ja';

  const setParam = (key: string, value: string | null) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === null) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );

  const visible = useMemo(
    () =>
      filterMembers(members, seasonStatus, filter, { unpaidOnly, boardOnly })
        .filter((m) => memberMatches(m, query))
        .sort(compareMemberNames),
    [members, seasonStatus, filter, unpaidOnly, boardOnly, query],
  );

  const unpaidEmails = (paymentsKnown ? visible : [])
    .filter((m) => m.status === 'active' && !seasonStatus[m.id]?.paid)
    .map((m) => m.email);

  const done = () => revalidator.revalidate();

  return (
    <section aria-labelledby="members-heading" className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <h2
            id="members-heading"
            className="font-heading text-h2 text-darkblue font-bold dark:text-white"
          >
            Medlemsliste
          </h2>
          <p className="font-body text-darkestblue dark:text-white">
            {visible.length} av {members.length} medlemmer vises.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            size="sm"
            icon="add"
            onClick={() => setDialog({ kind: 'edit' })}
          >
            Legg til medlem
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-darkblue dark:text-white"
            disabled={visible.length === 0 || !paymentsKnown}
            onClick={() =>
              downloadCsv(membersCsv(visible, seasonStatus, season), `medlemmer-${season}.csv`)
            }
          >
            Last ned CSV
          </Button>
          {unpaidEmails.length > 0 && (
            <a
              href={paymentReminderMailto(unpaidEmails, season)}
              className={buttonClasses({
                variant: 'outline',
                size: 'sm',
                className: 'text-darkblue dark:text-white',
              })}
            >
              Send betalingspåminnelse ({unpaidEmails.length})
            </a>
          )}
        </div>
      </div>

      {!paymentsKnown && <Alert tone="warning">{PAYMENTS_UNAVAILABLE}</Alert>}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            label="Vis medlemmer"
            options={filterOptions}
            value={filter}
            onChange={(value) => setParam('status', statusValue[value])}
          />
          {paymentsKnown && (
            <Chip
              className="normal-case"
              active={unpaidOnly}
              onClick={() => setParam('betalt', unpaidOnly ? null : 'nei')}
            >
              Ikke betalt {season}
            </Chip>
          )}
          <Chip active={boardOnly} onClick={() => setParam('styret', boardOnly ? null : 'ja')}>
            Styret
          </Chip>
        </div>
        <div className="md:w-80">
          <Input
            type="search"
            icon="search"
            aria-label="Søk etter medlem"
            placeholder="Søk etter navn, e-post eller telefon"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          variant="inline"
          headingLevel={3}
          title={members.length === 0 ? 'Ingen medlemmer' : 'Ingen treff'}
          body={
            members.length === 0
              ? 'Det finnes ingen medlemmer i registeret ennå.'
              : 'Ingen medlemmer passer filteret eller søket.'
          }
        />
      ) : (
        <ul
          aria-label="Medlemmer"
          className="flex flex-col border-t border-gray-300 dark:border-white/20"
        >
          {visible.map((member) => {
            const paid = seasonStatus[member.id]?.paid ?? false;
            const active = member.status === 'active';
            const fullName = `${member.name} ${member.surname}`.trim();
            return (
              <li
                key={member.id}
                aria-label={fullName}
                className="text-darkestblue flex flex-col gap-3 border-b border-gray-300 py-4 md:flex-row md:items-center md:justify-between dark:border-white/20 dark:text-white"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="font-heading font-bold break-words capitalize">{fullName}</p>
                  <p className="font-body text-sm break-all">
                    {member.email}
                    {member.phone && <span className="whitespace-nowrap"> · {member.phone}</span>}
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {active ? (
                      paymentsKnown && (
                        <Tag tone={paid ? 'blue' : 'orange'}>
                          {paid ? `Betalt ${season}` : 'Ikke betalt'}
                        </Tag>
                      )
                    ) : (
                      <Tag tone="orange">Deaktivert</Tag>
                    )}
                    {member.is_admin && <Tag>Styret</Tag>}
                    {!member.supabase_id && <Tag tone="orange">Ingen konto</Tag>}
                  </div>
                  {!active && member.disabled_reason && (
                    <p className="font-body text-sm">Årsak: {member.disabled_reason}</p>
                  )}
                </div>
                <div className="flex flex-none flex-wrap gap-2">
                  <Button
                    variant="tertiary"
                    size="xs"
                    aria-label={`Rediger ${fullName}`}
                    onClick={() => setDialog({ kind: 'edit', member })}
                  >
                    Rediger
                  </Button>
                  {active && paymentsKnown && !paid && (
                    <Button
                      variant="primary"
                      size="xs"
                      aria-label={`Marker ${fullName} som betalt`}
                      onClick={() => setDialog({ kind: 'paid', member })}
                    >
                      Marker som betalt
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="xs"
                    aria-label={`${active ? 'Deaktiver' : 'Aktiver'} ${fullName}`}
                    onClick={() => setDialog({ kind: 'status', member })}
                  >
                    {active ? 'Deaktiver' : 'Aktiver'}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {dialog?.kind === 'edit' && (
        <MemberForm
          member={dialog.member}
          onSubmitMember={async (values) => {
            const fields = {
              name: values.name,
              surname: values.surname,
              phone: values.phone,
              email: values.email,
              is_admin: values.is_admin,
            };
            if (values.id) await editMember({ id: values.id, ...fields });
            else await createMember(fields);
            done();
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === 'paid' && (
        <MarkPaidDialog
          member={dialog.member}
          season={season}
          onSubmit={async (payment) => {
            await markMembershipPaid(payment);
            done();
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === 'status' && (
        <MemberStatusDialog
          member={dialog.member}
          onSubmit={async (status, reason) => {
            await setMemberStatus(dialog.member.id, status, reason);
            done();
          }}
          onClose={() => setDialog(null)}
        />
      )}
    </section>
  );
}
