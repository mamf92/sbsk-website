import { type Profile } from '../../../supabase/queryHelpers/getProfile';

export default function MemberPortalHeader({ profile }: { profile: Profile }) {
  return (
    <div className="bg-darkestblue surface-dark mx-auto flex w-full max-w-150 flex-col items-start gap-6 px-2 py-12 md:max-w-200">
      <div className="flex flex-col gap-6">
        {!profile.name && (
          <h1 className="font-heading font-bold text-3xl text-white lg:text-4xl">
            Velkommen til medlemsportalen!
          </h1>
        )}
        {profile.name && (
          <h1 className="font-heading font-bold text-3xl text-white lg:text-4xl">
            Velkommen, {profile.name}!
          </h1>
        )}
        <p className="font-normal text-left text-lg text-white">
          Her har du tilgang til din egen profil, og på sikt også rabattkoder, din egen kalender og
          annet medlemsrelatert innhold.
        </p>
      </div>
    </div>
  );
}
