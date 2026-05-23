import ProfileCard from './profileCard';
import type { Profile } from '../../../supabase/queryHelpers/getProfil';
import BoardPortalHeader from './BoardPortalHeader';
import MemberSearchList from './MemberSearchList';

interface BoardPortalSectionProps {
  member: Profile;
}

export default function BoardPortalSection({ member }: BoardPortalSectionProps) {
  return (
    <>
      <div className="flex flex-col items-center gap-4">
        <BoardPortalHeader boardmember={member} />
        <ProfileCard member={member} />
        <MemberSearchList members={[member]} />
      </div>
    </>
  );
}
