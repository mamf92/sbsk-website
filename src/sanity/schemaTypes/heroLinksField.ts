import { defineField } from 'sanity';

/**
 * The editable call-to-action buttons under a hero's title, shared by `homeHero` and
 * `gamesHero` (#255).
 *
 * One definition rather than a copy per document, because the point of the issue was that the
 * two heroes behaved differently for whoever was editing them — a second copy is how they
 * would drift again.
 *
 * Three is the cap: the hero has room for three across at large sizes without the row wrapping
 * into the subtitle, and `HeroLinks` truncates to the same number in case a document saved
 * before this rule existed carries more.
 *
 * `allowRelative` is what makes an in-app destination expressible at all. Sanity's default
 * `url` rule accepts only absolute http(s), so `/kalender` was rejected in the Studio and an
 * editor had no way to link to another page of this site except by pasting the deployed URL —
 * which `isInternalLink` does understand, and which still works.
 */
export const heroLinksField = defineField({
  title: 'Lenker',
  name: 'links',
  type: 'array',
  description: 'Knapper som vises i hero-seksjonen. Maks tre. Valgfritt.',
  validation: (rule) => rule.max(3).error('Hero-seksjonen viser maks tre knapper'),
  of: [
    {
      type: 'object',
      fields: [
        defineField({
          title: 'Knappetekst',
          name: 'label',
          type: 'string',
          description: 'Tekst som vises på knappen.',
          validation: (rule) => rule.required().error('Knappen må ha en tekst'),
        }),
        defineField({
          title: 'Lenke',
          name: 'url',
          type: 'url',
          description:
            'Sti til en side på nettstedet, for eksempel /kalender, eller full adresse til et annet nettsted. Lenker til andre nettsteder åpnes i ny fane.',
          validation: (rule) =>
            rule
              .required()
              .error('Knappen må ha en lenke')
              .uri({ allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel'] }),
        }),
      ],
      preview: { select: { title: 'label', subtitle: 'url' } },
    },
  ],
});
