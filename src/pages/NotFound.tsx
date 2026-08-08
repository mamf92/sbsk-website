import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Buttons';

// No <main> here: the shell in App.tsx already owns <main id="main">, and nesting a
// second one made this a duplicate landmark (#74).
export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="dark:bg-darkestblue flex min-h-[60vh] flex-col items-center justify-center gap-8 bg-white px-4 py-16 text-center">
      {/* Decorative: the <h1> below carries the same message for assistive tech. */}
      <p aria-hidden="true" className="font-heading text-orange text-6xl font-bold sm:text-8xl">
        404
      </p>
      <div className="flex max-w-150 flex-col gap-4">
        <h1 className="font-heading text-darkestblue text-h1 font-bold dark:text-white">
          Finner ikke siden
        </h1>
        <p className="font-body text-darkestblue text-base dark:text-white">
          Siden du leter etter finnes ikke, eller så har den flyttet på seg. Sjekk at adressen er
          riktig, eller gå tilbake til forsiden.
        </p>
      </div>
      <Button onClick={() => navigate('/')} variant="primary" size="lg" icon="right">
        Til forsiden
      </Button>
    </div>
  );
}
