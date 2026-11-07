import { defineField, defineType } from 'sanity';
import { hotspotHint } from './sharedFields';

export const gameType = defineType({
  name: 'game',
  title: 'Spill',
  type: 'document',
  fieldsets: [
    {
      name: 'players',
      title: 'Antall spillere',
      description: 'Vises som «2–4 spillere» på kortet, og brukes av filteret på Våre spill.',
      options: { columns: 2 },
    },
    {
      name: 'links',
      title: 'Lenker',
      description: 'Valgfritt. Hver lenke blir en knapp på spillkortet.',
    },
  ],
  fields: [
    defineField({
      title: 'Navn på spillet',
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required().error('Skriv navnet på spillet'),
    }),
    defineField({
      title: 'Sjanger',
      name: 'genre',
      type: 'string',
      description: 'Valgfritt. Vises over navnet på kortet, f.eks. «Strategi · Motorbygging».',
    }),
    defineField({
      title: 'Kort beskrivelse',
      name: 'description',
      type: 'text',
      rows: 3,
      description: 'Valgfritt. Én-to setninger om spillet. Maks 200 tegn.',
      validation: (rule) => rule.max(200).error('Beskrivelsen kan være maks 200 tegn'),
    }),
    defineField({
      title: 'Bilde av esken',
      name: 'image',
      type: 'image',
      description: `Vises på spillkortet. ${hotspotHint}`,
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
        direction: 'horizontal',
      },
      initialValue: 2,
      validation: (rule) => rule.required().min(1).max(3),
    }),
    defineField({
      title: 'Spilletid i minutter',
      name: 'time',
      type: 'string',
      description:
        'Ett tall eller et spenn, f.eks. «30» eller «40–70». «min» legges til på kortet.',
      validation: (rule) => rule.required().error('Skriv omtrent hvor lang tid spillet tar'),
    }),
    defineField({
      title: 'Minst',
      name: 'playersMin',
      type: 'number',
      fieldset: 'players',
      validation: (rule) => rule.required().error('Skriv minste antall spillere').min(1).integer(),
    }),
    defineField({
      title: 'Flest',
      name: 'playersMax',
      type: 'number',
      fieldset: 'players',
      validation: (rule) =>
        rule
          .required()
          .error('Skriv høyeste antall spillere')
          .min(1)
          .integer()
          .custom((max, context) => {
            const min = (context.document as { playersMin?: number })?.playersMin;
            if (typeof min === 'number' && typeof max === 'number' && max < min) {
              return '«Flest» kan ikke være lavere enn «Minst».';
            }
            return true;
          }),
    }),
    defineField({
      title: 'Kjøp spillet',
      name: 'buyUrl',
      type: 'url',
      fieldset: 'links',
      description:
        'Lenke til spillet hos sponsoren. Står det tomt, går knappen til sponsorens forside.',
    }),
    defineField({
      title: 'BoardGameGeek',
      name: 'bggUrl',
      type: 'url',
      fieldset: 'links',
      description: 'Lenke til spillets side på boardgamegeek.com.',
    }),
    defineField({
      title: 'Forklaringsvideo',
      name: 'videoUrl',
      type: 'url',
      fieldset: 'links',
      description: 'Lenke til en video som forklarer reglene, f.eks. på YouTube.',
    }),
  ],
  orderings: [{ title: 'Navn A–Å', name: 'titleAsc', by: [{ field: 'title', direction: 'asc' }] }],
  preview: { select: { title: 'title', subtitle: 'genre', media: 'image' } },
});
