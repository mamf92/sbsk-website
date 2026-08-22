import type { Page, Route } from '@playwright/test';
import { AUTH_STORAGE_KEY, SUPABASE_URL } from './supabase-env';

// A Supabase stand-in for the e2e suite: a signed-in session in the browser, and a stub that
// answers PostgREST by *reading the query the app sent* — table, `select`, filters — against
// fixture rows.
//
// Two holes this closes. The portal routes redirect to /login without a session, so neither had
// ever been reached by this suite: `memberPortalLoader` and `boardPortalLoader` were the only
// loaders with no coverage at all, and #162 left the board portal's member list stubbed `[]`,
// which means the list body never ran (the same blind spot that let #160 ship).
//
// Reaching them needs no account and no credentials. supabase-js reads its session out of
// localStorage and then asks the server to validate the token; seeding the first and answering
// the second is a signed-in browser, offline and deterministic.
//
// Honest about what this does and does not prove. The Sanity fixture can run the app's real GROQ
// with groq-js, so it catches drift against the query. There is no local PostgREST here, so this
// cannot do the same against the real database — the column names below were checked against the
// project's schema by hand, and nothing keeps them checked. What it *does* enforce is the half a
// hardcoded response fixture gives away: the response is built from the request, so a filter the
// stub does not understand, a column the query stops selecting, or a `.single()` that matches no
// row all fail loudly here instead of being papered over by a canned body.

/** The auth user the session belongs to. Its id is what `profiles.supabase_id` points at. */
export const AUTH_USER = {
  id: '11111111-1111-4111-8111-111111111111',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'styremedlem@example.test',
  email_confirmed_at: '2026-01-01T09:00:00Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: {},
  created_at: '2026-01-01T09:00:00Z',
  updated_at: '2026-01-01T09:00:00Z',
};

/**
 * `public.profiles`, with the columns the table actually has. Note what is *not* here: no
 * `created_at`, and `id` is the table's bigint identity, so it arrives as a JSON number. The
 * `Profile` interface in src claims both otherwise. That mismatch is real and predates this
 * fixture; the fixture follows the database.
 */
export const PROFILES = [
  {
    id: 1,
    supabase_id: AUTH_USER.id,
    name: 'Ingrid',
    surname: 'Hetland',
    email: AUTH_USER.email,
    address: 'Byhaugveien 3',
    postcode: '4022',
    city: 'Stavanger',
    bio: 'Styremedlem og turneringsansvarlig.',
    photo_url: null,
    is_admin: true,
  },
];

/**
 * `public.members`. Three rows rather than one, with names chosen to exercise the Norwegian
 * collation the list sorts by: "Aas" collates as "Å" and belongs last, after "Ødegård".
 */
export const MEMBERS = [
  {
    id: 'aaaaaaaa-0000-4000-8000-000000000001',
    name: 'Trygve',
    surname: 'Dahl',
    phone: '40000001',
    address: 'Madlaveien 12',
    postcode: '4009',
    city: 'Stavanger',
    email: 'trygve@example.test',
    is_admin: false,
    supabase_id: null,
    created_at: '2026-02-01T09:00:00Z',
  },
  {
    id: 'aaaaaaaa-0000-4000-8000-000000000002',
    name: 'Silje',
    surname: 'Ødegård',
    phone: '40000002',
    address: 'Tastagata 5',
    postcode: '4007',
    city: 'Stavanger',
    email: 'silje@example.test',
    is_admin: false,
    supabase_id: null,
    created_at: '2026-02-02T09:00:00Z',
  },
  {
    id: 'aaaaaaaa-0000-4000-8000-000000000003',
    name: 'Bjørn',
    surname: 'Aasen',
    phone: '40000003',
    address: 'Hillevågsveien 9',
    postcode: '4016',
    city: 'Stavanger',
    email: 'bjorn@example.test',
    is_admin: true,
    supabase_id: null,
    created_at: '2026-02-03T09:00:00Z',
  },
];

type Row = Record<string, unknown>;

export interface SupabaseStubOptions {
  /** Seed a session into the browser. False leaves the visitor signed out. */
  signedIn?: boolean;
  /** Status for `GET /auth/v1/user`, which is what `supabase.auth.getUser()` calls. */
  authStatus?: number;
  profiles?: Row[];
  members?: Row[];
  /** Fail a table outright instead of answering it, e.g. `{ members: 500 }`. */
  fail?: Record<string, number>;
  /** What the `member_is_admin()` RPC reports; the header probes it on every load. */
  isAdmin?: boolean;
}

/** Thrown when the app asks for something the stub cannot honestly answer. */
class UnsupportedQuery extends Error {}

function base64url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

/**
 * A structurally valid JWT with a real `exp`. Nothing verifies the signature — the server that
 * would is stubbed — but supabase-js decodes the payload, so the claims have to be there.
 */
function accessToken(expiresAt: number): string {
  const header = base64url({ alg: 'HS256', typ: 'JWT' });
  const payload = base64url({
    sub: AUTH_USER.id,
    email: AUTH_USER.email,
    aud: 'authenticated',
    role: 'authenticated',
    iss: `${SUPABASE_URL}/auth/v1`,
    iat: expiresAt - 3600,
    exp: expiresAt,
  });
  return `${header}.${payload}.e2e-signature-is-never-verified`;
}

/** Applies one PostgREST filter, e.g. `supabase_id=eq.<uuid>`. */
function matches(row: Row, column: string, expression: string): boolean {
  const separator = expression.indexOf('.');
  const operator = expression.slice(0, separator);
  const operand = expression.slice(separator + 1);
  const value = row[column];

  switch (operator) {
    case 'eq':
      return String(value) === operand;
    case 'neq':
      return String(value) !== operand;
    case 'is':
      if (operand === 'null') return value === null || value === undefined;
      return String(value) === operand;
    case 'in':
      return operand
        .replace(/^\(|\)$/g, '')
        .split(',')
        .map((entry) => entry.replace(/^"|"$/g, ''))
        .includes(String(value));
    default:
      // Loudly, rather than by matching everything: a filter the stub silently ignored would let
      // a query return rows it must not, and the test would pass on a lie.
      throw new UnsupportedQuery(`unsupported PostgREST operator "${operator}" on "${column}"`);
  }
}

/** Applies the `select`, so a column the query stops asking for stops arriving. */
function project(row: Row, select: string): Row {
  if (select === '*') return row;
  if (select.includes('(')) {
    throw new UnsupportedQuery(`embedded resources are not stubbed: select=${select}`);
  }

  const columns = select.split(',').map((column) => column.trim());
  return Object.fromEntries(columns.map((column) => [column, row[column]]));
}

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

/**
 * Installs the stub. Call before `page.goto` — the session is seeded through an init script, and
 * every route here fails loudly rather than reaching the network.
 */
export async function stubSupabase(page: Page, options: SupabaseStubOptions = {}) {
  const {
    signedIn = true,
    authStatus = 200,
    profiles = PROFILES,
    members = MEMBERS,
    fail = {},
    isAdmin = true,
  } = options;

  const tables: Record<string, Row[]> = { profiles, members };

  // Registered first on purpose: Playwright hands a request to the most recently added matching
  // route, so this only catches what nothing below claimed — and says so instead of silently
  // answering `[]`, which is how a stub starts lying about what the app does.
  await page.route('**://*.supabase.co/**', (route) => {
    const { pathname } = new URL(route.request().url());
    return json(route, 501, { message: `e2e stub has no handler for ${pathname}` });
  });

  await page.route('**://*.supabase.co/rest/v1/**', (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/rest/v1/', '');

    if (path.startsWith('rpc/')) {
      const procedure = path.slice('rpc/'.length);
      if (procedure === 'member_is_admin') return json(route, 200, isAdmin);
      return json(route, 404, { message: `e2e stub has no RPC "${procedure}"` });
    }

    if (request.method() !== 'GET') {
      // Writes go through their own helpers and would need their own fixture state; nothing in
      // this suite exercises one yet, so say so rather than pretending it succeeded.
      return json(route, 501, { message: `e2e stub does not implement ${request.method()}` });
    }

    const status = fail[path];
    if (status) {
      return json(route, status, {
        code: String(status),
        message: `e2e stub failing "${path}" on purpose`,
        details: null,
        hint: null,
      });
    }

    const rows = tables[path];
    if (!rows) return json(route, 404, { message: `e2e stub has no table "${path}"` });

    try {
      const select = url.searchParams.get('select') ?? '*';
      const filtered = rows.filter((row) =>
        [...url.searchParams].every(
          ([name, value]) =>
            ['select', 'order', 'limit', 'offset'].includes(name) || matches(row, name, value),
        ),
      );
      const projected = filtered.map((row) => project(row, select));

      // `.single()` asks for one object, and PostgREST answers a count that is not exactly one
      // with PGRST116 rather than an array. supabase-js turns that into `error`, which is how a
      // missing profile row reaches the loader — so it has to be modelled, not smoothed over.
      const wantsObject = (request.headers()['accept'] ?? '').includes('vnd.pgrst.object');
      if (wantsObject && projected.length !== 1) {
        return json(route, 406, {
          code: 'PGRST116',
          details: `Results contain ${projected.length} rows`,
          hint: null,
          message: 'JSON object requested, multiple (or no) rows returned',
        });
      }

      return json(route, 200, wantsObject ? projected[0] : projected);
    } catch (error) {
      if (error instanceof UnsupportedQuery) return json(route, 400, { message: error.message });
      throw error;
    }
  });

  // `supabase.auth.getUser()` does not trust the stored session: it sends the token here for the
  // server to validate. This route is therefore what decides whether the portal loaders see a
  // user at all — a 401 is a session the backend rejects.
  await page.route('**://*.supabase.co/auth/v1/user**', (route) => {
    if (authStatus !== 200) {
      return json(route, authStatus, { message: 'invalid claim: missing sub claim' });
    }
    return json(route, 200, AUTH_USER);
  });

  if (!signedIn) return;

  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const session = {
    access_token: accessToken(expiresAt),
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expiresAt,
    refresh_token: 'e2e-refresh-token',
    user: AUTH_USER,
  };

  await page.addInitScript(
    ({ key, session: stored, profile }) => {
      window.localStorage.setItem(key, JSON.stringify(stored));
      // The app keeps its own mirror of the session for the header (see authProvider). A real
      // login writes these three, so a seeded session that omits them would render a signed-out
      // header over a signed-in page.
      window.localStorage.setItem('authToken', stored.access_token);
      window.localStorage.setItem('userData', JSON.stringify(profile));
      window.localStorage.setItem('isAdmin', JSON.stringify(Boolean(profile?.is_admin)));
    },
    { key: AUTH_STORAGE_KEY, session, profile: profiles[0] },
  );
}
