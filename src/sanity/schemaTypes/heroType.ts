import { defineField, defineType } from 'sanity';
import { heroLinksField } from './heroLinksField';
import { pageImageField, pageSubtitleField, pageTitleField } from './pageTopFields';
import { imageCreditField } from './sharedFields';

// `homeHero` stays the stored type name so the live site keeps reading the same documents. The
// editor only ever sees the title.
export const homeHeroType = defineType({
  name: 'homeHero',
  title: 'Toppen av forsiden',
  type: 'document',
  fields: [
    pageTitleField('Stavanger Brettspillklubb'),
    pageSubtitleField(100),
    pageImageField,
    imageCreditField,
    heroLinksField,
    defineField({
      title: 'Sponsorer',
      name: 'sponsors',
      type: 'array',
      description:
        'Valgfritt. Logoer som vises under «Vi samarbeider med:» nederst i toppen av forsiden.',
      of: [
        {
          type: 'object',
          title: 'Sponsor',
          fields: [
            defineField({
              title: 'Sponsorens navn',
              name: 'name',
              type: 'string',
              description: 'Leses opp for blinde og svaksynte i stedet for logoen.',
              validation: (rule) => rule.required().error('Skriv sponsorens navn'),
            }),
            defineField({
              title: 'Logo',
              name: 'logoImage',
              type: 'image',
              validation: (rule) => rule.required().error('Last opp sponsorens logo'),
            }),
            defineField({
              title: 'Sponsorens nettside',
              name: 'websiteUrl',
              type: 'url',
              description: 'Dit man kommer ved å trykke på logoen.',
              validation: (rule) =>
                rule
                  .required()
                  .error('Legg inn sponsorens nettside')
                  .uri({ scheme: ['http', 'https'] }),
            }),
          ],
          preview: { select: { title: 'name', subtitle: 'websiteUrl', media: 'logoImage' } },
        },
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Toppen av forsiden' }) },
});
