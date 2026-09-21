/**
 * The club's public address, in one place because it is written into the footer on every page,
 * the Kontakt oss page and the Bli medlem page — three copies that drifted out of sync with
 * reality the last time it changed (#254). The club reads this inbox; `hei@sbsk.no`, which
 * these three used to show, is not an address anyone has.
 *
 * Not to be confused with the `@sbsk.no` domain in `ics.ts`, which is an identifier inside a
 * calendar invite rather than somewhere a person sends mail.
 */
export const CLUB_EMAIL = 'sbsklubb@hotmail.com';
export const CLUB_EMAIL_HREF = `mailto:${CLUB_EMAIL}`;
