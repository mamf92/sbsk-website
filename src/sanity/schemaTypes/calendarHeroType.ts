import { defineField, defineType } from 'sanity';

export const calendarHeroType = defineType({
  name: 'calendarHero',
  title: 'Kalender - Forsidebilde',
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
      title: 'Komplett bilde',
      name: 'completeImage',
      type: 'object',
      description: 'Legg til bilde med alt-tekst, kilde og lenke til kilden. Valgfritt.',
      fields: [
        {
          title: 'Bilde',
          name: 'image',
          type: 'image',
          options: { hotspot: true },
        },
        {
          title: 'Bildebeskrivelse (alt-tekst)',
          name: 'altText',
          type: 'string',
          description: 'Beskriv bildet for synshemmede og SEO.',
        },
        {
          title: 'Kilde',
          name: 'source',
          type: 'string',
          description: 'Kilden for bildet (f.eks. fotografens navn eller nettsted).',
        },
        {
          title: 'Lenke til kilden',
          name: 'sourceUrl',
          type: 'url',
          description: 'Nettadressen der bildet er hentet fra.',
        },
      ],
    }),
    defineField({
      title: 'Bilde',
      name: 'image',
      type: 'image',
      description: 'Bilde som vises i forsidebildet. Valgfritt.',
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
  ],
});
