import { useLoaderData } from 'react-router-dom';
import MembershipApplicationSection from '../components/sections/MembershipApplicationSection';
import { PagePlaceholder } from '../components/ui/PagePlaceholder';
import { CLUB_EMAIL } from '../utils/contact';
import { memberPortalEnabled } from '../utils/featureFlags';
import type { becomeAMemberLoader } from '../loaders/become-a-member-loader';

/** `/bli-medlem`: the application form once member sign-up is on; until then, how to join. */
export default function BecomeAMember() {
  const data = useLoaderData() as Awaited<ReturnType<typeof becomeAMemberLoader>> | undefined;
  if (memberPortalEnabled) {
    return <MembershipApplicationSection nextGameNight={data?.nextGameNight ?? null} />;
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
