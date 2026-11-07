import { defineField } from 'sanity';
import type { Rule } from 'sanity';
import ExternalLink from '../../assets/icons/symbols/external-link.svg?react';
import AddLink from '../../assets/icons/symbols/add-link.svg?react';

// Building blocks used by more than one document type. Every label and help text here is read
// by club volunteers, not developers, so they name what the editor sees on the site ("toppfelt",
// "knapp", "fotograf") rather than the component or field behind it.

/** The address field that every page with its own URL needs. */
export function slugField(example: string) {
  return defineField({
    title: 'Nettadresse',
    name: 'slug',
    type: 'slug',
    description: `Siste del av adressen til siden, f.eks. «${example}». Trykk på knappen ved siden av feltet for å lage den fra tittelen. Endrer du den senere, slutter gamle lenker å virke.`,
    options: { source: 'title', maxLength: 96 },
    validation: (rule) => rule.required().error('Siden må ha en nettadresse'),
  });
}

/**
 * Photographer or source credit for an image. The site shows it as «Foto: <name>», linked to the
 * URL, and only when both are filled in. The help text says so, because a name without a link
 * silently showing nothing is the first thing an editor would report as a bug.
 */
export const imageCreditFields = [
  defineField({
    title: 'Fotograf eller kilde',
    name: 'imageSourceName',
    type: 'string',
    description: 'Hvem som tok bildet, eller hvor det er hentet fra. Vises som «Foto: …».',
  }),
  defineField({
    title: 'Lenke til fotograf eller kilde',
    name: 'imageSourceUrl',
    type: 'url',
    description: 'Fyll ut denne også, ellers vises ikke kreditten på siden.',
  }),
];

/** The same credit, grouped under its own heading for documents with a single top image. */
export const imageCreditField = defineField({
  title: 'Kreditering av bildet',
  name: 'imageSource',
  type: 'object',
  description: 'Valgfritt. Fyll ut begge feltene for å kreditere fotografen.',
  options: { collapsible: true, collapsed: true },
  fields: imageCreditFields,
});

/** Help text for every image with a hotspot. */
export const hotspotHint =
  'Trykk på blyanten på bildet og flytt sirkelen til det viktigste i bildet, så blir det med når bildet beskjæres.';

/**
 * A row of buttons. `allowRelative` lets an editor type `/kalender` for a page on this site;
 * `isInternalLink` on the front end also recognises a pasted full address to this site.
 */
export function buttonLinksField({ description, max }: { description: string; max?: number }) {
  return defineField({
    title: 'Knapper',
    name: 'links',
    type: 'array',
    description,
    validation: max
      ? (rule) => rule.max(max).error(`Det er plass til maks ${max} knapper`)
      : undefined,
    of: [
      {
        type: 'object',
        title: 'Knapp',
        fields: [
          defineField({
            title: 'Knappetekst',
            name: 'label',
            type: 'string',
            description: 'Det som står på knappen, f.eks. «Meld deg på».',
            validation: (rule) => rule.required().error('Knappen må ha en tekst'),
          }),
          defineField({
            title: 'Lenke',
            name: 'url',
            type: 'url',
            description:
              'En side her på nettstedet, f.eks. /kalender, eller hele adressen til et annet nettsted, f.eks. https://facebook.com/….',
            validation: (rule) =>
              rule
                .required()
                .error('Knappen må ha en lenke')
                .uri({ allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel'] }),
          }),
        ],
        preview: { select: { title: 'label', subtitle: 'url' } },
      },
    ],
  });
}

/**
 * Text-editor configuration for posts and event descriptions. Style and mark titles are what the
 * editor sees in the toolbar menus, so they are Norwegian like everything else. `h2`/`h3` are the
 * stored values; the page title is the only `h1`.
 */
export const richTextBlock = {
  type: 'block',
  styles: [
    { title: 'Vanlig tekst', value: 'normal' },
    { title: 'Overskrift', value: 'h2' },
    { title: 'Mindre overskrift', value: 'h3' },
  ],
  lists: [
    { title: 'Punktliste', value: 'bullet' },
    { title: 'Nummerert liste', value: 'number' },
  ],
  marks: {
    decorators: [
      { title: 'Fet', value: 'strong' },
      { title: 'Kursiv', value: 'em' },
      { title: 'Understreket', value: 'underline' },
    ],
    annotations: [
      {
        name: 'link',
        type: 'object',
        title: 'Lenke til et annet nettsted',
        icon: ExternalLink,
        fields: [
          {
            title: 'Adresse',
            name: 'url',
            type: 'url',
            description: 'Hele adressen, f.eks. https://www.spond.com/…',
            validation: (rule: Rule) => rule.required().uri({ scheme: ['http', 'https'] }),
          },
        ],
      },
      {
        name: 'internalLink',
        type: 'object',
        title: 'Lenke til en side her',
        icon: AddLink,
        fields: [
          {
            title: 'Side',
            name: 'url',
            type: 'url',
            description: 'Stien til siden, f.eks. /kalender eller /nyheter.',
            validation: (rule: Rule) =>
              rule.required().uri({ scheme: ['http', 'https'], allowRelative: true }),
          },
        ],
      },
    ],
  },
};
