import type { Member } from '../supabase/queryHelpers/getMember';

/** A register row for tests. `id` doubles as the first name unless overridden. */
export function testMember(id: string, overrides: Partial<Member> = {}): Member {
  return {
    id,
    supabase_id: null,
    email: `${id}@example.no`,
    name: id,
    surname: 'Testesen',
    phone: null,
    is_admin: false,
    status: 'active',
    member_since: '2025-01-01',
    disabled_at: null,
    disabled_reason: null,
    birth_year: null,
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}
