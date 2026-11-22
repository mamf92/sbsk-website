import { norwegianErrorMessage } from '../../../utils/errorMessage';
import type { Profile } from '../../../supabase/queryHelpers/getProfile';
import { Button } from '../../ui/Buttons';
import { Dialog } from '../../ui/Dialog';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { Alert, FieldError } from '../../ui/Alert';
import getImage from '../../../supabase/queryHelpers/getImage';
import uploadImage, { removeImage } from '../../../supabase/queryHelpers/uploadImage';
import { PHOTO_TYPES, PhotoRejectedError } from '../../../utils/resizeImage';
import { Avatar } from '../../ui/Avatar';
import { useEffect, useRef, useState } from 'react';
import { type ProfileFormValues } from '../../../supabase/queryHelpers/editProfile';

type ProfileFormProps = {
  profile: Profile;
  onSubmitProfile: (profile: ProfileFormValues) => Promise<unknown>;
  onClose: () => void;
};

const NAME_PATTERN = "^[a-zA-ZÀ-ÿ\\-\\s'’]{2,}$";

type ValidatedField = { id: string; pattern?: string; title?: string; required?: boolean };

/** The reference pattern #169 asks for: real field-level feedback (`invalid`/`aria-invalid`/
 *  `FieldError`) tied to actual validation state, instead of leaving it entirely to the
 *  browser's own constraint-validation bubble. */
function validateField(field: ValidatedField, value: string): string | null {
  if (field.required && !value.trim()) return 'Dette feltet er obligatorisk.';
  if (field.pattern && value && !new RegExp(field.pattern).test(value)) {
    return field.title ?? 'Ugyldig verdi.';
  }
  return null;
}

export default function ProfileForm({ profile, onSubmitProfile, onClose }: ProfileFormProps) {
  const [imageURL, setImageURL] = useState<string | null>(profile.photo_url);
  const [photoPath, setPhotoPath] = useState<string | null>(profile.photo_path);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [pendingUploads, setPendingUploads] = useState(0);
  const uploading = pendingUploads > 0;

  // A photo is uploaded as soon as it is picked, so the preview is the real stored file. Every
  // upload that does not end up saved is removed again: one superseded by a later pick, one
  // still running when the dialog closes, and the current one on cancel. After a save, the
  // photo it replaced is removed. Refs, not state, because uploads resolve after re-renders
  // (and possibly after unmount) and must see the latest values.
  const latestUpload = useRef(0);
  const closed = useRef(false);
  const currentPath = useRef<string | null>(profile.photo_path);
  const saved = useRef(false);

  const isUnsaved = (path: string | null): path is string =>
    path !== null && path !== profile.photo_path;

  useEffect(
    () => {
      // Reset on (re)mount: StrictMode mounts, unmounts and mounts again in development.
      closed.current = false;
      return () => {
        closed.current = true;
        if (!saved.current && isUnsaved(currentPath.current)) void removeImage(currentPath.current);
      };
    },
    // Runs once, on unmount; `profile.photo_path` is fixed for the dialog's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const close = () => onClose();

  const fields: (ValidatedField & {
    name: string;
    label: string;
    placeholder: string;
    defaultValue: string;
    type?: string;
    accept?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  })[] = [
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
      accept: PHOTO_TYPES.join(','),
      title: 'Filen må være et bilde (jpg, png, e.l.)',
      required: false,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const file = input.files?.[0];
        if (!file) return;
        const upload = ++latestUpload.current;
        setPhotoError(null);
        setPendingUploads((n) => n + 1);
        uploadImage(profile.supabase_id, file)
          .then(async (path) => {
            if (!path) {
              if (upload === latestUpload.current) {
                setPhotoError('Vi fikk ikke lastet opp bildet. Prøv igjen.');
              }
              return;
            }
            if (closed.current || upload !== latestUpload.current) {
              void removeImage(path);
              return;
            }
            if (isUnsaved(currentPath.current)) void removeImage(currentPath.current);
            currentPath.current = path;
            setPhotoPath(path);
            const url = await getImage(path);
            if (url && !closed.current) setImageURL(url);
          })
          .catch((err: unknown) => {
            if (closed.current || upload !== latestUpload.current) return;
            input.value = '';
            setPhotoError(
              err instanceof PhotoRejectedError
                ? err.reason === 'size'
                  ? 'Bildet er for stort. Velg et bilde under 20 MB.'
                  : err.reason === 'type'
                    ? 'Filen må være et bilde (JPG, PNG, WebP, GIF eller AVIF).'
                    : 'Vi kunne ikke lese bildet. Prøv et JPG- eller PNG-bilde.'
                : 'Vi fikk ikke lastet opp bildet. Prøv igjen.',
            );
          })
          .finally(() => {
            if (!closed.current) setPendingUploads((n) => n - 1);
          });
      },
    },
  ];

  // Only `name`/`surname` carry a pattern to validate against — `photo_file` handles its own
  // failure separately and has none.
  const validatedFields = fields.filter((field) => field.pattern);

  function handleBlur(field: ValidatedField, value: string) {
    setFieldErrors((current) => ({ ...current, [field.id]: validateField(field, value) }));
  }

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get('name') as string) ?? '';
    const surname = (formData.get('surname') as string) ?? '';

    const nextFieldErrors = Object.fromEntries(
      validatedFields.map((field) => [
        field.id,
        validateField(field, field.id === 'name' ? name : surname),
      ]),
    );
    setFieldErrors(nextFieldErrors);
    if (Object.values(nextFieldErrors).some(Boolean)) return;

    const profileData: ProfileFormValues = {
      id: profile.id,
      supabase_id: profile.supabase_id,
      name,
      surname: surname || null,
      bio: formData.get('bio') as string | null,
      // Only ever a storage path: the raw form value is a File, which would serialise as `{}`.
      photo_url: photoPath,
    };

    setSubmitError(null);
    setSubmitting(true);
    try {
      // Resolving is what closes the dialog, from the caller's side (ProfileCard) — a rejection
      // here leaves it open with the failure shown, instead of disappearing silently (#169).
      await onSubmitProfile(profileData);
      saved.current = true;
      if (profile.photo_path && photoPath !== profile.photo_path) {
        void removeImage(profile.photo_path);
      }
    } catch (err) {
      setSubmitError(norwegianErrorMessage(err, 'Kunne ikke lagre endringene.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      title="Rediger profil"
      onClose={close}
      headerEnd={
        <div className="xs:h-37.5 xs:w-37.5 h-20 w-20 shrink-0">
          {imageURL ? (
            <img
              src={imageURL}
              alt={`${profile.name} ${profile.surname}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <Avatar
              className="h-full w-full"
              name={[profile.name, profile.surname].filter(Boolean).join(' ') || profile.email}
              size="xl"
            />
          )}
        </div>
      }
    >
      <form className="flex w-full flex-col gap-2" onSubmit={handleSubmit} noValidate>
        <div className="flex w-full flex-col gap-2">
          {fields.map((field) => {
            const fieldError = fieldErrors[field.id];
            const errorId = `${field.id}-error`;
            return (
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
                  invalid={!!fieldError}
                  aria-describedby={fieldError ? errorId : undefined}
                  onChange={field.onChange}
                  onBlur={field.pattern ? (e) => handleBlur(field, e.target.value) : undefined}
                />
                {fieldError && <FieldError id={errorId}>{fieldError}</FieldError>}
              </div>
            );
          })}
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
        {photoError && <Alert>{photoError}</Alert>}
        {submitError && <Alert>{submitError}</Alert>}
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            onClick={close}
            type="button"
            variant="tertiary"
            size="md"
            className="border border-white/50"
          >
            Avbryt
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon="right"
            loading={submitting || uploading}
          >
            Lagre endringer
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
