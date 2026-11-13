import { defineField, defineType } from 'sanity';
import { richTextBlocks } from './richText';

// Visitor-facing text in Norwegian and, optionally, English. Norwegian is required wherever the
// field itself is required; English falls back to Norwegian on the site (`pickLocale`).

const EN_DESCRIPTION = 'Står det tomt, vises den norske teksten også på den engelske siden.';

/** One line of text, e.g. a title or a button label. */
export const localeStringType = defineType({
  name: 'localeString',
  title: 'Tekst på norsk og engelsk',
  type: 'object',
  fields: [
    defineField({ name: 'nb', title: 'Norsk', type: 'string' }),
    defineField({
      name: 'en',
      title: 'Engelsk (valgfritt)',
      type: 'string',
      description: EN_DESCRIPTION,
    }),
  ],
});

/** A few sentences of plain text. */
export const localeTextType = defineType({
  name: 'localeText',
  title: 'Tekst på norsk og engelsk',
  type: 'object',
  fields: [
    defineField({ name: 'nb', title: 'Norsk', type: 'text', rows: 3 }),
    defineField({
      name: 'en',
      title: 'Engelsk (valgfritt)',
      type: 'text',
      rows: 3,
      description: EN_DESCRIPTION,
    }),
  ],
});

/** Formatted text with headings, lists and links. */
export const localeBlockType = defineType({
  name: 'localeBlock',
  title: 'Tekst på norsk og engelsk',
  type: 'object',
  fields: [
    defineField({ name: 'nb', title: 'Norsk', type: 'array', of: richTextBlocks }),
    defineField({
      name: 'en',
      title: 'Engelsk (valgfritt)',
      type: 'array',
      of: richTextBlocks,
      description: EN_DESCRIPTION,
    }),
  ],
});
