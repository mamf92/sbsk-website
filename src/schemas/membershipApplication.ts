import './zodSetup';
import { z } from 'zod';

const thisYear = new Date().getFullYear();

/** "Bli medlem": the same limits as `public.membership_applications`, checked before sending. */
export const membershipApplicationSchema = z.object({
  name: z.string().trim().min(1, 'Skriv fornavnet ditt').max(80, 'Høyst 80 tegn'),
  surname: z.string().trim().min(1, 'Skriv etternavnet ditt').max(80, 'Høyst 80 tegn'),
  email: z
    .string()
    .trim()
    .min(1, 'E-post er påkrevd')
    .max(320, 'E-postadressen er for lang')
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Ugyldig e-post — må inneholde @ og et domene'),
  birthYear: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || (/^\d{4}$/.test(value) && +value >= 1900 && +value <= thisYear),
      'Skriv fødselsåret med fire sifre',
    ),
  message: z.string().trim().max(1000, 'Høyst 1000 tegn'),
});

export type MembershipApplicationValues = z.input<typeof membershipApplicationSchema>;
