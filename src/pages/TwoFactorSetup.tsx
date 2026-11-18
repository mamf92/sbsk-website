import { useLoaderData } from 'react-router-dom';
import TwoFactorSection from '../components/sections/TwoFactorSection';
import type { TwoFactorSetupData } from '../loaders/two-factor-loaders';

/**
 * `/to-faktor/oppsett`: connect an authenticator app (security plan S2a). The QR code arrives
 * from Supabase as an SVG data URI and is shown with `<img>`; `data:` is already allowed in
 * `img-src`. The secret is shown as text too, for password managers and for anyone who
 * cannot scan.
 */
export default function TwoFactorSetup() {
  const { enrollment, next, addingBackup } = useLoaderData() as TwoFactorSetupData;

  return (
    <div className="dark:bg-darkestblue flex h-full min-h-[85vh] w-full flex-col items-center bg-white">
      <TwoFactorSection
        title={addingBackup ? 'Legg til en reserve' : 'Slå på tofaktor-innlogging'}
        intro={
          <>
            <p>
              {addingBackup
                ? 'En ekstra app eller passordbehandler gjør at du kommer inn selv om du mister telefonen.'
                : 'Som styremedlem logger du inn med passord og en kode fra en app på telefonen. Det beskytter medlemsregisteret om passordet ditt skulle komme på avveie.'}
            </p>
            <p>
              En autentiseringsapp lager en ny sekssifret kode hvert 30. sekund. Gratis apper som
              fungerer: Google Authenticator, Microsoft Authenticator, eller passordbehandleren din.
            </p>
            <ol className="list-decimal pl-5">
              <li>Åpne appen og velg å legge til en konto.</li>
              <li>Skann QR-koden, eller skriv inn nøkkelen under.</li>
              <li>Skriv inn koden appen viser.</li>
            </ol>
          </>
        }
        factorId={enrollment.factorId}
        next={next}
        submitLabel="Slå på"
      >
        <div className="flex flex-col items-center gap-3 sm:px-8">
          <img
            src={enrollment.qrCode}
            alt="QR-kode for autentiseringsapp"
            width={192}
            height={192}
            className="border border-black bg-white p-2"
          />
          <p className="font-body text-center text-sm text-white">
            Nøkkel:{' '}
            <code className="bg-darkestblue px-1 font-mono break-all select-all">
              {enrollment.secret}
            </code>
          </p>
        </div>
      </TwoFactorSection>
    </div>
  );
}
