---
name: sbsk-supabase-query
description: Read or write member and profile data in Supabase for the SBSK site. Use when adding a query helper under src/supabase/queryHelpers/, changing an auth-guarded loader, working with the members or profiles tables, uploading to storage, or reasoning about row level security in the member and board portals.
---

# Supabase query helpers

All database access goes through a single-purpose module in `src/supabase/queryHelpers/`.
Components and loaders import those helpers; they never call `supabase.from(...)` directly.

## The shape

One file, one exported function, named for what it does:

```ts
import { supabase } from '../client';
import type { Member } from './getMember';

export async function getMembers(): Promise<Member[]> {
  const { data, error } = await supabase.from('members').select('*');

  if (error) throw error;
  if (!data) throw new Error('Members not found');

  return data;
}
```

- Return a typed value, never the raw Supabase response envelope.
- `throw` on `error`. Loaders convert failures into redirects; swallowing errors hides
  permission problems and produces blank screens.
- The row interface lives with the helper that first needs it — `Member` is exported from
  `getMember.ts` and imported elsewhere.
- Import types with **`import type`**, not an inline `type` specifier. Under
  `verbatimModuleSyntax` an inline specifier leaves a side-effect import that drags the
  Supabase client into every consumer.

## RLS is the authorisation model

Row level security decides what a user can read. The client key is public — it ships in the
browser bundle — so **never treat a client-side check as a security boundary.** A user who
should not see a row simply gets no row back.

This shapes how permission checks are written. `canViewMembers` asks the database rather than
inspecting a local flag:

```ts
const { count, error } = await supabase
  .from('members')
  .select('id', { count: 'exact', head: true });

if (error) return false;
return (count ?? 0) > 0;
```

An empty result is the expected outcome for an unauthorised user, not an error to report.

If a query returns nothing unexpectedly, suspect an RLS policy before suspecting the query.
Policy changes are a Supabase-side migration and are **not** something to work around by
loosening the client query.

## Auth-guarded loaders

Portal routes resolve the user first and redirect when absent:

```ts
export async function boardPortalLoader() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw redirect('/login?reason=not_authenticated');
  }

  const profile = await getProfile(user.id);

  try {
    const members = await getMembers();
    return { profile, members };
  } catch {
    throw redirect('/medlemsportal');
  }
}
```

Note the two tiers: no session redirects to login; a session without permission falls back to
the member portal. Keep that distinction — collapsing them sends admins-in-waiting to a login
page they are already past.

`throw redirect(...)`, never `return redirect(...)`.

## Storage

Uploads go to a per-user path so RLS can scope them:

```ts
await supabase.storage.from('profile-images').upload(`${userId}/${crypto.randomUUID()}`, file);
```

Use `crypto.randomUUID()`. Do not add a `uuid` package — one was previously imported without
being declared in `package.json` and only worked through transitive hoisting.

## Environment

`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are the only Supabase values that may
carry a `VITE_` prefix, because both are public by design. **A service role key must never be
given a `VITE_` prefix** — that would publish it in the client bundle.

## Testing without network

Sandboxed sessions cannot reach Supabase, and tests must not depend on it. `vitest.config.ts`
supplies placeholder env values so modules constructing a client at import time still load.
Mock the helper, not the client:

```ts
vi.mock('../supabase/queryHelpers/getMembers', () => ({
  getMembers: vi.fn().mockResolvedValue([]),
}));
```

Test the pure logic directly — `useMemberSearch` is covered without any network because
filtering and sorting are separated from fetching. Prefer that split in new code.

Norwegian collation matters for member lists: sorting uses
`localeCompare(other, ['no', 'sv', 'da'])`, which orders Æ, Ø, Å last **and collates the
digraph "Aa" as "Å"**, so "Aas" sorts after "Ødegård". That is correct, and there is a test
pinning it. Do not "fix" it to the default locale.

## Verify

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```
