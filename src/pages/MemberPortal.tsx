import { useLoaderData, useSearchParams } from 'react-router-dom';
import MemberPoartalSection from '../components/sections/MemberPortalSection/MemberPortalSection';
import type { Profile } from '../supabase/queryHelpers/getProfile';

export default function MemberPortal() {
  const { profile } = useLoaderData() as {
    profile: Profile;
  };
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason') || undefined;

  return (
    <>
      <div className="bg-page text-fg min-h-[60vh]">
        <MemberPoartalSection profile={profile} reason={reason} />
      </div>
    </>
  );
}
