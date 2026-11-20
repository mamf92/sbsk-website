/**
 * The club's house prompt for AI-made posters and images. The board pastes the result into
 * their own AI tool; nothing here calls an API. The rules behind every line are in
 * `docs/IMAGE_DESIGN_LANGUAGE.md` — change both together.
 */

export const POSTER_PROMPT_MAX_LENGTH = 200;

const STYLE =
  'Flat vector-style illustration with a soft paper-like texture, calm and uncluttered. ' +
  'Palette strictly limited to deep navy #002F5F (background, about 60%), darkest navy #031F3B (shadows), ' +
  'warm orange #F29D35 (accent), dark orange #CB7925 (secondary accent) and cream #FAF3E4 (highlights). No other colours. ' +
  'Soft light from the upper left, gentle shadows, no glow, no gradients beyond subtle shading. ' +
  'Straight-on or slightly elevated view, ONE clear focal object, two or three simple supporting shapes that overlap it, ' +
  'and generous empty navy space (at least a third of the frame) where text can be added later. ' +
  'Wooden board game pieces (meeples, hexagonal tiles, cards) in simple chunky shapes. ' +
  'No text, no letters, no numbers, no logos, no people, no faces, no watermark. ' +
  'Avoid: dice, boxes of games, horizon lines or landscapes, rows of identical meeples, more than five objects, tiny details.';

/**
 * Builds the full prompt from the board member's one-liner. Returns `null` for an empty
 * description, so the caller can ask for one instead of copying a prompt about nothing.
 */
export function buildPosterPrompt(subject: string): string | null {
  const trimmed = subject.replace(/\s+/g, ' ').trim().slice(0, POSTER_PROMPT_MAX_LENGTH);
  if (!trimmed) return null;
  return `Poster artwork for: ${trimmed}. ${STYLE} Wide 16:9 or 3:2 landscape image.`;
}
