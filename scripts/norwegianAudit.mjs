/**
 * Finds Sanity content that would show English (or nothing) on the Norwegian site.
 * Pure functions here; `audit-norwegian.mjs` fetches the documents and prints the report.
 */

const SKIP_KEYS = new Set([
  '_id',
  '_type',
  '_key',
  '_rev',
  '_createdAt',
  '_updatedAt',
  'asset',
  'slug',
  'style',
  'listItem',
  'marks',
  'href',
  'url',
  'link',
  'email',
  'contactEmail',
]);

const EN_WORDS = new Set(
  'the and for with you your are our will this that from have not but all can join come get new more about of to in on at is it we us be by as an or'.split(
    ' ',
  ),
);
const NB_WORDS = new Set(
  'og det er som på med for til av den en et ikke vi du har kan skal om fra ved alle ut oss deg dere vil bli var men de nå'.split(
    ' ',
  ),
);

/** True when a text looks English rather than Norwegian: needs enough words to judge. */
export function looksEnglish(text) {
  const words =
    String(text)
      .toLowerCase()
      .match(/[a-zæøå']+/g) ?? [];
  if (words.length < 4) return false;
  const en = words.filter((w) => EN_WORDS.has(w)).length;
  const nb = words.filter((w) => NB_WORDS.has(w)).length;
  return en >= 2 && en > nb;
}

function plainText(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value
      .map((block) => (block?.children ? block.children.map((c) => c?.text ?? '').join('') : ''))
      .join(' ');
  }
  return '';
}

/** Locale objects hold `nb`/`en`, as string or Portable Text array. */
function isLocaleObject(value) {
  return (
    value && typeof value === 'object' && !Array.isArray(value) && ('nb' in value || 'en' in value)
  );
}

/** Walks a document; returns `{ path, problem, sample }` rows. */
export function auditDocument(doc) {
  const rows = [];
  const walk = (value, path) => {
    if (Array.isArray(value)) {
      value.forEach((item, i) => walk(item, `${path}[${item?._key ?? i}]`));
      return;
    }
    if (!value || typeof value !== 'object') return;
    if (isLocaleObject(value)) {
      const nb = plainText(value.nb).trim();
      const en = plainText(value.en).trim();
      if (!nb && en)
        rows.push({ path, problem: 'mangler norsk (kun engelsk)', sample: en.slice(0, 80) });
      else if (nb && looksEnglish(nb))
        rows.push({ path, problem: 'norsk felt ser engelsk ut', sample: nb.slice(0, 80) });
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      if (SKIP_KEYS.has(key)) continue;
      if (typeof child === 'string') {
        if (looksEnglish(child))
          rows.push({
            path: `${path}.${key}`,
            problem: 'ikke-oversatt tekst ser engelsk ut',
            sample: child.slice(0, 80),
          });
      } else if (Array.isArray(child) && child[0]?._type === 'block') {
        const text = plainText(child);
        if (looksEnglish(text))
          rows.push({
            path: `${path}.${key}`,
            problem: 'ikke-oversatt tekst ser engelsk ut',
            sample: text.slice(0, 80),
          });
      } else {
        walk(child, `${path}.${key}`);
      }
    }
  };
  walk(doc, doc._id);
  return rows;
}
