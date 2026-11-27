import type { HighlightKind } from './eventHighlights';
import festivalArt from '../assets/images/posters/festival.webp';
import julArt from '../assets/images/posters/jul.webp';
import turneringArt from '../assets/images/posters/turnering.webp';
import calendarArt from '../assets/images/calendar-default.webp';

/** House art in the poster style (docs/IMAGE_DESIGN_LANGUAGE.md) for an event with no image. */
export function posterArt(kind: HighlightKind, title: string): string {
  if (kind === 'festival') return festivalArt;
  // «Jul», «Julespillkveld», «Julebord», but not «juli».
  if (/(^|[^a-zæøå])jul(?!i)/i.test(title)) return julArt;
  if (kind === 'turnering' || /turnering/i.test(title)) return turneringArt;
  return calendarArt;
}
