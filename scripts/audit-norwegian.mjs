// Usage: npm run audit:norwegian — lists published Sanity content missing a Norwegian version.
// Read-only; uses the public dataset, so it needs no token.
import { auditDocument } from './norwegianAudit.mjs';

const query = encodeURIComponent('*[!(_type match "sanity.*") && !(_id in path("drafts.**"))]');
const res = await fetch(
  `https://85tc4tb0.apicdn.sanity.io/v2024-01-01/data/query/production?query=${query}`,
);
if (!res.ok) throw new Error(`Sanity answered ${res.status}`);
const { result } = await res.json();

const rows = result.flatMap((doc) =>
  auditDocument(doc).map((row) => ({ type: doc._type, ...row })),
);
if (rows.length === 0) {
  console.log(`OK: ${result.length} dokumenter, alt har norsk tekst.`);
} else {
  console.log(`${rows.length} funn i ${result.length} dokumenter:\n`);
  for (const r of rows) console.log(`- [${r.type}] ${r.path}\n    ${r.problem}: «${r.sample}»`);
  process.exitCode = 1;
}
