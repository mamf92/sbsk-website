import { defineField, defineType } from 'sanity';

export const homeHeroType = defineType({
  name: 'homeHero',
  title: 'Hjemmeside - Hero',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      type: 'string',
    }),
    defineField({
      name: 'subtitle',
      type: 'string',
    }),
    defineField({
      name: 'imageUrl',
      type: 'url',
    }),
    defineField({
      name: 'imageSource',
      type: 'string',
    }),
    defineField({
      name: 'imageSourceUrl',
      type: 'url',
    }),
    defineField({
      name: 'link',
      type: 'array',
      of: [{ type: 'url' }],
    }),
    defineField({
      name: 'sponsors',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'name',
              type: 'string',
            }),
            defineField({
              name: 'logoUrl',
              type: 'url',
            }),
            defineField({
              name: 'websiteUrl',
              type: 'url',
            }),
          ],
        },
      ],
    }),
  ],
});
