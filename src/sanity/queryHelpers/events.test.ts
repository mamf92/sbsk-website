import { describe, expect, it } from 'vitest';
import { EVENT_BY_SLUG_QUERY } from './events';

// The loader for /arrangementer/:id is `arrangementLoader` in festivals.ts, which composes this
// query; its hit, miss and 404 cases are tested there.
describe('EVENT_BY_SLUG_QUERY', () => {
  it('only matches events whose editor asked for a page', () => {
    // Every event has a slug, so the slug alone would give calendar-only events a page.
    expect(EVENT_BY_SLUG_QUERY).toMatch(/hasDetailPage\s*==\s*true/);
  });

  it('takes the slug as a GROQ parameter, never in the query text', () => {
    expect(EVENT_BY_SLUG_QUERY).toContain('slug.current == $slug');
  });
});
