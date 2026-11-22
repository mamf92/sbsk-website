import { useState } from 'react';
import { useRevalidator } from 'react-router-dom';
import { Avatar } from '../../ui/Avatar';
import { Button } from '../../ui/Buttons';
import { StatTile } from '../../ui/StatTile';
import ProfileForm from '../MemberPortalSection/ProfileForm';
import { editProfile } from '../../../supabase/queryHelpers/editProfile';
import type { Profile } from '../../../supabase/queryHelpers/getProfile';
import type { Member } from '../../../supabase/queryHelpers/getMember';
import type { MyActivity } from '../../../supabase/queryHelpers/getMyActivity';

type MemberDashboardTopProps = {
  profile: Profile;
  /** The viewer's register row; null for an account with no row (should not happen). */
  me: Member | null;
  activity: MyActivity;
  /** Extra actions on the right of the band (the board's "Innholdsredigering"). */
  actions?: React.ReactNode;
};

const memberSinceFormat = new Intl.DateTimeFormat('nb-NO', { month: 'long', year: 'numeric' });

/**
 * The top of "Min side", shared by the member page and the board portal (phase 2 plan,
 * "Shared with phase 3"): the design library's members-portal banner (Layout D) in the current
 * flat look. Identity on the left — photo, name, member since, bio, edit — and the member's own
 * numbers on the right as stat tiles.
 */
export default function MemberDashboardTop({
  profile,
  me,
  activity,
  actions,
}: MemberDashboardTopProps) {
  const [editing, setEditing] = useState(false);
  const revalidator = useRevalidator();
  const fullName = [profile.name, profile.surname].filter(Boolean).join(' ') || profile.email;
  const since = me?.member_since ? memberSinceFormat.format(new Date(me.member_since)) : null;

  return (
    <section
      aria-labelledby="portal-band-heading"
      className="bg-portal-band surface-dark border-orange border-t-4 text-white"
    >
      <div className="max-w-content mx-auto flex w-full flex-col gap-6 px-4 py-8 md:flex-row md:items-stretch md:justify-between md:py-10">
        <div className="flex min-w-0 items-start gap-4 sm:gap-6">
          <Avatar name={fullName} src={profile.photo_url ?? undefined} size="xl" />
          <div className="flex min-w-0 flex-col gap-2">
            <h1 id="portal-band-heading" className="font-heading text-h2 font-bold break-words">
              Hei, {profile.name || fullName}!
            </h1>
            {since && <p className="font-body text-sm text-gray-100">Medlem siden {since}</p>}
            {profile.bio && <p className="font-body max-w-form">{profile.bio}</p>}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="primary" size="sm" onClick={() => setEditing(true)}>
                Rediger profil
              </Button>
              {actions}
            </div>
          </div>
        </div>
        <div className="grid flex-none grid-cols-2 gap-2 sm:grid-cols-2 md:w-80">
          <StatTile value={activity.checkIns ?? '–'} label="Innsjekk" />
          <StatTile value={activity.signups ?? '–'} label="Påmeldinger" />
        </div>
      </div>
      {editing && (
        <ProfileForm
          profile={profile}
          onSubmitProfile={(values) =>
            editProfile(values).then(() => {
              setEditing(false);
              revalidator.revalidate();
            })
          }
          onClose={() => setEditing(false)}
        />
      )}
    </section>
  );
}
