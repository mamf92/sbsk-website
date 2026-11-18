import type { Member } from '../supabase/queryHelpers/getMember';
import type { SeasonStatus } from '../supabase/queryHelpers/getSeasonStatus';
import { CLUB_EMAIL } from './contact';

/** A membership season is a calendar year (phase 2 plan, decision 8). */
export function currentSeason(now = new Date()): number {
  return now.getFullYear();
}

/**
 * Norwegian name order: Æ, Ø, Å last, and the digraph "Aa" collated as "Å", so "Aas" sorts
 * after "Ødegård". The default locale would put "Aas" first, which is wrong for this club.
 */
export function compareMemberNames(
  a: Pick<Member, 'name' | 'surname'>,
  b: Pick<Member, 'name' | 'surname'>,
): number {
  return `${a.name} ${a.surname}`.localeCompare(`${b.name} ${b.surname}`, ['no', 'sv', 'da']);
}

/** Every word of the query must appear in the member's name, email or phone. */
export function memberMatches(
  member: Pick<Member, 'name' | 'surname' | 'email' | 'phone'>,
  query: string,
): boolean {
  const words = query.trim().toLocaleLowerCase('nb').split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = [member.name, member.surname, member.email, member.phone ?? '']
    .join(' ')
    .toLocaleLowerCase('nb');
  return words.every((word) => haystack.includes(word));
}

export type MemberFilter = 'active' | 'disabled' | 'all';

export interface MemberFlags {
  unpaidOnly: boolean;
  boardOnly: boolean;
}

/** The members tab's filters, as one pure function so it is testable without rendering. */
export function filterMembers(
  members: Member[],
  seasonStatus: Record<string, SeasonStatus>,
  filter: MemberFilter,
  { unpaidOnly, boardOnly }: MemberFlags,
): Member[] {
  return members.filter(
    (m) =>
      (filter === 'all' || m.status === filter) &&
      (!unpaidOnly || !seasonStatus[m.id]?.paid) &&
      (!boardOnly || m.is_admin),
  );
}

export interface MembersSummaryCounts {
  active: number;
  paid: number;
  unpaid: number;
  disabled: number;
  board: number;
}

export function summariseMembers(
  members: Member[],
  seasonStatus: Record<string, SeasonStatus>,
): MembersSummaryCounts {
  const active = members.filter((m) => m.status === 'active');
  const paid = active.filter((m) => seasonStatus[m.id]?.paid).length;
  return {
    active: active.length,
    paid,
    unpaid: active.length - paid,
    disabled: members.length - active.length,
    board: active.filter((m) => m.is_admin).length,
  };
}

/**
 * One CSV cell. Quoted always, quotes doubled, and a leading `= + - @` (or tab/CR) neutralised
 * with an apostrophe so a spreadsheet does not run a member-supplied value as a formula
 * (CSV injection, phase 2 security checklist).
 */
export function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/** The treasurer's export of the current filter. Semicolons, which Norwegian Excel expects. */
export function membersCsv(
  members: Member[],
  seasonStatus: Record<string, SeasonStatus>,
  season = currentSeason(),
): string {
  const header = ['Fornavn', 'Etternavn', 'E-post', 'Telefon', 'Medlem siden', `Betalt ${season}`];
  const rows = members.map((m) => [
    m.name,
    m.surname,
    m.email,
    m.phone ?? '',
    m.member_since,
    seasonStatus[m.id]?.paid ? 'Ja' : 'Nei',
  ]);
  // A BOM so Excel reads æøå as UTF-8.
  return '﻿' + [header, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n');
}

/**
 * A payment reminder as a `mailto:` link: To the club's own address, everyone else in Bcc so
 * members never see each other's emails. Sent from the board member's own mail program until
 * the club has an email provider (#133); then this becomes a server-side send.
 */
export function paymentReminderMailto(emails: string[], season = currentSeason()): string {
  const subject = `Påminnelse: medlemskontingent ${season}`;
  const body =
    `Hei!\n\nVi ser at vi ikke har registrert betaling av medlemskontingenten for ${season} fra deg ennå. ` +
    'Har du betalt nylig, kan du se bort fra denne e-posten.\n\n' +
    'Spørsmål? Svar på denne e-posten.\n\nHilsen styret i Stavanger Brettspillklubb';
  const params = new URLSearchParams({ bcc: emails.join(','), subject, body });
  // URLSearchParams encodes spaces as `+`, which mail clients show literally in a mailto.
  return `mailto:${CLUB_EMAIL}?${params.toString().replace(/\+/g, '%20')}`;
}
