import ProfileCard from '../BoardPortalSection/ProfileCard';
import type { Profile } from '../../../supabase/queryHelpers/getProfil';
import PortalHeader from './MemberPortalHeader';

interface MemberPortalSectionProps {
  profile: Profile;
}

export default function MemberPortalSection({ profile }: MemberPortalSectionProps) {
  return (
    <>
      <div className="flex flex-col items-center gap-4">
        <PortalHeader profile={profile} />
        <ProfileCard member={profile} />
      </div>
    </>
  );
}
