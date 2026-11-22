import { useEffect, useState } from 'react';
import { Alert } from '../../ui/Alert';
import { Button } from '../../ui/Buttons';
import { Checkbox } from '../../ui/Checkbox';
import { Dialog } from '../../ui/Dialog';
import { LoadingIndicator } from '../../ui/LoadingIndicator';
import { BADGES, MANUAL_BADGE_SLUGS } from '../../../content/badges';
import {
  getMemberBadges,
  setManualBadges,
  type MemberBadge,
} from '../../../supabase/queryHelpers/badges';
import type { Member } from '../../../supabase/queryHelpers/getMember';

type ManualBadgesDialogProps = {
  member: Member;
  onClose: () => void;
  /** For tests; the real helpers otherwise. */
  load?: (memberId: string) => Promise<MemberBadge[]>;
  save?: (memberId: string, give: string[], takeBack: string[]) => Promise<void>;
};

/**
 * The board gives or takes back the badges no rule can see: volunteering, a board seat,
 * teaching games. Automatic badges are not listed: the database owns those.
 */
export default function ManualBadgesDialog({
  member,
  onClose,
  load = getMemberBadges,
  save = setManualBadges,
}: ManualBadgesDialogProps) {
  const name = `${member.name} ${member.surname}`.trim();
  const [had, setHad] = useState<Set<string> | null>(null);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let current = true;
    load(member.id)
      .then((rows) => {
        if (!current) return;
        const manual = new Set(
          rows.map((row) => row.badge_slug).filter((slug) => MANUAL_BADGE_SLUGS.includes(slug)),
        );
        setHad(manual);
        setChosen(new Set(manual));
      })
      .catch(() => current && setLoadError(true));
    return () => {
      current = false;
    };
  }, [load, member.id]);

  const toggle = (slug: string, on: boolean) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (on) next.add(slug);
      else next.delete(slug);
      return next;
    });

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!had) return;
    const give = [...chosen].filter((slug) => !had.has(slug));
    const takeBack = [...had].filter((slug) => !chosen.has(slug));
    setSaveError(null);
    setSaving(true);
    try {
      if (give.length || takeBack.length) await save(member.id, give, takeBack);
      onClose();
    } catch {
      setSaveError('Kunne ikke lagre merkene. Prøv igjen.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog title={`Merker for ${name}`} onClose={onClose}>
      <form className="flex flex-col gap-4 text-white" onSubmit={handleSubmit}>
        <p className="font-body">
          Merker for innsjekk og medlemskap kommer av seg selv. Disse deler styret ut.
        </p>
        {loadError ? (
          <Alert>Kunne ikke hente merkene til {name}. Lukk og prøv igjen.</Alert>
        ) : had === null ? (
          <LoadingIndicator />
        ) : (
          <fieldset className="flex flex-col gap-3">
            <legend className="sr-only">Merker styret deler ut</legend>
            {MANUAL_BADGE_SLUGS.map((slug) => (
              <label key={slug} className="flex items-start gap-3">
                <Checkbox
                  checked={chosen.has(slug)}
                  onChange={(e) => toggle(slug, e.target.checked)}
                  className="mt-1"
                />
                <span className="flex flex-col">
                  <span className="font-heading font-bold">{BADGES[slug].name.nb}</span>
                  <span className="text-sm">{BADGES[slug].description.nb}</span>
                </span>
              </label>
            ))}
          </fieldset>
        )}
        {saveError && <Alert>{saveError}</Alert>}
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
            variant="primary"
            size="md"
            loading={saving}
            disabled={had === null}
          >
            Lagre merker
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
