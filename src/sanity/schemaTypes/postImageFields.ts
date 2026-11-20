import { defineField } from 'sanity';

// Shared by the inline `content` image and the `carousel` field on `postType.ts`, so the two
// can't drift apart. `alignment` is deliberately not here — it only means something for an
// image sitting inline in running text; a carousel image's layout is decided by the carousel
// itself.
export const postImageFields = [
  defineField({
    title: 'Bildebeskrivelse (alt-tekst)',
    name: 'alt',
    type: 'string',
    description:
      'Beskriv hva bildet viser, for lesere som bruker skjermleser. Vises ikke på siden. ' +
      'Valgfritt, men anbefalt.',
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
    title: 'Lenke til bildekilden',
    name: 'imageSourceUrl',
    type: 'url',
    description: 'Nettadressen der bildet er hentet fra.',
  }),
];

export const postImagePreview = {
  select: { media: 'asset', title: 'caption', subtitle: 'alt' },
};
