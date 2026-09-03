import type { Member } from '../../../supabase/queryHelpers/getMember';
import { Button } from '../../ui/Buttons';
import { Checkbox } from '../../ui/Checkbox';
import { Dialog } from '../../ui/Dialog';
import { Input } from '../../ui/Input';
import { Alert } from '../../ui/Alert';
import { useState } from 'react';

type MemberFormValues = {
  id?: string;
  name: string;
  surname: string;
  phone: string;
  address: string;
  postcode: string;
  city: string;
  email: string;
  is_admin: boolean;
};

type MemberFormProps = {
  member?: Member;
  onSubmitMember: (member: MemberFormValues) => Promise<unknown>;
  onClose: () => void;
};

const NAME_PATTERN = "^[a-zA-ZÀ-ÿ\\-\\s'’]{2,}$";
const PHONE_PATTERN = '^(0047|\\+47|47)?[2-9]\\d{7}$';
const ADDRESS_PATTERN = "^[a-zA-ZÀ-ÿ\\-\\s'’]{2,}\\s?[0-9]{1,4}\\s?[a-zA-ZÀ-ÿ\\-\\s'’]{0,1}$";
const POSTAL_CODE_PATTERN = '^[0-9]{4,4}$';
const CITY_PATTERN = "^[a-zA-ZÀ-ÿ\\-\\s'’]{1,}$";
const EMAIL_PATTERN = '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$';

export default function MemberForm({ member, onSubmitMember, onClose }: MemberFormProps) {
  const isEditMode = Boolean(member?.id);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const memberData: MemberFormValues = {
      id: member?.id,
      name: String(formData.get('name') ?? ''),
      surname: String(formData.get('surname') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      address: String(formData.get('address') ?? ''),
      postcode: String(formData.get('postcode') ?? ''),
      city: String(formData.get('city') ?? ''),
      email: String(formData.get('email') ?? ''),
      is_admin: formData.get('is_admin') === 'on',
    };

    setSubmitError(null);
    setSubmitting(true);
    try {
      // Only a successful save closes the dialog — a rejection here used to close it anyway
      // and swallow the failure entirely (#169).
      await onSubmitMember(memberData);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Kunne ikke lagre medlemmet.');
    } finally {
      setSubmitting(false);
    }
  };

  const fields = [
    {
      id: 'name',
      name: 'name',
      label: 'Fornavn',
      placeholder: 'Fornavn',
      defaultValue: member?.name ?? '',
      pattern: NAME_PATTERN,
      title: "Minimum 2 bokstaver og - eller ' tillatt",
      required: true,
    },
    {
      id: 'surname',
      name: 'surname',
      label: 'Etternavn',
      placeholder: 'Etternavn',
      defaultValue: member?.surname ?? '',
      pattern: NAME_PATTERN,
      title: "Minimum 2 bokstaver og - eller ' tillatt",
      required: true,
    },
    {
      id: 'phone',
      name: 'phone',
      label: 'Telefon',
      placeholder: 'Telefonnummer',
      defaultValue: member?.phone ?? '',
      pattern: PHONE_PATTERN,
      title: 'Norsk telefonnummer uten mellomrom med eller uten +47 eller 0047 foran',
      required: true,
    },
    {
      id: 'address',
      name: 'address',
      label: 'Adresse',
      placeholder: 'Adresse',
      defaultValue: member?.address ?? '',
      pattern: ADDRESS_PATTERN,
      title: 'Gatenavn og nummer må inneholde minst 3 bokstaver',
      required: true,
    },
    {
      id: 'postcode',
      name: 'postcode',
      label: 'Postnr',
      placeholder: 'Postnummer',
      defaultValue: member?.postcode ?? '',
      pattern: POSTAL_CODE_PATTERN,
      title: 'Postnummeret må være på 4 siffer',
      required: true,
    },
    {
      id: 'city',
      name: 'city',
      label: 'Sted',
      placeholder: 'Sted',
      defaultValue: member?.city ?? '',
      pattern: CITY_PATTERN,
      title: 'Stedet må inneholde minst 2 bokstaver',
      required: true,
    },
    {
      id: 'email',
      name: 'email',
      label: 'E-post',
      placeholder: 'E-post',
      defaultValue: member?.email ?? '',
      pattern: EMAIL_PATTERN,
      title: 'Vennligst oppgi en gyldig e-postadresse',
      required: true,
    },
  ];
  return (
    <Dialog title={isEditMode ? 'Rediger medlem' : 'Legg til medlem'} onClose={onClose}>
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
                type="text"
                id={field.id}
                name={field.name}
                placeholder={field.placeholder}
                defaultValue={field.defaultValue}
                pattern={field.pattern}
                title={field.title}
                required={field.required}
              />
            </div>
          ))}
          <label htmlFor="is_admin" className="flex w-full items-center gap-2 pt-2">
            <Checkbox id="is_admin" name="is_admin" defaultChecked={member?.is_admin ?? false} />
            <span className="font-body text-white">Administrator</span>
          </label>
        </div>
        {submitError && <Alert>{submitError}</Alert>}
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
          <Button type="submit" variant="primary" size="md" icon="right" loading={submitting}>
            {isEditMode ? 'Lagre endringer' : 'Legg til medlem'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
