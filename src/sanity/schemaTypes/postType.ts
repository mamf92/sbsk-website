import { defineField, defineType } from 'sanity';
import ExternalLink from '../../assets/icons/symbols/external-link.svg?react';
import AddLink from '../../assets/icons/symbols/add-link.svg?react';

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
      name: 'subtitle',
      type: 'text',
      validation: (rule) => rule.max(160).error('Undertittelen må være på maks 160 tegn'),
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
      title: 'Kategori',
      name: 'category',
      type: 'string',
      options: {
        list: [
          { title: 'Nyheter', value: 'nyheter' },
          { title: 'Spillkveldrapporter', value: 'spillkveldrapporter' },
          { title: 'Arrangementer', value: 'arrangementer' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Hovedbilde',
      name: 'mainImage',
      type: 'image',
      options: { hotspot: true },
      description:
        'Bildet som brukes som miniatyrbilde på kortet og som første bilde i galleriet. Brukes ikke i selve teksten – for bilder inni teksten, se «Innhold» lenger ned.',
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
    }),
    defineField({
      title: 'Flere bilder',
      name: 'gallery',
      type: 'array',
      description:
        'Ekstra bilder som vises under hovedbildet. Leseren kan klikke på et av dem for å bytte ut hovedbildet. Valgfritt.',
      of: [
        {
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
        {
          name: 'image',
          title: 'Bilde i teksten',
          type: 'image',
          options: { hotspot: true },
          description:
            'For å illustrere et bestemt avsnitt. Bildet vises ved siden av teksten, ikke i full bredde. For post­ens hovedbilde, bruk «Hovedbilde»-feltet øverst i skjemaet i stedet.',
          fields: [
            {
              title: 'Bildetekst',
              name: 'alt',
              type: 'string',
              description:
                'Beskrivelse av bildet for tilgjengelighet og SEO. Valgfritt, men anbefales.',
            },
            {
              title: 'Plassering',
              name: 'alignment',
              type: 'string',
              description:
                'Høyre: bildet står til høyre, teksten flyter til venstre for det. Venstre: motsatt.',
              options: {
                list: [
                  { title: 'Høyre', value: 'høyre' },
                  { title: 'Venstre', value: 'venstre' },
                ],
                layout: 'radio',
              },
              initialValue: 'høyre',
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
