import { defineField, defineType } from 'sanity';
import { postImageFields, postImagePreview } from './postImageFields';
import { buttonLinksField, hotspotHint, richTextBlock } from './sharedFields';

export const postType = defineType({
  name: 'post',
  title: 'Innlegg',
  type: 'document',
  fields: [
    defineField({
      title: 'Tittel',
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required().error('Innlegget må ha en tittel'),
    }),
    defineField({
      title: 'Ingress',
      name: 'subtitle',
      type: 'text',
      rows: 3,
      description:
        'En kort oppsummering på én-to setninger. Vises under tittelen i oversikten over innlegg. Maks 160 tegn.',
      validation: (rule) => rule.max(160).error('Ingressen kan være maks 160 tegn'),
    }),
    defineField({
      title: 'Publiseringsdato',
      name: 'publishedAt',
      type: 'datetime',
      description: 'Vises på innlegget. Innleggene sorteres etter denne datoen, nyeste først.',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Kategori',
      name: 'category',
      type: 'string',
      description: 'Bestemmer fargen på kortet og hvilket filter innlegget dukker opp under.',
      options: {
        list: [
          { title: 'Nyheter', value: 'nyheter' },
          { title: 'Spillkveldrapport', value: 'spillkveldrapporter' },
          { title: 'Arrangementer', value: 'arrangementer' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required().error('Velg en kategori'),
    }),
    defineField({
      title: 'Bilder øverst',
      name: 'carousel',
      type: 'array',
      description: `Valgfritt. Flere bilder fra samme anledning, som leseren blar gjennom øverst i innlegget. ${hotspotHint}`,
      options: { layout: 'grid' },
      of: [
        {
          type: 'image',
          title: 'Bilde',
          options: { hotspot: true },
          fields: postImageFields,
          preview: postImagePreview,
        },
      ],
      validation: (rule) => rule.max(12).error('Det er plass til maks 12 bilder'),
    }),
    defineField({
      title: 'Tekst',
      name: 'content',
      type: 'array',
      description:
        'Selve innlegget. Sett inn et bilde mellom avsnittene med bildeknappen i verktøylinjen. Det første bildet i teksten blir miniatyrbilde i oversikten, ellers det første av «Bilder øverst».',
      of: [
        richTextBlock,
        // Drop a photo where it belongs in the text. It always fills the text column: no
        // floating beside the paragraph, so there is no layout choice for the editor to make and
        // nothing for the text to squeeze around on a narrow screen. Size and crop are decided by
        // the site; the hotspot is the one framing choice an editor is actually equipped to make.
        {
          name: 'image',
          title: 'Bilde',
          type: 'image',
          options: { hotspot: true },
          description: `Bildet vises der du plasserer det i teksten, i hele tekstens bredde. ${hotspotHint}`,
          fields: postImageFields,
          preview: postImagePreview,
        },
      ],
    }),
    buttonLinksField({
      description:
        'Valgfritt. Knapper som vises på innlegget, f.eks. til påmelding eller et Facebook-arrangement.',
    }),
  ],
  orderings: [
    {
      title: 'Nyeste først',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'publishedAt', media: 'carousel.0' },
  },
});
