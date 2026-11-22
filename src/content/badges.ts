/**
 * Names and descriptions for the badges seeded in
 * supabase/migrations/20261122030000_badges.sql, keyed by slug. The database owns the rules;
 * this file owns the words. Shaped `{ nb, en? }` like src/content/legal.ts, for translation.
 */
export interface BadgeText {
  name: { nb: string; en?: string };
  description: { nb: string; en?: string };
  /** What the progress counts, after "3 av 10": "innsjekkinger". Only for automatic badges. */
  unit?: string;
  /** Given by the board, not earned by a rule. */
  manual?: boolean;
}

export const BADGES: Record<string, BadgeText> = {
  'first-roll': {
    name: { nb: 'Første kast', en: 'First roll' },
    description: { nb: 'Sjekket inn på et arrangement for første gang.' },
    unit: 'innsjekk',
  },
  regular: {
    name: { nb: 'Stamgjest', en: 'Regular' },
    description: { nb: 'Sjekket inn 10 ganger.' },
    unit: 'innsjekkinger',
  },
  veteran: {
    name: { nb: 'Veteran', en: 'Veteran' },
    description: { nb: 'Sjekket inn 25 ganger.' },
    unit: 'innsjekkinger',
  },
  fifty: {
    name: { nb: 'Halvhundre', en: 'Half-century' },
    description: { nb: 'Sjekket inn 50 ganger.' },
    unit: 'innsjekkinger',
  },
  hundred: {
    name: { nb: 'Hundreklubben', en: 'The Hundred Club' },
    description: { nb: 'Sjekket inn 100 ganger.' },
    unit: 'innsjekkinger',
  },
  'all-rounder': {
    name: { nb: 'Allsidig', en: 'All-rounder' },
    description: { nb: 'Vært på tre ulike typer arrangementer.' },
    unit: 'typer',
  },
  'tournament-player': {
    name: { nb: 'Turneringsspiller', en: 'Tournament player' },
    description: { nb: 'Spilt i en turnering.' },
    unit: 'turnering',
  },
  masters: {
    name: { nb: 'Masters-deltaker', en: 'Masters participant' },
    description: { nb: 'Vært på Board Game Masters.' },
    unit: 'festival',
  },
  'streak-4': {
    name: { nb: 'Trofast', en: 'Faithful' },
    description: { nb: 'Sjekket inn fire måneder på rad.' },
    unit: 'måneder på rad',
  },
  'three-years': {
    name: { nb: 'Tre år ved bordet', en: 'Three years at the table' },
    description: { nb: 'Medlem i tre år.' },
    unit: 'år',
  },
  supporter: {
    name: { nb: 'Støttespiller', en: 'Supporter' },
    description: { nb: 'Betalt medlemskap for to sesonger.' },
    unit: 'betalte sesonger',
  },
  'helping-hand': {
    name: { nb: 'Hjelpende hånd', en: 'Helping hand' },
    description: { nb: 'Gitt av styret for frivillig innsats.' },
    manual: true,
  },
  board: {
    name: { nb: 'Styreverv', en: 'Board member' },
    description: { nb: 'Gitt av styret for å ha sittet i styret.' },
    manual: true,
  },
  teacher: {
    name: { nb: 'Spillforklarer', en: 'Rules teacher' },
    description: { nb: 'Gitt av styret for å lære bort spill.' },
    manual: true,
  },
};

/** The badges the board gives by hand, in the order the dialog lists them. */
export const MANUAL_BADGE_SLUGS = Object.keys(BADGES).filter((slug) => BADGES[slug].manual);

/**
 * The event categories badge rules may name: Sanity's `event.category` options plus
 * `festival`, which check-in writes for Board Game Masters. The badges migration's pgTAP test
 * holds the same list; badges.test.ts fails if the schema's options drift from it.
 */
export const BADGE_CATEGORIES = ['spillkveld', 'turnering', 'annet', 'festival'] as const;

/** A badge's name for a slug the app has no text for yet (a newer migration than the bundle). */
export function badgeText(slug: string): BadgeText {
  return BADGES[slug] ?? { name: { nb: slug }, description: { nb: '' } };
}
