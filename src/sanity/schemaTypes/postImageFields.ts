import { defineField } from 'sanity';

// Shared by the inline `content` image and the `carousel` field on `postType.ts`, so the two
// can't drift apart. `alignment` is deliberately not here — it only means something for an
// image sitting inline in running text; a carousel image's layout is decided by the carousel
// itself.
export const postImageFields = [
  defineField({
    title: 'Alt-tekst',
    name: 'alt',
    type: 'string',
    description:
      'Beskriv hva bildet viser, for lesere som bruker skjermleser. Vises ikke på siden.',
    validation: (rule) => rule.required(),
  }),
  defineField({
    title: 'Bildetekst',
    name: 'caption',
    type: 'string',
    description: 'Teksten som står under bildet på siden. Valgfritt.',
  }),
  defineField({
    title: 'Bildekilde navn',
    name: 'imageSourceName',
    type: 'string',
    description: 'Navn på kilden for bildet.',
  }),
  defineField({
    title: 'Bildekilde URL',
    name: 'imageSourceUrl',
    type: 'url',
    description: 'URL til kilden for bildet.',
  }),
];

export const postImagePreview = {
  select: { media: 'asset', title: 'caption', subtitle: 'alt' },
};
