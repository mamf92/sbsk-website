import ProfileCard from '../BoardPortalSection/ProfileCard';
import type { Profile } from '../../../supabase/queryHelpers/getProfile';
import PortalHeader from './MemberPortalHeader';
import { Alert } from '../../ui/Alert';

interface MemberPortalSectionProps {
  profile: Profile;
  /** Set by `boardPortalLoader` when it bounces a signed-in non-admin here (#82) — see
   *  `LoginSection`'s identical `reason` handling for `not_authenticated`. */
  reason?: string;
}

export default function MemberPortalSection({ profile, reason }: MemberPortalSectionProps) {
  return (
    <>
      <div className="flex flex-col items-center gap-4 py-2">
        <PortalHeader profile={profile} />
        {reason === 'not_admin' && (
          <div className="max-w-form md:max-w-content w-full px-2">
            <Alert>Du har ikke administratortilgang til styreportalen.</Alert>
          </div>
        )}
        <ProfileCard member={profile} />
      </div>
    </>
  );
}
