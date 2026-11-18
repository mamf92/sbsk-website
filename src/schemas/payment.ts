import './zodSetup';
import { z } from 'zod';

/** The board's manual "paid" tick (phase 2 plan, members tab). Whole kroner. */
export const manualPaymentSchema = z.object({
  // A blank field must fail rather than coerce to 0, so blanks become undefined first.
  amountNok: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.coerce
      .number({ error: 'Skriv inn et beløp' })
      .int('Hele kroner')
      .min(0, 'Beløpet kan ikke være negativt')
      .max(100000, 'Det er et veldig høyt beløp, sjekk det'),
  ),
  method: z.enum(['manual', 'bank', 'cash', 'vipps']),
  paidOn: z.iso.date('Velg en dato'),
  note: z.string().trim().max(500, 'Maks 500 tegn').optional(),
});

export type ManualPaymentValues = z.infer<typeof manualPaymentSchema>;
