/** An OpenStreetMap search for the address: a link, not an embed, so no new CSP origin. */
export function mapUrl(address: string): string {
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`;
}

/**
 * A Google Maps search for the address, for the new front page's «Vis i kart». Most visitors
 * have Google Maps on their phone, and this URL opens the app there. A link, so no CSP change.
 */
export function googleMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
