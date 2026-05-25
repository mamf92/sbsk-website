import ProfileCard from './ProfileCard';
import type { Member } from '../../../supabase/queryHelpers/getMember';
import type { Profile } from '../../../supabase/queryHelpers/getProfil';
import PortalHeader from './PortalHeader';
import MemberSearchList from './MemberSearchList';

interface BoardPortalSectionProps {
  member: Profile;
  members: Member[];
}

export default function BoardPortalSection({ member, members }: BoardPortalSectionProps) {
  return (
    <>
      <div className="flex flex-col items-center gap-4">
        <PortalHeader boardmember={member} />
        <ProfileCard member={member} />
        <MemberSearchList members={members} />
      </div>
    </>
  );
}
