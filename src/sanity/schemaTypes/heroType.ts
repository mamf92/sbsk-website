import { defineField, defineType } from 'sanity';

export const homeHeroType = defineType({
  name: 'homeHero',
  title: 'Hjemmeside - Hero',
  type: 'document',

  fields: [
    defineField({
      title: 'Tittel',
      name: 'title',
      type: 'string',
      validation: (rule) => rule.max(60).error('Tittelen må være på maks 60 tegn'),
    }),
    defineField({
      title: 'Undertittel',
      name: 'subtitle',
      type: 'string',
      validation: (rule) => rule.max(100).error('Undertittelen må være på maks 100 tegn'),
    }),
    defineField({
      title: 'Bilde',
      name: 'image',
      type: 'image',
      description: 'Bilde som vises i hero-seksjonen. Valgfritt.',
      options: { hotspot: true },
    }),
    defineField({
      title: 'Bildekilde',
      name: 'imageSource',
      type: 'object',
      description: 'Kilde for bildet (f.eks. fotografens navn og nettsted). Valgfritt.',
      fields: [
        {
          title: 'Bildekilde navn',
          name: 'imageSourceName',
          type: 'string',
          description: 'Navn på kilden for bildet.',
        },
        {
          title: 'Bildekilde URL',
          name: 'imageSourceUrl',
          type: 'url',
          description: 'URL til kilden for bildet.',
        },
      ],
    }),
    defineField({
      title: 'Lenker',
      name: 'links',
      type: 'array',
      description: 'Lenker som vises i hero-seksjonen som knapper. Valgfritt.',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              type: 'string',
              description: 'Tekst som vises på knappen.',
            }),
            defineField({ name: 'url', type: 'url', description: 'URL for lenken.' }),
          ],
        },
      ],
    }),
    defineField({
      title: 'Sponsorer',
      name: 'sponsors',
      type: 'array',
      description: 'Sponsorer som vises i hero-seksjonen. Valgfritt.',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'name',
              type: 'string',
              description: 'Navn på sponsoren. Valgfritt.',
            }),
            defineField({
              name: 'logoImage',
              type: 'image',
              description: 'Logoen til sponsoren. Valgfritt.',
            }),
            defineField({
              name: 'websiteUrl',
              type: 'url',
              description: 'Lenke til sponsorens nettsted. Valgfritt.',
            }),
          ],
        },
      ],
    }),
  ],
});
