import type { Member } from '../../../supabase/queryHelpers/getMember';
import { Button } from '../../ui/Buttons';

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
  onSubmitMember: (member: MemberFormValues) => void;
  onClose: () => void;
};

const NAME_PATTERN = "^[a-zA-ZÀ-ÿ\\-\\s'’]{2,}$";
const PHONE_PATTERN = '^(0047|\\+47|47)?[2-9]\\d{7}$';
const ADDRESS_PATTERN = "^[a-zA-ZÀ-ÿ\\-\\s'’]{2,}\\s?[0-9]{1,4}\\s?[a-zA-ZÀ-ÿ\\-\\s'’]{0,1}$";
const POSTAL_CODE_PATTERN = '^[0-9]{4,4}$';
const CITY_PATTERN = "^[a-zA-ZÀ-ÿ\\-\\s'’]{1,}$";
const EMAIL_PATTERN = '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$';

const INPUT_CLASS_NAME =
  'focus:ring-orange border-darkblue dark:border-orange placeholder:text-placeholder text-darkblue placeholder:font-body w-full border bg-white px-3 py-2 focus:ring-2 focus:outline-none md:px-4 md:py-3';

export default function MemberForm({ member, onSubmitMember, onClose }: MemberFormProps) {
  const isEditMode = Boolean(member?.id);

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
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
    onSubmitMember(memberData);
    onClose();
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
    <div className="dark:bg-darkblue/70 fixed top-0 left-0 z-40 h-lvh w-screen bg-white/70 backdrop-blur-xs">
      <div className="bg-darkblue surface-dark absolute top-1/2 left-1/2 z-50 flex w-[calc(100vw-1rem)] max-w-150 -translate-x-1/2 -translate-y-1/2 flex-col justify-center gap-3 px-6 py-10">
        <h1 className="font-heading text-3xl text-white">
          {isEditMode ? 'Rediger medlem' : 'Legg til medlem'}
        </h1>
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
                  type="text"
                  id={field.id}
                  name={field.name}
                  className={INPUT_CLASS_NAME}
                  placeholder={field.placeholder}
                  defaultValue={field.defaultValue}
                  pattern={field.pattern}
                  title={field.title}
                  required={field.required}
                />
              </div>
            ))}
            <label htmlFor="is_admin" className="flex w-full items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is_admin"
                name="is_admin"
                defaultChecked={member?.is_admin ?? false}
                className="focus:ring-orange border-darkblue dark:border-orange text-darkblue size-4 border bg-white focus:ring-2 focus:outline-none"
              />
              <span className="font-body text-white">Administrator</span>
            </label>
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
              {isEditMode ? 'Lagre endringer' : 'Legg til medlem'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
