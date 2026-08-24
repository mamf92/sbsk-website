import { defineField, defineType } from 'sanity';

export const aboutPageType = defineType({
  name: 'aboutPage',
  title: 'Om oss',
  type: 'document',
  fields: [
    defineField({
      title: 'Bilde',
      name: 'image',
      type: 'image',
      description: 'Bildet øverst på siden. Valgfritt.',
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
      title: 'Tittel - Om klubben',
      name: 'clubTitle',
      type: 'string',
      validation: (rule) => rule.max(60).error('Tittelen må være på maks 60 tegn'),
    }),
    defineField({
      title: 'Ingress - Om klubben',
      name: 'clubIntro',
      type: 'text',
      description: 'Kort, uthevet innledning rett under tittelen. Valgfritt.',
      validation: (rule) => rule.max(300).error('Ingressen må være på maks 300 tegn'),
    }),
    defineField({
      title: 'Brødtekst - Om klubben',
      name: 'clubBody',
      type: 'array',
      description: 'Ett avsnitt per rad. Valgfritt.',
      of: [{ type: 'text' }],
    }),
    defineField({
      title: 'Tittel - Om styret',
      name: 'boardTitle',
      type: 'string',
      validation: (rule) => rule.max(60).error('Tittelen må være på maks 60 tegn'),
    }),
    defineField({
      title: 'Ingress - Om styret',
      name: 'boardIntro',
      type: 'text',
      description: 'Kort innledning over styremedlemmene. Valgfritt.',
      validation: (rule) => rule.max(300).error('Ingressen må være på maks 300 tegn'),
    }),
  ],
});
