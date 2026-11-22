/**
 * What the membership card's QR code holds: a prefix, so a scan of some other QR code is
 * recognised as "not a membership card" instead of being looked up, and the member's token.
 */
const PREFIX = 'sbsk-medlem:';

export function cardPayload(token: string): string {
  return `${PREFIX}${token}`;
}

/**
 * The token from a scanned or typed code: the full payload, or the bare 32 hex characters a
 * board member might type from the card. Null for anything else.
 */
export function parseCardCode(text: string): string | null {
  const value = text.replace(/\s+/g, '').toLowerCase();
  const token = value.startsWith(PREFIX) ? value.slice(PREFIX.length) : value;
  return /^[0-9a-f]{32}$/.test(token) ? token : null;
}

/** The token grouped in fours, so it can be read out or typed when the camera will not focus. */
export function formatCardToken(token: string): string {
  return token.match(/.{1,4}/g)?.join(' ') ?? token;
}
