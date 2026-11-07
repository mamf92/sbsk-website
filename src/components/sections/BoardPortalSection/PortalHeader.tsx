import { type Profile } from '../../../supabase/queryHelpers/getProfile';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/Buttons';

export default function PortalHeader({ boardmember }: { boardmember: Profile }) {
  const navigate = useNavigate();
  return (
    <div className="bg-header on-dark text-fg max-w-form md:max-w-content mx-auto flex w-full flex-col items-start gap-6 px-2 py-12">
      <div className="flex flex-col gap-6">
        {!boardmember.name && (
          <h1 className="font-heading text-heading text-h1 font-bold">
            Velkommen til styreportalen!
          </h1>
        )}
        {boardmember.name && (
          <h1 className="font-heading text-heading text-h1 font-bold">
            Velkommen, {boardmember.name}!
          </h1>
        )}
        <p className="text-fg text-left text-lg font-normal">
          Her har du tilgang til din egen profil og andre styrerelatert innhold som medlemslister og
          kan lett finn veien til innholdsredigering.
        </p>
      </div>
      <div className="flex w-full flex-col items-start gap-4">
        <Button onClick={() => navigate('/studio')} variant="primary" size="md" icon="right">
          Gå til innholdsredigering
        </Button>
      </div>
    </div>
  );
}
