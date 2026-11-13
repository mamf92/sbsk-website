import { defineField, defineType } from 'sanity';
import { richTextBlocks } from './objects/richText';
import { isUniqueAcrossEvents } from './slugAcrossEvents';

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
      options: { source: 'title', isUnique: isUniqueAcrossEvents },
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
      title: 'Egen side for arrangementet',
      name: 'hasDetailPage',
      type: 'boolean',
      description:
        'Av: arrangementet vises bare i kalenderen, og åpnes der det står. På: arrangementet får sin egen side med påmelding, oppmøte og sponsorer, lenket fra kalenderen. Store arrangementer over flere dager med eget program, som Board Game Masters, lages under «Storarrangement» i stedet.',
      initialValue: false,
    }),
    defineField({
      title: 'Påmelding',
      name: 'signup',
      type: 'signup',
      description: 'Vises som hovedknappen på arrangementets egen side. Valgfritt.',
      hidden: ({ document }) => !document?.hasDetailPage,
    }),
    defineField({
      title: 'Oppmøte',
      name: 'venue',
      type: 'venue',
      description:
        'Adresse, hvor man møtes og hvordan man kommer seg dit. Valgfritt – uten dette vises bare «Sted» over.',
      hidden: ({ document }) => !document?.hasDetailPage,
    }),
    defineField({
      title: 'Påmeldingslenke (gammel)',
      name: 'signupUrl',
      type: 'object',
      // Replaced by `signup`. The query still reads it as a fallback, so it stays in the schema
      // until no document uses it (none did when this was written).
      hidden: true,
      deprecated: { reason: 'Bruk «Påmelding».' },
      readOnly: true,
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
      description:
        'Hovedsponsorer vises med stor logo øverst på arrangementssiden, alle sponsorer i en egen del nederst.',
      hidden: ({ parent }) => !(parent as { showSponsors?: boolean } | undefined)?.showSponsors,
      of: [{ type: 'sponsor' }],
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
  ],
});
