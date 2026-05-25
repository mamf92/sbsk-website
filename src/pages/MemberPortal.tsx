import { useLoaderData } from 'react-router-dom';
import MemberPoartalSection from '../components/sections/MemberPortalSection/MemberPortalSection';
import type { Profile } from '../supabase/queryHelpers/getProfil';

export default function MemberPortal() {
  const { profile } = useLoaderData() as {
    profile: Profile;
  };
  return (
    <>
      <div className="dark:bg-darkestblue min-h-[60vh] bg-white">
        <MemberPoartalSection profile={profile} />
      </div>
    </>
  );
}
