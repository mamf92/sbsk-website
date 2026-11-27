import { useEffect, useState } from 'react';
import { useLoaderData } from 'react-router-dom';
import MembershipApplicationSection from '../components/sections/MembershipApplicationSection';
import { PagePlaceholder } from '../components/ui/PagePlaceholder';
import { CLUB_EMAIL } from '../utils/contact';
import { memberPortalEnabled } from '../utils/featureFlags';
import type { becomeAMemberLoader } from '../loaders/become-a-member-loader';
import type { CalendarEventTypes } from '../sanity/queryHelpers/events';

/** `/bli-medlem`: the application form once member sign-up is on; until then, how to join. */
export default function BecomeAMember() {
  const data = useLoaderData() as ReturnType<typeof becomeAMemberLoader> | undefined;
  const [nextGameNight, setNextGameNight] = useState<CalendarEventTypes | null>(null);
  // The loader hands over an unawaited promise so the form renders at once; the note fills in
  // whenever it lands (it is only shown after a submit).
  useEffect(() => {
    let current = true;
    data?.nextGameNight.then((event) => {
      if (current) setNextGameNight(event);
    });
    return () => {
      current = false;
    };
  }, [data]);
  if (memberPortalEnabled) {
    return <MembershipApplicationSection nextGameNight={nextGameNight} />;
  }
  return (
    <PagePlaceholder
      title="Bli medlem"
      description={`Innmeldingen er ikke klar på nett ennå. Stikk innom en spillkveld eller send oss en e-post på ${CLUB_EMAIL}, så ordner vi det.`}
      // The membership CTA is this page, so only the calendar is worth offering.
      actions={[{ label: 'Se kalender', to: '/kalender' }]}
    />
  );
}
