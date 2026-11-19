import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// The app calls tables, views and RPCs by name; the migrations are the only record of which
// exist. The board portal once shipped reading `member_season_status` while production had not
// had the migration applied, and nothing noticed until an admin opened the page. A stub-backed
// e2e test cannot see that, so this reads both sides and fails when the app names something no
// migration creates. (Whether a migration has been *applied* to a given project is a release
// step, not something CI can know.)

const root = process.cwd();

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [path] : [];
  });
}

const sql = readdirSync(join(root, 'supabase/migrations'))
  .filter((f) => f.endsWith('.sql'))
  .map((f) => readFileSync(join(root, 'supabase/migrations', f), 'utf8'))
  .join('\n');

function created(kind: string, name: string): boolean {
  const pattern = new RegExp(
    `create\\s+(or\\s+replace\\s+)?${kind}\\s+(if\\s+not\\s+exists\\s+)?(public\\.)?"?${name}"?\\b`,
    'i',
  );
  return pattern.test(sql);
}

const code = sourceFiles(join(root, 'src/supabase')).map((p) => readFileSync(p, 'utf8'));
const names = (re: RegExp) => [
  ...new Set(code.flatMap((c) => [...c.matchAll(re)].map((m) => m[1]))),
];

describe('app and migrations agree', () => {
  it.each(names(/\.from\('([a-z_]+)'\)/g).filter((n) => n !== 'profile-images'))(
    'table or view %s is created by a migration',
    (name) => {
      expect(created('(table|view)', name), `${name} is not in supabase/migrations`).toBe(true);
    },
  );

  it.each(names(/\.rpc\('([a-z_]+)'/g))('function %s is created by a migration', (name) => {
    expect(created('function', name), `${name} is not in supabase/migrations`).toBe(true);
  });
});
