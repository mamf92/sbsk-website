import { buttonLinksField } from './sharedFields';

/**
 * The editable call-to-action buttons under a page top's heading, shared by `homeHero` and
 * `gamesHero` (#255).
 *
 * One definition rather than a copy per document, because the point of the issue was that the
 * two heroes behaved differently for whoever was editing them — a second copy is how they
 * would drift again.
 *
 * Three is the cap: the hero has room for three across at large sizes without the row wrapping
 * into the subtitle, and `HeroLinks` truncates to the same number in case a document saved
 * before this rule existed carries more.
 */
export const heroLinksField = buttonLinksField({
  description:
    'Valgfritt. Opptil tre knapper under underteksten. Står det tomt, vises standardknappene.',
  max: 3,
});
