import { type Profile } from '../../../supabase/queryHelpers/getProfile';

export default function MemberPortalHeader({ profile }: { profile: Profile }) {
  return (
    <div className="bg-darkestblue surface-dark max-w-form md:max-w-content mx-auto flex w-full flex-col items-start gap-6 px-2 py-12">
      <div className="flex flex-col gap-6">
        {!profile.name && (
          <h1 className="font-heading text-h1 font-bold text-white">
            Velkommen til medlemsportalen!
          </h1>
        )}
        {profile.name && (
          <h1 className="font-heading text-h1 font-bold text-white">Velkommen, {profile.name}!</h1>
        )}
        <p className="text-left text-lg font-normal text-white">
          Her har du tilgang til din egen profil, og på sikt også rabattkoder, din egen kalender og
          annet medlemsrelatert innhold.
        </p>
      </div>
    </div>
  );
}
