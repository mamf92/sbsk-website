import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BADGE_CATEGORIES, BADGES, MANUAL_BADGE_SLUGS } from './badges';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('badge content', () => {
  it('names the categories the Sanity event schema offers, plus festival', () => {
    const schema = read('../sanity/schemaTypes/eventType.ts');
    const options = [...schema.matchAll(/\{ title: '[^']+', value: '([a-z-]+)' \}/g)].map(
      (match) => match[1],
    );
    expect([...options, 'festival'].sort()).toEqual([...BADGE_CATEGORIES].sort());
  });

  it('has text for every badge the migration seeds, and the same manual ones', () => {
    const migration = read('../../supabase/migrations/20261122030000_badges.sql');
    const seeded = [...migration.matchAll(/^ {2}\('([a-z0-9-]+)',\s+'(auto|manual)'/gm)];
    expect(seeded.map((match) => match[1]).sort()).toEqual(Object.keys(BADGES).sort());
    expect(
      seeded
        .filter((match) => match[2] === 'manual')
        .map((match) => match[1])
        .sort(),
    ).toEqual([...MANUAL_BADGE_SLUGS].sort());
  });
});
