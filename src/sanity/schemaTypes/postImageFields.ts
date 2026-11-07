import { defineField } from 'sanity';
import { imageCreditFields } from './sharedFields';

// Shared by the inline `content` image and the `carousel` field on `postType.ts`, so the two
// can't drift apart. Layout is never an editor choice: an inline image fills the text column,
// and a carousel image's layout is decided by the carousel itself.
export const postImageFields = [
  defineField({
    title: 'Bildebeskrivelse (alt-tekst)',
    name: 'alt',
    type: 'string',
    description:
      'Beskriv kort hva bildet viser, f.eks. «Seks personer rundt et bord med Catan». Leses opp for blinde og svaksynte, og vises ikke på siden.',
    validation: (rule) => rule.required().error('Skriv en kort beskrivelse av bildet.'),
  }),
  defineField({
    title: 'Bildetekst',
    name: 'caption',
    type: 'string',
    description: 'Teksten som står under bildet på siden. Valgfritt.',
  }),
  ...imageCreditFields,
];

export const postImagePreview = {
  select: { media: 'asset', title: 'caption', subtitle: 'alt' },
};
