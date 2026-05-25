import { type Profile } from '../../../supabase/queryHelpers/getProfile';
import { Button } from '../../ui/Buttons';
import { useState } from 'react';
import ProfileForm from '../MemberPortalSection/ProfileForm';
import { editProfile } from '../../../supabase/queryHelpers/editProfile';
import { useRevalidator } from 'react-router-dom';

export default function ProfileCard({ member }: { member: Profile }) {
  const [showForm, setShowForm] = useState(false);
  const revalidator = useRevalidator();

  return (
    <div className="bg-darkblue">
      <div className="flex items-center gap-2 p-2 sm:gap-4">
        <div className="flex flex-col items-start">
          {member.name && member.surname && (
            <h3 className="font-heading xs:text-2xl text-lg font-bold text-white">
              {member.name} {member.surname}
            </h3>
          )}
          {!member.name && !member.surname && (
            <h3 className="font-heading xs:text-2xl text-lg font-bold text-white">Legg til navn</h3>
          )}
          {member.bio && <p className="font-body xs:text-md text-xs text-white">{member.bio}</p>}
          {!member.bio && (
            <p className="font-body xs:text-md text-xs text-white">
              Legg til en bio ved å redigere profilen din.
            </p>
          )}
        </div>
        <div className="xs:h-37.5 xs:w-37.5 h-20 w-20">
          {member.photo_url ? (
            <img
              src={member.photo_url}
              alt={`${member.name} ${member.surname}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="xs:h-37.5 xs:w-37.5 h-20 w-20">
              <img
                src="https://placehold.net/avatar-2.png"
                alt="Placeholder profile"
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-start p-2">
        <Button
          variant="primary"
          size="sm"
          icon="right"
          className="w-full"
          onClick={() => setShowForm(true)}
        >
          Rediger profil
        </Button>
      </div>
      {showForm && (
        <ProfileForm
          profile={member}
          onSubmitProfile={(profileData) =>
            editProfile(profileData).then(() => {
              setShowForm(false);
              revalidator.revalidate();
            })
          }
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
