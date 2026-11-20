/**
 * The club's house prompt for AI-made posters. The board pastes the result into their own AI
 * tool and gets a FINISHED poster back, with the event text on it; nothing here calls an API.
 * The rules behind every line are in `docs/IMAGE_DESIGN_LANGUAGE.md` — change both together.
 */

export const POSTER_FIELD_MAX_LENGTH = 100;

export type PosterFormat = 'portrait' | 'landscape';

export interface PosterDetails {
  title: string;
  date?: string;
  time?: string;
  place?: string;
  format?: PosterFormat;
}

const STYLE =
  'Flat vector-style illustration with a soft paper-like texture, calm and uncluttered. ' +
  'Palette strictly limited to deep navy #002F5F (background, about 60%), darkest navy #031F3B (shadows), ' +
  'warm orange #F29D35 (accent), dark orange #CB7925 (secondary accent) and cream #FAF3E4 (highlights). No other colours. ' +
  'Soft light from the upper left, gentle shadows, no glow, no gradients beyond subtle shading. ' +
  'Straight-on or slightly elevated view, ONE clear focal object, two or three simple supporting shapes that overlap it. ' +
  'Wooden board game pieces (meeples, hexagonal tiles, cards) in simple chunky shapes. ' +
  'No logos, no people, no faces, no watermark. ' +
  'Avoid: dice, boxes of games, horizon lines or landscapes, rows of identical meeples, more than five objects, tiny details.';

const TYPOGRAPHY =
  'Typography: set in a clean, bold sans-serif with generous spacing, aligned and centred, ' +
  'on plain navy space that the illustration leaves free. Clear hierarchy: the title is largest, in cream, ' +
  'and the date and time are second largest, in warm orange; the place is smaller, in cream. ' +
  'Every letter must be sharp, correctly spelled and fully readable, with high contrast against the navy. ' +
  'Copy the text exactly as written, including the Norwegian letters æ, ø and å. ' +
  'Do not add any other text, numbers, slogans or placeholder words.';

const FORMAT_TEXT: Record<PosterFormat, string> = {
  portrait:
    'Portrait A-format poster (2:3 ratio, like A3 or A4), text in the top and bottom thirds.',
  landscape:
    'Wide landscape poster, 16:9 or 3:2, text on the left or right with the illustration beside it.',
};

function clean(value: string | undefined): string {
  return (value ?? '')
    .replace(/\s+/g, ' ')
    .replace(/"/g, "'")
    .trim()
    .slice(0, POSTER_FIELD_MAX_LENGTH);
}

/**
 * Builds the full prompt for a finished poster. Returns `null` without a title, so the caller can
 * ask for one instead of copying a prompt about nothing. Empty optional fields are left out.
 */
export function buildPosterPrompt(details: PosterDetails): string | null {
  const title = clean(details.title);
  if (!title) return null;

  const lines = [`Title: "${title}"`];
  const date = clean(details.date);
  const time = clean(details.time);
  const place = clean(details.place);
  if (date) lines.push(`Date: "${date}"`);
  if (time) lines.push(`Time: "${time}"`);
  if (place) lines.push(`Place: "${place}"`);

  return (
    `Design a finished, ready-to-print poster for a board game club event, with the text written on it. ` +
    `Render exactly this text, in Norwegian, each line spelled exactly as in the quotes (leave out the quote marks): ` +
    `${lines.join('; ')}. ` +
    `${STYLE} ${TYPOGRAPHY} ${FORMAT_TEXT[details.format ?? 'portrait']}`
  );
}
