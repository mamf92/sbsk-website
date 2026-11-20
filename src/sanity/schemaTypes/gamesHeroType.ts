import { defineField, defineType } from 'sanity';
import { heroLinksField } from './heroLinksField';

export const gamesHeroType = defineType({
  name: 'gamesHero',
  title: 'Brettspill - Forsidebilde',
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
      type: 'text',
      validation: (rule) => rule.max(200).error('Undertittelen må være på maks 200 tegn'),
    }),
    defineField({
      title: 'Bilde',
      name: 'image',
      type: 'image',
      description: 'Bakgrunnsbilde for forsidebildet. Valgfritt.',
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
          title: 'Lenke til bildekilden',
          name: 'imageSourceUrl',
          type: 'url',
          description: 'Nettadressen der bildet er hentet fra.',
        },
      ],
    }),
    heroLinksField,
  ],
});
