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
  return `mailto:${application.email}?${params.toString().replace(/\+/g, '%20')}`;
}
