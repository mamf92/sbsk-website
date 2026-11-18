import { useLoaderData } from 'react-router-dom';
import TwoFactorSection from '../components/sections/TwoFactorSection';

/** `/to-faktor`: the second step of an admin sign-in (security plan S2a). */
export default function TwoFactorChallenge() {
  const { factorId, next } = useLoaderData() as { factorId: string; next: string };

  return (
    <div className="dark:bg-darkestblue flex h-full min-h-[85vh] w-full flex-col items-center bg-white">
      <TwoFactorSection
        title="Bekreft at det er deg"
        intro={
          <p className="text-center">
            Styret har tilgang til medlemsregisteret, så vi ber om en kode i tillegg til passordet.
            Åpne autentiseringsappen din og skriv inn koden for Stavanger Brettspillklubb.
          </p>
        }
        factorId={factorId}
        next={next}
        submitLabel="Bekreft"
      />
    </div>
  );
}
