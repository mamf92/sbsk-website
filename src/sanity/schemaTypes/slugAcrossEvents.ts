import { getPublishedId, type SlugIsUniqueValidator } from 'sanity';

/**
 * Events and festivals share the URL space `/arrangementer/:slug`, so a slug must be unique
 * across both types, not only within one. Used as `options.isUnique` on both slug fields.
 */
export const isUniqueAcrossEvents: SlugIsUniqueValidator = async (slug, context) => {
  const { document, getClient } = context;
  if (!document?._id) return true;
  // Every version of this same document (published, draft, or inside a release) is not a clash.
  const published = getPublishedId(document._id);
  const client = getClient({ apiVersion: '2025-02-19' });
  const count = await client.fetch<number>(
    `count(*[_type in ["event", "festival"] && slug.current == $slug && !sanity::versionOf($published)])`,
    { slug, published },
  );
  return count === 0;
};
