import { defineField } from 'sanity';
import { hotspotHint } from './sharedFields';

// The heading, intro and image at the top of a page. Each page's document picks the ones its
// page actually renders, so the Studio never offers a field that has no effect.

export function pageTitleField(fallback: string, max = 60) {
  return defineField({
    title: 'Overskrift',
    name: 'title',
    type: 'string',
    description: `Den store overskriften. Står det tomt, vises «${fallback}». Maks ${max} tegn.`,
    validation: (rule) => rule.max(max).error(`Overskriften kan være maks ${max} tegn`),
  });
}

export function pageSubtitleField(max: number) {
  return defineField({
    title: 'Undertekst',
    name: 'subtitle',
    type: max > 100 ? 'text' : 'string',
    ...(max > 100 ? { rows: 3 } : {}),
    description: `En kort tekst rett under overskriften. Står det tomt, vises en standardtekst. Maks ${max} tegn.`,
    validation: (rule) => rule.max(max).error(`Underteksten kan være maks ${max} tegn`),
  });
}

export const pageImageField = defineField({
  title: 'Bilde',
  name: 'image',
  type: 'image',
  description: `Det store bildet øverst på siden. Står det tomt, brukes et standardbilde. ${hotspotHint}`,
  options: { hotspot: true },
});
