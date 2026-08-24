import './zodSetup';
import { z } from 'zod';

/**
 * The Kontakt oss form's validation, and the first schema in `src/schemas/` — the pattern #83
 * asks the rest of the site's forms to eventually move onto. Deliberately small: no
 * `react-hook-form`, no resolver library, just `safeParse` on submit. `ContactSection` maps
 * `error.issues` onto per-field messages by `issue.path[0]`.
 *
 * Validation runs on submit, not on every keystroke, per the design handoff — shouting at
 * someone halfway through typing their name is not the behaviour #83 asked for either
 * ("invalid field rendering changes … if invalid", not "while typing").
 *
 * Norwegian copy is verbatim from the handoff.
 */
export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Navn må være minst 2 tegn'),
  email: z
    .string()
    .trim()
    .min(1, 'E-post er påkrevd')
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Ugyldig e-post — må inneholde @ og et domene'),
  message: z.string().trim().min(1, 'Skriv en melding før du sender'),
});

/** The "typesafe inputs" half of #83 — types the form state and `createContactMessage`'s arg. */
export type ContactValues = z.infer<typeof contactSchema>;
