import type { Application } from '../supabase/queryHelpers/membershipApplications';

/** The email the board sends a newly approved member, opened in their own mail app. */
export function welcomeMailto(application: Pick<Application, 'name' | 'email'>): string {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
  const body = [
    `Hei ${application.name}!`,
    '',
    'Velkommen som medlem i Stavanger Brettspillklubb. Du står nå i medlemslisten.',
    `Lag profilen din her, med denne e-postadressen: ${origin}${base}/lag-medlemsprofil`,
    '',
    'Hilsen styret',
  ].join('\n');
  const params = new URLSearchParams({ subject: 'Velkommen i Stavanger Brettspillklubb', body });
  // URLSearchParams writes spaces as "+", which mail apps show literally.
  // The address is the applicant's own text: encode it, so a "?", "&" or "#" in it cannot add
  // recipients or replace the body (RFC 6068). "@" stays readable.
  const to = encodeURIComponent(application.email).replace(/%40/g, '@');
  return `mailto:${to}?${params.toString().replace(/\+/g, '%20')}`;
}
