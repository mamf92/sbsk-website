import type { Profile } from '../../../supabase/queryHelpers/getProfile';
import { Button } from '../../ui/Buttons';
import { Dialog } from '../../ui/Dialog';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import uploadImage from '../../../supabase/queryHelpers/uploadImage';
import { useState } from 'react';
import { type ProfileFormValues } from '../../../supabase/queryHelpers/editProfile';

type ProfileFormProps = {
  profile: Profile;
  onSubmitProfile: (profile: ProfileFormValues) => void;
  onClose: () => void;
};

const NAME_PATTERN = "^[a-zA-ZÀ-ÿ\\-\\s'’]{2,}$";

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
      title: 'Filen må være et bilde (jpg, png, e.l.)',
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
    <Dialog
      title="Rediger profil"
      onClose={onClose}
      headerEnd={
        <div className="xs:h-37.5 xs:w-37.5 h-20 w-20 shrink-0">
          {imageURL ? (
            <img
              src={imageURL}
              alt={`${profile.name} ${profile.surname}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <img
              src="https://placehold.net/avatar-2.png"
              alt="Profilbilde mangler"
              className="h-full w-full object-cover"
            />
          )}
        </div>
      }
    >
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
              <Input
                type={field.type ?? 'text'}
                id={field.id}
                name={field.name}
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
          <Textarea
            id="bio"
            name="bio"
            placeholder="Skriv litt om deg selv…"
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
    </Dialog>
  );
}
