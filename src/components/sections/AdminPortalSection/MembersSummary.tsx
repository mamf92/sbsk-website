import { Link } from 'react-router-dom';
import { buttonClasses } from '../../ui/buttonClasses';
import { Panel } from '../../ui/Panel';
import { StatTile } from '../../ui/StatTile';
import type { Member } from '../../../supabase/queryHelpers/getMember';
import type { SeasonStatus } from '../../../supabase/queryHelpers/getSeasonStatus';
import { currentSeason, paymentReminderMailto, summariseMembers } from '../../../utils/membership';

type MembersSummaryProps = {
  members: Member[];
  seasonStatus: Record<string, SeasonStatus>;
};

/** The register at a glance: who is active, who has paid this season, and a one-click
 *  reminder to everyone who has not. Each number links into the members tab, filtered. */
export default function MembersSummary({ members, seasonStatus }: MembersSummaryProps) {
  const season = currentSeason();
  const counts = summariseMembers(members, seasonStatus);
  const unpaidEmails = members
    .filter((m) => m.status === 'active' && !seasonStatus[m.id]?.paid)
    .map((m) => m.email);

  const tile = (to: string, value: number, label: string) => (
    <Link to={to} className="lift focus-visible:outline-focus-ring block focus-visible:outline-2">
      <StatTile value={value} label={label} size="sm" />
    </Link>
  );

  return (
    <Panel title="Medlemmer">
      <div className="grid grid-cols-2 gap-2">
        {tile('/styreportal/medlemmer', counts.active, 'Aktive')}
        {tile('/styreportal/medlemmer?betalt=nei', counts.unpaid, `Ikke betalt ${season}`)}
        {tile('/styreportal/medlemmer', counts.paid, `Betalt ${season}`)}
        {tile('/styreportal/medlemmer?status=deaktivert', counts.disabled, 'Deaktiverte')}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          to="/styreportal/medlemmer"
          className={buttonClasses({ variant: 'primary', size: 'sm' })}
        >
          Se medlemslisten
        </Link>
        {unpaidEmails.length > 0 && (
          <a
            href={paymentReminderMailto(unpaidEmails, season)}
            className={buttonClasses({ variant: 'outline', size: 'sm' })}
          >
            Send betalingspåminnelse ({unpaidEmails.length})
          </a>
        )}
      </div>
    </Panel>
  );
}
