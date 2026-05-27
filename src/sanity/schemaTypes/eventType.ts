import { defineField, defineType } from 'sanity';
import ExternalLink from '../../assets/icons/symbols/external-link.svg?react';
import AddLink from '../../assets/icons/symbols/add-link.svg?react';

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
      title: 'Arrangementbeskrivelse',
      name: 'content',
      description: 'Beskrivelse av arrangementet. Valgfritt.',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'Heading 1', value: 'h2' },
            { title: 'Heading 2', value: 'h3' },
          ],
          lists: [
            { title: 'Bullet', value: 'bullet' },
            { title: 'Numbered', value: 'number' },
          ],
          marks: {
            decorators: [
              { title: 'Strong', value: 'strong' },
              { title: 'Underline', value: 'underline' },
              { title: 'Emphasis', value: 'em' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Ekstern lenke',
                icon: ExternalLink,
                description: 'Brukes for lenker til eksterne nettsider',
                fields: [
                  {
                    name: 'url',
                    type: 'url',
                  },
                ],
              },
              {
                name: 'internalLink',
                type: 'object',
                title: 'Intern lenke',
                icon: AddLink,
                description: 'Brukes for lenker til andre sider på nettstedet',
                fields: [
                  {
                    name: 'url',
                    type: 'url',
                  },
                ],
              },
            ],
          },
        },
      ],
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
    defineField({
      title: 'Deltakere',
      name: 'participants',
      type: 'array',
      readOnly: true,
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'supabase_id',
              type: 'string',
              description: 'ID for deltakeren i Supabase.',
            }),
            defineField({ name: 'name', type: 'string', description: 'Fornavn på deltakeren.' }),
            defineField({
              name: 'surname',
              type: 'string',
              description: 'Etternavn på deltakeren.',
            }),
            defineField({
              name: 'photo_url',
              type: 'string',
              description: 'URL til foto av deltakeren.',
            }),
          ],
        },
      ],
    }),
  ],
});
