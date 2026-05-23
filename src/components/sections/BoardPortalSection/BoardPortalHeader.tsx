import { type Profile } from '../../../supabase/queryHelpers/getProfil';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/Buttons';

export default function BoardLandingHeader({ boardmember }: { boardmember: Profile }) {
  const navigate = useNavigate();
  return (
    <div className="bg-darkestblue mx-auto flex w-full max-w-150 flex-col items-start gap-6 px-2 py-12 md:max-w-200">
      <div className="flex flex-col gap-6">
        {!boardmember.name && (
          <h1 className="font-heading text-bold text-3xl text-white lg:text-4xl">
            Velkommen til styreportalen!
          </h1>
        )}
        {boardmember.name && (
          <h1 className="font-heading text-bold text-3xl text-white lg:text-4xl">
            Velkommen, {boardmember.name}!
          </h1>
        )}
        <p className="text-regular text-left text-lg text-white">
          Her har du tilgang til din egen profil og andre styrerelatert innhold som medlemslister og
          kan lett finn veien til innholdsredigering.
        </p>
      </div>
      <div className="flex w-full flex-col items-start gap-4">
        <Button onClick={() => navigate('/studio')} variant="primary" size="lg" icon="right">
          Gå til innholdsredigering
        </Button>
      </div>
    </div>
  );
}
