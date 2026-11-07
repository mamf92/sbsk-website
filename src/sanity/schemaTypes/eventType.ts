import { defineField, defineType } from 'sanity';
import type { ConditionalPropertyCallbackContext } from 'sanity';
import { buttonLinksField, hotspotHint, richTextBlock } from './sharedFields';

// Fields that only appear on the event's own page are hidden until "Egen arrangementsside" is
// switched on, so a plain spillkveld is a short form and nobody fills in a price list that is
// never shown.
const withoutDetailPage = ({ document }: ConditionalPropertyCallbackContext) =>
  !document?.hasDetailPage;

const categoryOptions = [
  { title: 'Spillkveld', value: 'spillkveld' },
  { title: 'Turnering', value: 'turnering' },
  { title: 'Annet', value: 'annet' },
];

export const eventType = defineType({
  name: 'event',
  title: 'Arrangement',
  type: 'document',
  groups: [
    { name: 'basics', title: 'Hva, når og hvor', default: true },
    { name: 'page', title: 'Egen arrangementsside' },
  ],
  fields: [
    defineField({
      title: 'Tittel',
      name: 'title',
      type: 'string',
      group: 'basics',
      validation: (rule) => rule.required().error('Arrangementet må ha en tittel'),
    }),
    defineField({
      title: 'Type arrangement',
      name: 'category',
      type: 'string',
      group: 'basics',
      description: 'Bestemmer fargen i kalenderen og hvilket filter arrangementet havner under.',
      options: { list: categoryOptions, layout: 'radio' },
      validation: (rule) => rule.required().error('Velg en type'),
    }),
    defineField({
      title: 'Starter',
      name: 'eventStartTime',
      type: 'datetime',
      group: 'basics',
      validation: (rule) => rule.required().error('Velg når arrangementet starter'),
    }),
    defineField({
      title: 'Slutter',
      name: 'eventEndTime',
      type: 'datetime',
      group: 'basics',
      description: 'Arrangementet forsvinner fra «Kommende» når denne tiden har passert.',
      validation: (rule) =>
        rule
          .required()
          .error('Velg når arrangementet slutter')
          .min(rule.valueOfField('eventStartTime'))
          .error('Arrangementet kan ikke slutte før det starter'),
    }),
    defineField({
      title: 'Sted',
      name: 'location',
      type: 'string',
      group: 'basics',
      description: 'F.eks. «Sølvberget, 3. etasje».',
      validation: (rule) => rule.required().error('Skriv hvor arrangementet er'),
    }),
    defineField({
      title: 'Beskrivelse',
      name: 'content',
      type: 'array',
      group: 'basics',
      description:
        'Valgfritt. Vises når noen åpner arrangementet i kalenderen, og på arrangementssiden.',
      of: [richTextBlock],
    }),
    defineField({
      title: 'Bilde',
      name: 'image',
      type: 'image',
      group: 'basics',
      description: `Valgfritt. Vises når noen åpner arrangementet i kalenderen, og øverst på arrangementssiden. ${hotspotHint}`,
      options: { hotspot: true },
    }),
    buttonLinksField({
      description:
        'Valgfritt. Knapper som vises når noen åpner arrangementet i kalenderen, f.eks. til Facebook-arrangementet.',
    }),

    defineField({
      title: 'Egen arrangementsside',
      name: 'hasDetailPage',
      type: 'boolean',
      group: ['basics', 'page'],
      description:
        'Skru på for å gi arrangementet en egen side med påmeldingsknapp, program, priser og sponsorer. Kalenderen får da en «Se arrangementet»-knapp. Passer for alt med mer innhold enn beskrivelsen, uansett størrelse.',
      initialValue: false,
    }),
    defineField({
      title: 'Nettadresse',
      name: 'slug',
      type: 'slug',
      group: 'page',
      description:
        'Siste del av adressen til arrangementssiden, f.eks. «board-game-masters-2026». Trykk på knappen ved siden av feltet for å lage den fra tittelen. Endrer du den senere, slutter gamle lenker å virke.',
      options: { source: 'title', maxLength: 96 },
      hidden: withoutDetailPage,
      validation: (rule) =>
        rule.custom((slug, context) => {
          const hasDetailPage = (context.document as { hasDetailPage?: boolean })?.hasDetailPage;
          return hasDetailPage && !slug?.current
            ? 'Arrangementssiden trenger en nettadresse'
            : true;
        }),
    }),
    defineField({
      title: 'Påmeldingsknapp',
      name: 'signupUrl',
      type: 'object',
      group: 'page',
      description:
        'Den store knappen øverst på arrangementssiden, f.eks. til påmelding i Spond. Vises bare når lenken er fylt ut.',
      hidden: withoutDetailPage,
      fields: [
        defineField({
          title: 'Knappetekst',
          name: 'label',
          type: 'string',
          initialValue: 'Meld deg på',
        }),
        defineField({
          title: 'Lenke',
          name: 'url',
          type: 'url',
          description: 'Hele adressen, f.eks. https://spond.com/….',
          validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
        }),
      ],
    }),
    defineField({
      title: 'Program',
      name: 'programInfo',
      type: 'array',
      group: 'page',
      description: 'Valgfritt. Hva som skjer på arrangementet. Vises som en egen boks.',
      hidden: withoutDetailPage,
      of: [richTextBlock],
    }),
    defineField({
      title: 'Priser',
      name: 'pricingInfo',
      type: 'array',
      group: 'page',
      description: 'Valgfritt. Hva det koster å delta. Vises som en egen boks.',
      hidden: withoutDetailPage,
      of: [richTextBlock],
    }),
    defineField({
      title: 'Tidsplan',
      name: 'schedule',
      type: 'array',
      group: 'page',
      description:
        'Valgfritt. For arrangementer over flere dager eller med flere programposter, f.eks. «Dag 1» og «Dag 2».',
      hidden: withoutDetailPage,
      of: [
        {
          type: 'object',
          title: 'Programpost',
          fields: [
            defineField({
              title: 'Navn',
              name: 'label',
              type: 'string',
              description: 'F.eks. «Dag 1» eller «Finale».',
              validation: (rule) => rule.required().error('Gi programposten et navn'),
            }),
            defineField({
              title: 'Starter',
              name: 'startTime',
              type: 'datetime',
              validation: (rule) => rule.required(),
            }),
            defineField({
              title: 'Slutter',
              name: 'endTime',
              type: 'datetime',
              validation: (rule) => rule.required(),
            }),
            defineField({
              title: 'Sted',
              name: 'location',
              type: 'string',
              description: 'Valgfritt. Fyll bare ut hvis stedet er et annet enn for arrangementet.',
            }),
          ],
          preview: { select: { title: 'label', subtitle: 'startTime' } },
        },
      ],
    }),
    defineField({
      title: 'Vis sponsorer',
      name: 'showSponsors',
      type: 'boolean',
      group: 'page',
      description: 'Skru på for å vise en rad med sponsorlogoer på arrangementssiden.',
      hidden: withoutDetailPage,
      initialValue: false,
    }),
    defineField({
      title: 'Sponsorer',
      name: 'sponsors',
      type: 'array',
      group: 'page',
      hidden: ({ document }) => {
        const doc = document as { hasDetailPage?: boolean; showSponsors?: boolean } | undefined;
        return !doc?.hasDetailPage || !doc.showSponsors;
      },
      of: [
        {
          type: 'object',
          title: 'Sponsor',
          fields: [
            defineField({
              title: 'Logo',
              name: 'logo',
              type: 'image',
              validation: (rule) => rule.required().error('Last opp sponsorens logo'),
            }),
            defineField({
              title: 'Sponsorens navn',
              name: 'altText',
              type: 'string',
              description: 'Leses opp for blinde og svaksynte i stedet for logoen.',
              validation: (rule) => rule.required().error('Skriv sponsorens navn'),
            }),
            defineField({
              title: 'Sponsorens nettside',
              name: 'link',
              type: 'url',
              description: 'Valgfritt. Dit man kommer ved å trykke på logoen.',
              validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
            }),
            defineField({
              title: 'Tilbud',
              name: 'ctaLabel',
              type: 'string',
              description:
                'Valgfritt. En knapp under logoen, f.eks. «Få 10 % rabatt hos Outland». Knappen går til sponsorens nettside, eller til lenken under.',
            }),
            defineField({
              title: 'Lenke til tilbudet',
              name: 'ctaLink',
              type: 'url',
              description:
                'Valgfritt. Fyll bare ut hvis tilbudet ligger på en annen side enn nettsiden over.',
              validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
            }),
          ],
          preview: { select: { title: 'altText', subtitle: 'ctaLabel', media: 'logo' } },
        },
      ],
    }),
  ],
  orderings: [
    {
      title: 'Starttid, nyeste først',
      name: 'eventStartTimeDesc',
      by: [{ field: 'eventStartTime', direction: 'desc' }],
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'eventStartTime', media: 'image' },
  },
});
