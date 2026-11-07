import { defineField, defineType } from 'sanity';
import { pageImageField } from './pageTopFields';
import { imageCreditField } from './sharedFields';

export const aboutPageType = defineType({
  name: 'aboutPage',
  title: 'Om oss-siden',
  type: 'document',
  fieldsets: [
    {
      name: 'club',
      title: 'Om klubben',
      description: 'Første del av siden. Tomme felt viser standardteksten.',
    },
    {
      name: 'board',
      title: 'Om styret',
      description:
        'Teksten over styremedlemmene. Selve styremedlemmene legger du inn under «Styremedlemmer».',
    },
  ],
  fields: [
    pageImageField,
    imageCreditField,
    defineField({
      title: 'Overskrift',
      name: 'clubTitle',
      type: 'string',
      fieldset: 'club',
      validation: (rule) => rule.max(60).error('Overskriften kan være maks 60 tegn'),
    }),
    defineField({
      title: 'Ingress',
      name: 'clubIntro',
      type: 'text',
      rows: 3,
      fieldset: 'club',
      description: 'Kort innledning i større skrift rett under overskriften. Maks 300 tegn.',
      validation: (rule) => rule.max(300).error('Ingressen kan være maks 300 tegn'),
    }),
    defineField({
      title: 'Avsnitt',
      name: 'clubBody',
      type: 'array',
      fieldset: 'club',
      description: 'Resten av teksten. Legg til ett felt per avsnitt.',
      of: [{ type: 'text', title: 'Avsnitt', rows: 4 }],
    }),
    defineField({
      title: 'Overskrift',
      name: 'boardTitle',
      type: 'string',
      fieldset: 'board',
      validation: (rule) => rule.max(60).error('Overskriften kan være maks 60 tegn'),
    }),
    defineField({
      title: 'Ingress',
      name: 'boardIntro',
      type: 'text',
      rows: 3,
      fieldset: 'board',
      description: 'Maks 300 tegn.',
      validation: (rule) => rule.max(300).error('Ingressen kan være maks 300 tegn'),
    }),
  ],
  preview: { prepare: () => ({ title: 'Om oss-siden' }) },
});
