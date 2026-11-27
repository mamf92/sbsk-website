/** The site's absolute root with a trailing slash, for links inside a downloaded .ics entry. */
export function siteUrl(): string {
  return new URL(import.meta.env.VITE_BASE ?? '/', window.location.origin).href;
}
