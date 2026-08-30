import { defineField, defineType } from 'sanity';

export const gameType = defineType({
  name: 'game',
  title: 'Spill',
  type: 'document',
  fields: [
    defineField({
      title: 'Tittel',
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Sjanger',
      name: 'genre',
      type: 'string',
      description: 'F.eks. «Strategi · Motorbygging». Vises over tittelen på kortet. Valgfritt.',
    }),
    defineField({
      title: 'Beskrivelse',
      name: 'description',
      type: 'text',
      description: 'Én-to setninger om spillet. Valgfritt.',
      validation: (rule) => rule.max(200).error('Beskrivelsen må være på maks 200 tegn'),
    }),
    defineField({
      title: 'Bilde',
      name: 'image',
      type: 'image',
      description: 'Bilde av spillesken. Vises på spillkortet.',
      options: { hotspot: true },
    }),
    defineField({
      title: 'Vanskelighetsgrad',
      name: 'difficulty',
      type: 'number',
      options: {
        list: [
          { title: 'Lett', value: 1 },
          { title: 'Middels', value: 2 },
          { title: 'Avansert', value: 3 },
        ],
        layout: 'radio',
      },
      initialValue: 2,
      validation: (rule) => rule.required().min(1).max(3),
    }),
    defineField({
      title: 'Spilletid',
      name: 'time',
      type: 'string',
      description: 'Vises som tekst, f.eks. «40–70». Enheten (min) legges på av kortet.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Antall spillere (tekst)',
      name: 'players',
      type: 'string',
      description: 'Vises som tekst på kortet, f.eks. «2–4».',
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Minste antall spillere',
      name: 'playersMin',
      type: 'number',
      description: 'Brukes av spillerantall-filteret, ikke vist direkte.',
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      title: 'Høyeste antall spillere',
      name: 'playersMax',
      type: 'number',
      description: 'Brukes av spillerantall-filteret, ikke vist direkte.',
      validation: (rule) =>
        rule
          .required()
          .min(1)
          .custom((max, context) => {
            const min = (context.document as { playersMin?: number })?.playersMin;
            if (typeof min === 'number' && typeof max === 'number' && max < min) {
              return 'Høyeste antall spillere kan ikke være lavere enn minste antall.';
            }
            return true;
          }),
    }),
    defineField({
      title: 'Kjøpslenke',
      name: 'buyUrl',
      type: 'url',
      description:
        'Lenke til spillet hos sponsoren. Valgfritt — faller tilbake til sponsorens forside.',
    }),
    defineField({
      title: 'BoardGameGeek-lenke',
      name: 'bggUrl',
      type: 'url',
      description: 'Lenke til spillets side på BoardGameGeek. Valgfritt.',
    }),
    defineField({
      title: 'Video-lenke',
      name: 'videoUrl',
      type: 'url',
      description: 'Lenke til en forklaringsvideo, f.eks. på YouTube. Valgfritt.',
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'genre', media: 'image' },
  },
});
