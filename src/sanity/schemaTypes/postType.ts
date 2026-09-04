import { defineField, defineType } from 'sanity';
import type { Rule } from 'sanity';
import ExternalLink from '../../assets/icons/symbols/external-link.svg?react';
import AddLink from '../../assets/icons/symbols/add-link.svg?react';
import { postImageFields, postImagePreview } from './postImageFields';

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
            defineField({
              name: 'url',
              type: 'url',
              description: 'URL for lenken.',
              validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
            }),
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
                    validation: (rule: Rule) => rule.uri({ scheme: ['http', 'https'] }),
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
                    validation: (rule: Rule) =>
                      rule.uri({ scheme: ['http', 'https'], allowRelative: true }),
                  },
                ],
              },
            ],
          },
        },
        // Drop a photo where it belongs in the text, then choose how it sits: beside the text
        // (it floats, and the paragraph wraps around it — Sanity's own recommended shape for
        // this, see the `alignment` field below) or alone at full width. Size and crop are still
        // decided by the site, not the editor — the hotspot is the one framing choice an editor
        // is actually equipped to make.
        {
          name: 'image',
          title: 'Bilde',
          type: 'image',
          options: { hotspot: true },
          description:
            'Bildet vises der du plasserer det i teksten. Dra i sirkelen under «Hotspot» for å peke ut det viktigste i bildet – da blir det med uansett hvordan bildet beskjæres.',
          fields: [
            ...postImageFields,
            defineField({
              title: 'Plassering',
              name: 'alignment',
              type: 'string',
              description:
                'Høyre/venstre: bildet flyter til siden og teksten renner rundt det, fra ' +
                'nettbrettbredde og oppover. Full bredde: bildet står alene, uten tekst ved siden.',
              options: {
                list: [
                  { title: 'Høyre', value: 'høyre' },
                  { title: 'Venstre', value: 'venstre' },
                  { title: 'Full bredde', value: 'full' },
                ],
                layout: 'radio',
              },
              initialValue: 'høyre',
            }),
          ],
          preview: postImagePreview,
        },
      ],
    }),
    defineField({
      title: 'Bildekarusell',
      name: 'carousel',
      type: 'array',
      description:
        'Valgfritt. Flere bilder fra samme anledning, vist som en karusell øverst i innlegget, ' +
        'med teksten ved siden av på store skjermer. Dra i «Hotspot» for å peke ut det ' +
        'viktigste i hvert bilde.',
      options: { layout: 'grid' },
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: postImageFields,
          preview: postImagePreview,
        },
      ],
      validation: (rule) => rule.max(12),
    }),
  ],
});
