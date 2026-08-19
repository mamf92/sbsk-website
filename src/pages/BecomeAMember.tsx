import { PagePlaceholder } from '../components/ui/PagePlaceholder';

export default function BecomeAMember() {
  return (
    <PagePlaceholder
      title="Bli medlem"
      description="Innmeldingen er ikke klar på nett ennå. Stikk innom en spillkveld eller send oss en e-post på hei@sbsk.no, så ordner vi det."
      // The membership CTA is this page, so only the calendar is worth offering.
      actions={[{ label: 'Se kalender', to: '/kalender' }]}
    />
  );
}
