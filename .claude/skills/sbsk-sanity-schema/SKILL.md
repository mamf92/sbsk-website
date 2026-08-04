---
name: sbsk-sanity-schema
description: Add or change Sanity content in the SBSK site. Use when adding a schema type or field, changing what a GROQ query returns, wiring new CMS content into a page, or registering a type in the embedded Studio. Covers the schema type, query helper and loader that must stay in sync.
---

# Changing Sanity content

A content change is almost always **three coordinated edits**. Doing one or two of them
leaves the app broken or the field invisible.

| Step | File                                   | Purpose                                |
| ---- | -------------------------------------- | -------------------------------------- |
| 1    | `src/sanity/schemaTypes/<name>Type.ts` | What editors see in the Studio         |
| 2    | `src/sanity/queryHelpers/<name>.ts`    | The GROQ query and its TypeScript type |
| 3    | `src/loaders/<page>-loader.ts`         | Calls the helper for a route           |

Plus a fourth when adding a whole new type: register it in `src/pages/Studio.tsx`.

## 1. Schema type

```ts
import { defineField, defineType } from 'sanity';

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
  ],
});
```

- Always `defineType` / `defineField` — they carry the types.
- `title` and `description` are **Norwegian**; they are Studio UI for the club's editors.
- `name` is the English field identifier used in GROQ.
- New types must be added to the `schema.types` array in `src/pages/Studio.tsx`, or they will
  not appear in the Studio.

## 2. Query helper

Each helper owns a GROQ constant, an exported interface, and an async function returning a
named object.

```ts
import { client } from '../client';

export interface PostTypes {
  _id: string;
  title: string;
  slug: { current: string };
}

const POSTS_QUERY = `*[
  _type == "post" && defined(slug.current)
]|order(publishedAt desc)[0...12]{_id, title, slug}`;

export async function postsLoader() {
  return { posts: await client.fetch<PostTypes[]>(POSTS_QUERY) };
}
```

Rules that matter here:

- **A field added to the schema is not returned until it is added to the GROQ projection.**
  This is the step most often missed — the field exists, editors fill it in, and it never
  reaches the page.
- Add it to the exported interface at the same time. Mark it optional (`?`) unless the schema
  makes it required, because existing documents will not have it.
- Rename a projection with `"alias": path.to.field`, as `"eventSlug": slug.current` does.
- Parameterised queries take `$slug` and are called as
  `client.fetch(QUERY, { slug })` — never string-interpolate into GROQ.

## 3. Loader

Loaders compose helpers and return a flat object for the route:

```ts
export async function calendarLoader() {
  const { calendarHero } = await calendarHeroLoader();
  const { events } = await eventsListLoader();
  return { calendarHero, events };
}
```

Register it on the route in `src/main.tsx`. Loaders taking a URL param receive
`LoaderFunctionArgs`.

## Images

Images come back as references, not URLs. Render through `urlFor` from
`src/sanity/sanityImageUrl.ts`. Portable Text renders through the components in
`src/sanity/editors/portableTextComponents.tsx` — extend those rather than handling blocks
inline in a component.

## The Studio must stay lazy

`src/pages/Studio.tsx` pulls in several MB. It is reached only through
`src/pages/StudioRoute.tsx`, which wraps it in `React.lazy`. **Never import `./Studio`
directly from anything reachable from `src/main.tsx`** — that puts the whole Studio back in
the public entry bundle. An e2e test guards this; if it starts failing, an eager import was
introduced.

## Testing without network

Sandboxed sessions usually cannot reach `api.sanity.io`. Do not write a test that fetches.
Mock the query helper and assert on the mapping and the component's behaviour:

```ts
vi.mock('../sanity/queryHelpers/posts', () => ({
  postsLoader: vi.fn().mockResolvedValue({ posts: [] }),
}));
```

Components must also survive empty content — the home hero falls back to hardcoded Norwegian
copy when Sanity returns nothing, and that path is what the smoke tests exercise.

## Verify

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```
