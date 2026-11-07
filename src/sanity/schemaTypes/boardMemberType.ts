import { defineField, defineType } from 'sanity';
import { hotspotHint } from './sharedFields';

export const boardMemberType = defineType({
  name: 'boardMember',
  title: 'Styremedlem',
  type: 'document',
  fields: [
    defineField({
      title: 'Navn',
      name: 'name',
      type: 'string',
      validation: (rule) => rule.required().error('Skriv navnet'),
    }),
    defineField({
      title: 'Verv',
      name: 'role',
      type: 'string',
      description: 'Valgfritt. F.eks. «Leder» eller «Kasserer».',
    }),
    defineField({
      title: 'Om personen',
      name: 'bio',
      type: 'text',
      rows: 3,
      description: 'Valgfritt. Én-to setninger. Maks 200 tegn.',
      validation: (rule) => rule.max(200).error('Teksten kan være maks 200 tegn'),
    }),
    defineField({
      title: 'Portrettbilde',
      name: 'image',
      type: 'image',
      description: `Valgfritt. Uten bilde vises forbokstavene i navnet. ${hotspotHint}`,
      options: { hotspot: true },
    }),
    defineField({
      title: 'Plassering',
      name: 'order',
      type: 'number',
      description:
        'Valgfritt. Bestemmer rekkefølgen på Om oss-siden: 1 vises først, så 2 og så videre.',
    }),
  ],
  orderings: [
    { title: 'Plassering', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
  ],
  preview: { select: { title: 'name', subtitle: 'role', media: 'image' } },
});
