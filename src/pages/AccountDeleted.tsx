import { PagePlaceholder } from '../components/ui/PagePlaceholder';

/** `/konto-slettet`: where "Slett kontoen min" lands once the account is gone. */
export default function AccountDeleted() {
  return (
    <PagePlaceholder
      title="Kontoen din er slettet"
      description="Takk for tiden i klubben. Du er alltid velkommen tilbake på en spillkveld."
      actions={[
        { label: 'Se kalender', to: '/kalender' },
        { label: 'Til forsiden', to: '/' },
      ]}
    />
  );
}
