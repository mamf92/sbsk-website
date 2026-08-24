import { defineField, defineType } from 'sanity';

export const boardMemberType = defineType({
  name: 'boardMember',
  title: 'Styremedlem',
  type: 'document',
  fields: [
    defineField({
      title: 'Navn',
      name: 'name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Rolle',
      name: 'role',
      type: 'string',
      description: 'F.eks. «Leder» eller «Kasserer». Valgfritt.',
    }),
    defineField({
      title: 'Bio',
      name: 'bio',
      type: 'text',
      description: 'Én-to setninger. Valgfritt.',
      validation: (rule) => rule.max(200).error('Bioen må være på maks 200 tegn'),
    }),
    defineField({
      title: 'Bilde',
      name: 'image',
      type: 'image',
      description: 'Portrettbilde. Faller tilbake til navnets forbokstaver. Valgfritt.',
      options: { hotspot: true },
    }),
    defineField({
      title: 'Rekkefølge',
      name: 'order',
      type: 'number',
      description: 'Styrer rekkefølgen på kortene, lavest først. Valgfritt.',
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'role', media: 'image' },
  },
});
