import { useState } from 'react';
import { Panel } from '../../ui/Panel';
import { Alert } from '../../ui/Alert';
import { Button } from '../../ui/Buttons';
import { BadgeTile } from '../../ui/BadgeTile';
import { Dialog } from '../../ui/Dialog';
import { badgeText } from '../../../content/badges';
import { orderBadges, progressText } from '../../../utils/badges';
import type { MyBadge } from '../../../supabase/queryHelpers/badges';

const dateFormat = new Intl.DateTimeFormat('nb-NO', { dateStyle: 'long' });

/**
 * "Merker" on Min side: every badge, earned or still to earn. Each tile opens a short
 * description. Manual badges the member has not been given are left out of the locked set:
 * there is nothing they can work toward.
 */
export default function BadgeGrid({ badges }: { badges: MyBadge[] | null }) {
  const [open, setOpen] = useState<MyBadge | null>(null);
  const shown = orderBadges(
    (badges ?? []).filter((badge) => badge.awarded_at || badge.kind === 'auto'),
  );
  const earnedCount = shown.filter((badge) => badge.awarded_at).length;
  const text = open ? badgeText(open.slug) : null;

  return (
    <Panel title="Merker">
      {badges === null ? (
        <Alert tone="warning">Vi fikk ikke hentet merkene dine akkurat nå.</Alert>
      ) : (
        <>
          <p>
            {earnedCount === 0
              ? 'Sjekk inn på et arrangement for å få ditt første merke.'
              : `Du har ${earnedCount} av ${shown.length} merker.`}
          </p>
          <ul className="xs:grid-cols-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {shown.map((badge) => (
              <li key={badge.slug} className="flex">
                <BadgeTile
                  className="w-full"
                  name={badgeText(badge.slug).name.nb}
                  earned={Boolean(badge.awarded_at)}
                  detail={
                    badge.awarded_at
                      ? dateFormat.format(new Date(badge.awarded_at))
                      : progressText(badge)
                  }
                  onClick={() => setOpen(badge)}
                />
              </li>
            ))}
          </ul>
        </>
      )}
      {open && text && (
        <Dialog title={text.name.nb} onClose={() => setOpen(null)}>
          <div className="flex flex-col gap-3 text-white">
            <p>{text.description.nb}</p>
            <p className="text-sm">
              {open.awarded_at
                ? `Oppnådd ${dateFormat.format(new Date(open.awarded_at))}.`
                : `Ikke oppnådd ennå: ${progressText(open)}.`}
            </p>
            <Button
              type="button"
              variant="primary"
              size="md"
              className="self-end"
              onClick={() => setOpen(null)}
            >
              Lukk
            </Button>
          </div>
        </Dialog>
      )}
    </Panel>
  );
}
