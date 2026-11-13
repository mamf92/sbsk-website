import type { LoaderFunctionArgs } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();
vi.mock('../client', () => ({ client: { fetch: (...args: unknown[]) => fetchMock(...args) } }));

import { EVENT_BY_SLUG_QUERY, eventDetailLoader } from './events';

const args = (id?: string) => ({ params: { id } }) as unknown as LoaderFunctionArgs;

describe('eventDetailLoader', () => {
  beforeEach(() => fetchMock.mockReset());

  it('only matches events whose editor asked for a page', () => {
    // Every event has a slug, so the slug alone would give calendar-only events a page.
    expect(EVENT_BY_SLUG_QUERY).toMatch(/hasDetailPage\s*==\s*true/);
  });

  it('passes the slug as a GROQ parameter, never in the query text', async () => {
    fetchMock.mockResolvedValue({ _id: 'e1', title: 'Høstturnering' });
    await eventDetailLoader(args('host"]{..}'));
    expect(fetchMock).toHaveBeenCalledWith(EVENT_BY_SLUG_QUERY, { slug: 'host"]{..}' });
  });

  it('returns the event when one matches', async () => {
    fetchMock.mockResolvedValue({ _id: 'e1', title: 'Høstturnering' });
    await expect(eventDetailLoader(args('hostturnering'))).resolves.toEqual({
      event: { _id: 'e1', title: 'Høstturnering' },
    });
  });

  it('throws a 404 Response when no event with a page matches', async () => {
    fetchMock.mockResolvedValue(null);
    const error = await eventDetailLoader(args('spillkveld-torsdag')).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Response);
    expect((error as Response).status).toBe(404);
  });

  it('throws a 400 Response without a slug', async () => {
    const error = await eventDetailLoader(args()).catch((e: unknown) => e);
    expect((error as Response).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
