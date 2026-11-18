import './zodSetup';
import { z } from 'zod';

/** The six-digit code from an authenticator app. Spaces are allowed while typing ("123 456"). */
export const totpCodeSchema = z
  .string()
  .transform((value) => value.replace(/\s+/g, ''))
  .pipe(z.string().regex(/^\d{6}$/, 'Koden er seks siffer'));
