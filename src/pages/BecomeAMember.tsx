import MembershipApplicationSection from '../components/sections/MembershipApplicationSection';
import { PagePlaceholder } from '../components/ui/PagePlaceholder';
import { CLUB_EMAIL } from '../utils/contact';
import { memberPortalEnabled } from '../utils/featureFlags';

/** `/bli-medlem`: the application form once member sign-up is on; until then, how to join. */
export default function BecomeAMember() {
  if (memberPortalEnabled) {
    return (
      <div className="dark:bg-darkestblue flex h-full min-h-[85vh] w-full flex-col items-center bg-white">
        <MembershipApplicationSection />
      </div>
    );
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
