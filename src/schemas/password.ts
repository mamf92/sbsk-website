import './zodSetup';
import { z } from 'zod';

/** Matches the minimum length configured in Supabase Auth. */
export const MIN_PASSWORD_LENGTH = 8;

export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `Passordet må være minst ${MIN_PASSWORD_LENGTH} tegn`),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'Passordene er ikke like',
  });
