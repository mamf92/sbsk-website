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
        // There is exactly one way to add a photo: drop it in the text where it belongs. The
        // separate main image, the extra-pictures gallery and the left/right placement radio
        // were each a way for a post to come out looking wrong, and none of them had ever been
        // used. Size, crop and placement are decided by the site, not by the editor — the only
        // framing choice left is the hotspot, which is the one an editor is actually equipped
        // to make.
        {
          name: 'image',
          title: 'Bilde',
          type: 'image',
          options: { hotspot: true },
          description:
            'Bildet vises der du plasserer det i teksten. Dra i sirkelen under «Hotspot» for å peke ut det viktigste i bildet – da blir det med uansett hvordan bildet beskjæres.',
          fields: [
            defineField({
              title: 'Alt-tekst',
              name: 'alt',
              type: 'string',
              description:
                'Beskriv hva bildet viser, for lesere som bruker skjermleser. Vises ikke på siden.',
              validation: (rule) => rule.required(),
            }),
            {
              title: 'Bildetekst',
              name: 'caption',
              type: 'string',
              description: 'Teksten som står under bildet på siden. Valgfritt.',
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
          preview: {
            select: { media: 'asset', title: 'caption', subtitle: 'alt' },
          },
        },
      ],
    }),
  ],
});
