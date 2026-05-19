import { defineField, defineType } from 'sanity';

export const eventType = defineType({
  name: 'event',
  title: 'Arrangement',
  type: 'document',
  fields: [
    defineField({
      title: 'Tittel',
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Arrangmenentbeskrivelse',
      name: 'bodyparagraph',
      type: 'text',
      description: 'Beskrivelse av arrangementet. Valgfritt.',
    }),
    defineField({
      title: 'Publiseringsdato',
      name: 'publishedAt',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Starttid',
      name: 'eventStartTime',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Sluttid',
      name: 'eventEndTime',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Kategori',
      name: 'category',
      type: 'string',
      options: {
        list: [
          { title: 'Spillkveld', value: 'spillkveld' },
          { title: 'Turnering', value: 'turnering' },
          { title: 'Annet', value: 'annet' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Sted',
      name: 'location',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Bilde',
      name: 'image',
      type: 'image',
      description: 'Bilde som vises i arrangementskortet og på arrangementssiden. Valgfritt.',
      options: { hotspot: true },
    }),

    defineField({
      title: 'Lenker',
      name: 'links',
      type: 'array',
      description:
        'Legg til lenker relatert til arrangementet, f.eks. påmelding eller Facebook-arrangement. Valgfritt. ',
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
  ],
});
