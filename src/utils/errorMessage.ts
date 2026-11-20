/**
 * Backend errors reach the UI in English (Supabase Auth, Postgres, fetch). Nothing a visitor
 * reads may come straight from `error.message`: this maps the ones we know to Norwegian and
 * falls back to a Norwegian sentence the caller provides for the rest.
 */
const KNOWN: ReadonlyArray<[RegExp, string]> = [
  [/invalid login credentials/i, 'Feil e-post eller passord.'],
  [/email not confirmed/i, 'E-postadressen er ikke bekreftet ennå. Sjekk innboksen din.'],
  [
    /user already registered|already been registered/i,
    'Det finnes allerede en konto med denne e-postadressen.',
  ],
  [
    /password should be at least|weak password|password is too/i,
    'Passordet er for svakt. Velg et lengre og mer unikt passord.',
  ],
  [/rate limit|too many requests|after \d+ seconds/i, 'For mange forsøk. Vent litt og prøv igjen.'],
  [/signups? not allowed|signup is disabled/i, 'Registrering er ikke åpen akkurat nå.'],
  [
    /failed to fetch|networkerror|network request failed|load failed/i,
    'Fikk ikke kontakt med serveren. Sjekk nettforbindelsen og prøv igjen.',
  ],
];

/** Norwegian text for an unknown error: the known mapping, else `fallback`. */
export function norwegianErrorMessage(error: unknown, fallback: string): string {
  const text =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : typeof error === 'string'
        ? error
        : '';
  return KNOWN.find(([pattern]) => pattern.test(text))?.[1] ?? fallback;
}
