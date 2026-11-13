import { defineField, defineType } from 'sanity';

export const SPONSOR_TIERS = [
  { title: 'Hovedsponsor – stor logo øverst på siden', value: 'hovedsponsor' },
  { title: 'Sponsor', value: 'sponsor' },
  { title: 'Partner – mindre logo', value: 'partner' },
] as const;

/**
 * A sponsor on an event or festival page. The field names are the ones the old inline sponsor
 * object on `event` used, so the query and page read old and new items alike. (Old items were
 * stored as `_type: 'object'` and would show as an unknown type in the Studio; no document had
 * any when this replaced it, drafts included, checked 13 Nov 2026.)
 */
export const sponsorType = defineType({
  name: 'sponsor',
  title: 'Sponsor',
  type: 'object',
  fields: [
    defineField({
      name: 'logo',
      type: 'image',
      title: 'Logo',
      description: 'Helst SVG eller stor PNG med gjennomsiktig bakgrunn.',
      options: { hotspot: true },
    }),
    defineField({
      name: 'altText',
      type: 'string',
      title: 'Navn på sponsoren',
      description:
        'Vises når logoen mangler, og leses opp for skjermlesere, f.eks. «Outland». Brukes også til «Presentert av» på programposter.',
      validation: (rule) => rule.required().error('Skriv navnet på sponsoren.'),
    }),
    defineField({
      name: 'tier',
      type: 'string',
      title: 'Hvor synlig skal sponsoren være?',
      options: { list: [...SPONSOR_TIERS], layout: 'radio' },
      initialValue: 'sponsor',
    }),
    defineField({
      name: 'logoOnDark',
      type: 'image',
      title: 'Logo for mørk bakgrunn',
      description:
        'Valgfritt. En lys versjon av logoen, brukt når siden vises i mørk modus. Uten den vises logoen på en hvit flis.',
    }),
    defineField({
      name: 'link',
      type: 'url',
      title: 'Sponsorens nettside',
      description: 'Dit logoen tar deg når du klikker. Valgfritt.',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'ctaLabel',
      type: 'string',
      title: 'Tilbud',
      description: 'Valgfritt, f.eks. «Få 10 % rabatt hos Outland».',
    }),
    defineField({
      name: 'ctaLink',
      type: 'url',
      title: 'Lenke til tilbudet',
      description: 'Valgfritt. Står det tomt, går tilbudet til sponsorens nettside.',
      validation: (rule) => rule.uri({ scheme: ['http', 'https'] }),
    }),
  ],
  preview: {
    select: { title: 'altText', tier: 'tier', media: 'logo' },
    prepare: ({ title, tier, media }: { title?: string; tier?: string; media?: unknown }) => ({
      title,
      subtitle: SPONSOR_TIERS.find((option) => option.value === tier)?.title.split(' – ')[0],
      media: media as never,
    }),
  },
});
