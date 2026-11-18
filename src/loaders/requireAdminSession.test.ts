import { describe, expect, it, vi, beforeEach } from 'vitest';

const getUser = vi.fn();
const isBoardAdmin = vi.fn();
const getAssurance = vi.fn();

vi.mock('../supabase/client', () => ({
  supabase: { auth: { getUser: () => getUser() } },
}));
vi.mock('../supabase/queryHelpers/isBoardAdmin', () => ({ isBoardAdmin: () => isBoardAdmin() }));
vi.mock('../supabase/queryHelpers/mfa', () => ({ getAssurance: () => getAssurance() }));

const { requireAdminSession, safeNextPath } = await import('./requireAdminSession');

const user = { id: 'auth-user-1' };

async function locationOf(run: () => Promise<unknown>) {
  try {
    await run();
  } catch (thrown) {
    expect(thrown).toBeInstanceOf(Response);
    return (thrown as Response).headers.get('Location');
  }
  return null;
}

beforeEach(() => {
  getUser.mockReset().mockResolvedValue({ data: { user } });
  isBoardAdmin.mockReset().mockResolvedValue(true);
  getAssurance.mockReset();
});

describe('requireAdminSession', () => {
  it.each([
    ['signed out', null, false, null, '/login?reason=not_authenticated'],
    ['a member', user, false, null, '/medlemsportal?reason=not_admin'],
    [
      'an admin with no authenticator',
      user,
      true,
      { currentLevel: 'aal1', nextLevel: 'aal1' },
      '/to-faktor/oppsett?neste=%2Fstyreportal',
    ],
    [
      'an admin who has not entered a code yet',
      user,
      true,
      { currentLevel: 'aal1', nextLevel: 'aal2' },
      '/to-faktor?neste=%2Fstyreportal',
    ],
  ])('sends %s on', async (_label, who, admin, assurance, location) => {
    getUser.mockResolvedValue({ data: { user: who } });
    isBoardAdmin.mockResolvedValue(admin);
    getAssurance.mockResolvedValue(assurance);

    expect(await locationOf(() => requireAdminSession())).toBe(location);
  });

  it('lets an admin at aal2 through', async () => {
    getAssurance.mockResolvedValue({ currentLevel: 'aal2', nextLevel: 'aal2' });
    await expect(requireAdminSession()).resolves.toBe(user);
  });

  it('carries the requested page through the 2FA step', async () => {
    getAssurance.mockResolvedValue({ currentLevel: 'aal1', nextLevel: 'aal2' });
    expect(await locationOf(() => requireAdminSession('/styreportal/innsjekk'))).toBe(
      '/to-faktor?neste=%2Fstyreportal%2Finnsjekk',
    );
  });
});

describe('safeNextPath', () => {
  it.each([
    ['/styreportal/medlemmer', '/styreportal/medlemmer'],
    ['//evil.example', '/styreportal'],
    ['/\\evil.example', '/styreportal'],
    ['https://evil.example', '/styreportal'],
    ['javascript:alert(1)', '/styreportal'],
    [null, '/styreportal'],
    ['', '/styreportal'],
  ])('%s → %s', (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });
});
