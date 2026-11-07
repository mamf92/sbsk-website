import { useLoaderData } from 'react-router-dom';
import BoardPoartalSection from '../components/sections/BoardPortalSection/BoardPortalSection';
import type { Member } from '../supabase/queryHelpers/getMember';
import type { Profile } from '../supabase/queryHelpers/getProfile';

export default function BoardPortal() {
  const { profile, members } = useLoaderData() as {
    profile: Profile;
    members: Member[];
  };
  return (
    <>
      <div className="bg-page text-fg min-h-[60vh]">
        <BoardPoartalSection member={profile} members={members} />
      </div>
    </>
  );
}
