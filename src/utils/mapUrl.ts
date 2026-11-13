/** An OpenStreetMap search for the address: a link, not an embed, so no new CSP origin. */
export function mapUrl(address: string): string {
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`;
}
