import { describe, expect, it } from 'vitest';
import { testMember } from '../test/fixtures';
import {
  compareMemberNames,
  csvCell,
  memberMatches,
  filterMembers,
  membersCsv,
  paymentReminderMailto,
  summariseMembers,
} from './membership';

const member = testMember;

const members = [
  member('anna'),
  member('bjorn', { is_admin: true }),
  member('dina', { status: 'disabled', disabled_at: '2026-01-01T00:00:00Z' }),
];
const status = { anna: { paid: true, paidAt: '2026-02-01T12:00:00Z' } };

describe('filterMembers', () => {
  it.each([
    ['active', { unpaidOnly: false, boardOnly: false }, ['anna', 'bjorn']],
    ['disabled', { unpaidOnly: false, boardOnly: false }, ['dina']],
    ['all', { unpaidOnly: false, boardOnly: false }, ['anna', 'bjorn', 'dina']],
    ['active', { unpaidOnly: true, boardOnly: false }, ['bjorn']],
    ['all', { unpaidOnly: false, boardOnly: true }, ['bjorn']],
  ] as const)('%s with %o', (filter, flags, expected) => {
    expect(filterMembers(members, status, filter, flags).map((m) => m.id)).toEqual(expected);
  });
});

it('summarises the register', () => {
  expect(summariseMembers(members, status)).toEqual({
    active: 2,
    paid: 1,
    unpaid: 1,
    disabled: 1,
    board: 1,
  });
});

describe('csvCell', () => {
  it.each([
    ['plain', '"plain"'],
    ['=HYPERLINK("x")', `"'=HYPERLINK(""x"")"`],
    ['+47 400', `"'+47 400"`],
    ['-1', `"'-1"`],
    ['@SUM(A1)', `"'@SUM(A1)"`],
    [null, '""'],
  ])('%s → %s', (input, expected) => {
    expect(csvCell(input)).toBe(expected);
  });
});

it('exports a semicolon CSV with a header and the paid column', () => {
  const csv = membersCsv(members.slice(0, 2), status, 2026);
  const [header, first, second] = csv.replace('﻿', '').split('\r\n');
  expect(header).toBe('"Fornavn";"Etternavn";"E-post";"Telefon";"Medlem siden";"Betalt 2026"');
  expect(first).toContain('"Ja"');
  expect(second).toContain('"Nei"');
});

it('builds a reminder with everyone in Bcc and no plus signs for spaces', () => {
  const href = paymentReminderMailto(['a@example.no', 'b@example.no'], 2026);
  expect(href.startsWith('mailto:')).toBe(true);
  const params = new URLSearchParams(href.slice(href.indexOf('?') + 1));
  expect(params.get('bcc')).toBe('a@example.no,b@example.no');
  expect(params.get('subject')).toBe('Påminnelse: medlemskontingent 2026');
  expect(href).not.toContain('+');
});

describe('compareMemberNames', () => {
  it('orders Æ, Ø, Å last and reads "Aa" as "Å"', () => {
    const names = [
      member('a', { name: 'Bjørn', surname: 'Aas' }),
      member('b', { name: 'Anne', surname: 'Ødegård' }),
      member('c', { name: 'Åse', surname: 'Berg' }),
      member('d', { name: 'Aasmund', surname: 'Lie' }),
    ];
    expect(names.sort(compareMemberNames).map((m) => m.name)).toEqual([
      'Anne',
      'Bjørn',
      'Åse',
      'Aasmund',
    ]);
  });
});

describe('memberMatches', () => {
  const kari = member('k', { name: 'Kari', surname: 'Nordmann', phone: '40000001' });

  it.each([
    ['', true],
    ['  ', true],
    ['kari', true],
    ['KARI nord', true],
    ['4000', true],
    ['k@example', true],
    ['kari hansen', false],
  ])('%j → %s', (query, expected) => {
    expect(memberMatches(kari, query)).toBe(expected);
  });
});
