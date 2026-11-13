import type { SlugIsUniqueValidator } from 'sanity';

/**
 * Events and festivals share the URL space `/arrangementer/:slug`, so a slug must be unique
 * across both types, not only within one. Used as `options.isUnique` on both slug fields.
 */
export const isUniqueAcrossEvents: SlugIsUniqueValidator = async (slug, context) => {
  const { document, getClient } = context;
  if (!document?._id) return true;
  const id = document._id.replace(/^drafts\./, '');
  const client = getClient({ apiVersion: '2024-01-01' });
  const count = await client.fetch<number>(
    `count(*[_type in ["event", "festival"] && slug.current == $slug && !(_id in [$draft, $published])])`,
    { slug, draft: `drafts.${id}`, published: id },
  );
  return count === 0;
};
