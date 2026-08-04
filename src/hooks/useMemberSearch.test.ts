import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useMemberSearch } from './useMemberSearch';
import type { Member } from '../supabase/queryHelpers/getMember';

function member(overrides: Partial<Member>): Member {
  return {
    id: crypto.randomUUID(),
    supabase_id: crypto.randomUUID(),
    email: 'test@example.com',
    name: null,
    surname: null,
    address: null,
    postcode: null,
    phone: null,
    city: null,
    is_admin: false,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

const members: Member[] = [
  member({ name: 'Åse', surname: 'Berg', address: 'Storgata 1', city: 'Stavanger' }),
  member({ name: 'Bjørn', surname: 'Aas', address: 'Kirkegata 4', city: 'Sandnes' }),
  member({ name: 'Anne', surname: 'Ødegård', address: 'Havnegata 9', city: 'Bergen' }),
];

const names = (list: Member[]) => list.map((m) => m.name);

describe('useMemberSearch filtering', () => {
  it('returns every member when the search term is empty', () => {
    const { result } = renderHook(() => useMemberSearch(members));
    expect(result.current.filteredMembers).toHaveLength(3);
  });

  it('matches case-insensitively across name, surname, address and city', () => {
    const { result } = renderHook(() => useMemberSearch(members));

    act(() => result.current.setSearchTerm('SANDNES'));
    expect(names(result.current.filteredMembers)).toEqual(['Bjørn']);

    act(() => result.current.setSearchTerm('havnegata'));
    expect(names(result.current.filteredMembers)).toEqual(['Anne']);

    act(() => result.current.setSearchTerm('aas'));
    expect(names(result.current.filteredMembers)).toEqual(['Bjørn']);
  });

  it('returns nothing when no member matches', () => {
    const { result } = renderHook(() => useMemberSearch(members));
    act(() => result.current.setSearchTerm('Trondheim'));
    expect(result.current.filteredMembers).toHaveLength(0);
  });

  it('does not throw on members with null fields', () => {
    const { result } = renderHook(() => useMemberSearch([member({ name: null })]));
    act(() => result.current.setSearchTerm('anything'));
    expect(result.current.filteredMembers).toHaveLength(0);
  });
});

describe('useMemberSearch sorting', () => {
  it('sorts by name ascending using Norwegian collation', () => {
    const { result } = renderHook(() => useMemberSearch(members));
    // Å sorts last in the Norwegian alphabet, not next to A.
    expect(names(result.current.sortedMembers)).toEqual(['Anne', 'Bjørn', 'Åse']);
  });

  it('flips direction when the active sort field is clicked again', () => {
    const { result } = renderHook(() => useMemberSearch(members));

    act(() => result.current.handleSortClick('name'));
    expect(result.current.sortOrder).toBe('desc');
    expect(names(result.current.sortedMembers)).toEqual(['Åse', 'Bjørn', 'Anne']);

    act(() => result.current.handleSortClick('name'));
    expect(result.current.sortOrder).toBe('asc');
  });

  it('resets to ascending when switching to a different field', () => {
    const { result } = renderHook(() => useMemberSearch(members));

    act(() => result.current.handleSortClick('name'));
    expect(result.current.sortOrder).toBe('desc');

    act(() => result.current.handleSortClick('city'));
    expect(result.current.selectedSortField).toBe('city');
    expect(result.current.sortOrder).toBe('asc');
    expect(names(result.current.sortedMembers)).toEqual(['Anne', 'Bjørn', 'Åse']);
  });

  it('applies Norwegian collation rules to surnames, including Aa as Å', () => {
    const { result } = renderHook(() => useMemberSearch(members));

    // Surnames are Berg (Åse), Aas (Bjørn) and Ødegård (Anne). Norwegian orders
    // ... Æ, Ø, Å last, and collates the digraph "Aa" as "Å" — so "Aas" sorts
    // after "Ødegård", not first. Sorting with the default locale would give
    // Aas, Berg, Ødegård, which is wrong for a Norwegian member list.
    act(() => result.current.handleSortClick('surname'));
    expect(names(result.current.sortedMembers)).toEqual(['Åse', 'Anne', 'Bjørn']);

    act(() => result.current.handleSortClick('surname'));
    expect(names(result.current.sortedMembers)).toEqual(['Bjørn', 'Anne', 'Åse']);
  });

  it('does not mutate the source array', () => {
    const original = [...members];
    const { result } = renderHook(() => useMemberSearch(members));
    void result.current.sortedMembers;
    expect(members).toEqual(original);
  });
});

describe('useMemberSearch selection', () => {
  it('opens the form with the clicked member', () => {
    const { result } = renderHook(() => useMemberSearch(members));

    act(() => result.current.handleMemberClick(members[1]));
    expect(result.current.selectedMember).toBe(members[1]);
    expect(result.current.showForm).toBe(true);
  });

  it('clears the selection when adding a new member', () => {
    const { result } = renderHook(() => useMemberSearch(members));

    act(() => result.current.handleMemberClick(members[1]));
    act(() => result.current.handleAddMemberClick());

    expect(result.current.selectedMember).toBeNull();
    expect(result.current.showMemberDetails).toBe(false);
    expect(result.current.showForm).toBe(true);
  });
});
