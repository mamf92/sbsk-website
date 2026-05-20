import { defineField, defineType } from 'sanity';
import ExternalLink from '../../assets/icons/symbols/external-link.svg?react';

export const postType = defineType({
  name: 'post',
  title: 'Innlegg',
  type: 'document',
  fields: [
    defineField({
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
      name: 'publishedAt',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Innhold',
      name: 'content',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'Heading 1', value: 'h2' },
            { title: 'Heading 2', value: 'h3' },
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
                title: 'Extern lenke',
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
        {
          name: 'image',
          title: 'Bilde',
          type: 'image',
          options: { hotspot: true },
          fields: [
            {
              title: 'Bildetekst',
              name: 'alt',
              type: 'string',
              description:
                'Beskrivelse av bildet for tilgjengelighet og SEO. Valgfritt, men anbefales.',
            },
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
        },
      ],
    }),
  ],
});
