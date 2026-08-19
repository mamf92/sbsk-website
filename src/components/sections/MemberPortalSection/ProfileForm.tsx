import type { Profile } from '../../../supabase/queryHelpers/getProfile';
import { Button } from '../../ui/Buttons';
import uploadImage from '../../../supabase/queryHelpers/uploadImage';
import { useState } from 'react';
import { type ProfileFormValues } from '../../../supabase/queryHelpers/editProfile';

type ProfileFormProps = {
  profile: Profile;
  onSubmitProfile: (profile: ProfileFormValues) => void;
  onClose: () => void;
};

const NAME_PATTERN = "^[a-zA-ZÀ-ÿ\\-\\s'’]{2,}$";

const INPUT_CLASS_NAME =
  'focus:ring-orange border-darkblue dark:border-orange placeholder:text-placeholder text-darkblue placeholder:font-body w-full border bg-white px-3 py-2 focus:ring-2 focus:outline-none md:px-4 md:py-3';

export default function ProfileForm({ profile, onSubmitProfile, onClose }: ProfileFormProps) {
  const [imageURL, setImageURL] = useState<string | null>(profile.photo_url);

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const profileData: ProfileFormValues = {
      id: profile.id,
      supabase_id: profile.supabase_id,
      name: formData.get('name') as string,
      surname: formData.get('surname') as string | null,
      bio: formData.get('bio') as string | null,
      photo_url: imageURL ?? (formData.get('photo_file') as File | null),
    };
    onSubmitProfile(profileData);
  };

  const fields = [
    {
      id: 'name',
      name: 'name',
      label: 'Fornavn',
      placeholder: 'Fornavn',
      defaultValue: profile?.name ?? '',
      pattern: NAME_PATTERN,
      title: "Minimum 2 bokstaver og - eller ' tillatt",
      required: true,
    },
    {
      id: 'surname',
      name: 'surname',
      label: 'Etternavn',
      placeholder: 'Etternavn',
      defaultValue: profile?.surname ?? '',
      pattern: NAME_PATTERN,
      title: "Minimum 2 bokstaver og - eller ' tillatt",
      required: false,
    },
    {
      id: 'photo_file',
      name: 'photo_file',
      type: 'file',
      label: 'Bilde',
      placeholder: 'Velg et bilde',
      defaultValue: '',
      accept: 'image/*',
      title: 'File must be an image (jpg, png, etc.)',
      required: false,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          uploadImage(profile.supabase_id, file).then((url) => {
            if (url) {
              setImageURL(url);
            }
          });
        }
      },
    },
  ];
  return (
    <div className="dark:bg-darkblue/70 fixed top-0 left-0 z-40 h-lvh w-screen bg-white/70 backdrop-blur-xs">
      <div className="bg-darkblue surface-dark max-w-form absolute top-1/2 left-1/2 z-50 flex w-[calc(100vw-1rem)] -translate-x-1/2 -translate-y-1/2 flex-col justify-center gap-3 py-10 sm:px-6">
        <div className="flex items-center justify-between p-2 sm:gap-4">
          <h1 className="font-heading text-h1 text-white">Rediger profil</h1>
          <div className="xs:h-37.5 xs:w-37.5 h-20 w-20">
            {imageURL ? (
              <img
                src={imageURL}
                alt={`${profile.name} ${profile.surname}`}
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
        <form className="flex w-full flex-col gap-2" onSubmit={handleSubmit}>
          <div className="flex w-full flex-col gap-2">
            {fields.map((field) => (
              <div key={field.id} className="flex w-full flex-col gap-1">
                <label
                  key={field.name}
                  htmlFor={field.id}
                  className="font-body flex w-full flex-col gap-1 text-white max-sm:sr-only"
                >
                  {field.label}
                </label>
                <input
                  type={field.type ?? 'text'}
                  id={field.id}
                  name={field.name}
                  className={INPUT_CLASS_NAME}
                  placeholder={field.placeholder}
                  defaultValue={field.defaultValue}
                  accept={field.accept}
                  pattern={field.pattern}
                  title={field.title}
                  required={field.required}
                  onChange={field.onChange}
                />
              </div>
            ))}
            <label
              htmlFor="bio"
              className="font-body flex w-full flex-col gap-1 text-white max-sm:sr-only"
            >
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              className={`${INPUT_CLASS_NAME} h-32 resize-none`}
              placeholder="Skriv litt om deg selv..."
              defaultValue={profile?.bio ?? ''}
            />
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              onClick={onClose}
              type="button"
              variant="tertiary"
              size="md"
              className="border border-white/50"
            >
              Avbryt
            </Button>
            <Button type="submit" variant="primary" size="md" icon="right">
              Lagre endringer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
