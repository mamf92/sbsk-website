import { defineField, defineType } from 'sanity';
import type { Rule } from 'sanity';
import ExternalLink from '../../assets/icons/symbols/external-link.svg?react';
import AddLink from '../../assets/icons/symbols/add-link.svg?react';

// Shared by `content`, `pricingInfo` and `programInfo` below — three portable-text fields that
// all want the same block/list/mark configuration. Defined once here rather than repeated
// three times over in the same file.
const richTextBlocks = [
  {
    type: 'block',
    styles: [
      { title: 'Normal', value: 'normal' },
      { title: 'Heading 1', value: 'h2' },
      { title: 'Heading 2', value: 'h3' },
    ],
    lists: [
      { title: 'Bullet', value: 'bullet' },
      { title: 'Numbered', value: 'number' },
    ],
    marks: {
      decorators: [
        { title: 'Strong', value: 'strong' },
        { title: 'Underline', value: 'underline' },
        { title: 'Emphasis', value: 'em' },
      ],
      annotations: [
        {
          name: 'link',
          type: 'object',
          title: 'Ekstern lenke',
          icon: ExternalLink,
          description: 'Brukes for lenker til eksterne nettsider',
          fields: [
            {
              name: 'url',
              type: 'url',
              validation: (rule: Rule) => rule.uri({ scheme: ['http', 'https'] }),
            },
          ],
        },
        {
          name: 'internalLink',
          type: 'object',
          title: 'Intern lenke',
          icon: AddLink,
          description: 'Brukes for lenker til andre sider på nettstedet',
          fields: [
            {
              name: 'url',
              type: 'url',
              validation: (rule: Rule) =>
                rule.uri({ scheme: ['http', 'https'], allowRelative: true }),
            },
          ],
        },
      ],
    },
  },
];

export const eventType = defineType({
  name: 'event',
  title: 'Arrangement',
  type: 'document',
  fields: [
    defineField({
      title: 'Tittel',
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Arrangementbeskrivelse',
      name: 'content',
      description: 'Beskrivelse av arrangementet. Valgfritt.',
      type: 'array',
      of: richTextBlocks,
    }),
    defineField({
      title: 'Publiseringsdato',
      name: 'publishedAt',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Starttid',
      name: 'eventStartTime',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Sluttid',
      name: 'eventEndTime',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Kategori',
      name: 'category',
      type: 'string',
      options: {
        list: [
          { title: 'Spillkveld', value: 'spillkveld' },
          { title: 'Turnering', value: 'turnering' },
          { title: 'Annet', value: 'annet' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Sted',
      name: 'location',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Bilde',
      name: 'image',
      type: 'image',
      description:
        'Bilde som vises i arrangementskortet og som toppbilde på arrangementssiden. Valgfritt.',
      options: { hotspot: true },
    }),

    defineField({
      title: 'Egen arrangementsside',
      name: 'hasDetailPage',
      type: 'boolean',
      description:
        'Skru på for å gi arrangementet sin egen side, lenket fra kalenderen. Uavhengig av kategori og størrelse — en liten spillkveld kan få en side hvis noe spesielt skjer, og en stor helg trenger den ikke hvis den ikke har mer innhold enn beskrivelsen over.',
      initialValue: false,
    }),
    defineField({
      title: 'Påmeldingslenke',
      name: 'signupUrl',
      type: 'object',
      description:
        'Hovedknappen på arrangementssiden, f.eks. til påmelding i Spond. Valgfritt — knappen vises ikke uten en URL.',
      fields: [
        defineField({
          name: 'label',
          type: 'string',
          title: 'Knappetekst',
          initialValue: 'Meld deg på',
        }),
        defineField({
          name: 'url',
          type: 'url',
          title: 'URL',
          validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
        }),
      ],
    }),
    defineField({
      title: 'Vis sponsorer',
      name: 'showSponsors',
      type: 'boolean',
      description: 'Skru på for å vise sponsorbåndet og legge til sponsorer under.',
      initialValue: false,
    }),
    defineField({
      title: 'Sponsorer',
      name: 'sponsors',
      type: 'array',
      description: 'Vises som store logoer på sponsorbåndet på arrangementssiden.',
      hidden: ({ parent }) => !(parent as { showSponsors?: boolean } | undefined)?.showSponsors,
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'logo',
              type: 'image',
              title: 'Logo',
              options: { hotspot: true },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'altText',
              type: 'string',
              title: 'Alt-tekst',
              description: 'Beskriv logoen for skjermlesere, f.eks. "Outland sin logo".',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'link',
              type: 'url',
              title: 'Lenke',
              description: 'Dit logoen tar deg når du klikker. Valgfritt.',
              validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
            }),
            defineField({
              name: 'ctaLabel',
              type: 'string',
              title: 'Tilbudstekst',
              description: 'F.eks. "Få 10 % rabatt hos Outland". Valgfritt.',
            }),
            defineField({
              name: 'ctaLink',
              type: 'url',
              title: 'Tilbudslenke',
              description: 'Lenke tilbudsteksten peker til, hvis ulik logoens lenke. Valgfritt.',
              validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
            }),
          ],
          preview: {
            select: { title: 'altText', media: 'logo' },
          },
        },
      ],
    }),
    defineField({
      title: 'Priser',
      name: 'pricingInfo',
      type: 'array',
      description: 'Prisoversikt for arrangementet. Valgfritt — vises som eget kort.',
      of: richTextBlocks,
    }),
    defineField({
      title: 'Program',
      name: 'programInfo',
      type: 'array',
      description: 'Programomtale for arrangementet. Valgfritt — vises som eget kort.',
      of: richTextBlocks,
    }),
    defineField({
      title: 'Dagsplan',
      name: 'schedule',
      type: 'array',
      description:
        'Enkeltdager eller økter for flerdagersarrangementer, f.eks. "Dag 1 av BGM". Valgfritt.',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              type: 'string',
              title: 'Tittel',
              description: 'F.eks. "Dag 1 av BGM" eller "Åpningsseremoni".',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'startTime',
              type: 'datetime',
              title: 'Starttid',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'endTime',
              type: 'datetime',
              title: 'Sluttid',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'location',
              type: 'string',
              title: 'Sted',
              description: 'Overstyrer arrangementets sted for denne økten. Valgfritt.',
            }),
          ],
          preview: {
            select: { title: 'label', subtitle: 'startTime' },
          },
        },
      ],
    }),

    defineField({
      title: 'Lenker',
      name: 'links',
      type: 'array',
      description:
        'Legg til lenker relatert til arrangementet, f.eks. Facebook-arrangement. Valgfritt. ',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              type: 'string',
              description: 'Tekst som vises på knappen.',
            }),
            defineField({
              name: 'url',
              type: 'url',
              description: 'URL for lenken.',
              validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
            }),
          ],
        },
      ],
    }),
    defineField({
      title: 'Deltakere',
      name: 'participants',
      type: 'array',
      readOnly: true,
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'supabase_id',
              type: 'string',
              description: 'ID for deltakeren i Supabase.',
            }),
            defineField({ name: 'name', type: 'string', description: 'Fornavn på deltakeren.' }),
            defineField({
              name: 'surname',
              type: 'string',
              description: 'Etternavn på deltakeren.',
            }),
            defineField({
              name: 'photo_url',
              type: 'string',
              description: 'URL til foto av deltakeren.',
            }),
          ],
        },
      ],
    }),
  ],
});
