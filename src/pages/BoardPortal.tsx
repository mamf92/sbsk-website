import { useLoaderData } from 'react-router-dom';
import BoardPoartalSection from '../components/sections/BoardPortalSection/BoardPortalSection';
import type { Profile } from '../supabase/queryHelpers/getProfil';

export default function BoardPortal() {
  const { profile, members } = useLoaderData() as {
    profile: Profile;
    members: Profile[];
  };
  return (
    <>
      <div className="dark:bg-darkestblue min-h-[60vh] bg-white">
        <BoardPoartalSection member={profile} members={members} />
      </div>
    </>
  );
}
