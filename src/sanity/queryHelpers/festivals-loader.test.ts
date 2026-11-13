import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LoaderFunctionArgs } from 'react-router-dom';

const fetch = vi.fn();
vi.mock('../client', () => ({ client: { fetch: (...args: unknown[]) => fetch(...args) } }));

const { arrangementLoader, boardGameMastersLoader, ARRANGEMENT_BY_SLUG_QUERY, CURRENT_BGM_QUERY } =
  await import('./festivals');

const args = (id?: string) => ({ params: { id } }) as unknown as LoaderFunctionArgs;
const event = { _id: 'event-1', title: 'Spillkveld' };
const festival = { _id: 'festival-1', slug: 'bgm-2027' };

async function status(promise: Promise<unknown>): Promise<number> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof Response) return error.status;
    throw error;
  }
  throw new Error('expected the loader to throw');
}

beforeEach(() => {
  fetch.mockReset();
});

describe('arrangementLoader', () => {
  it('asks for both kinds by slug in one query', async () => {
    fetch.mockResolvedValue({ event, festival: null });
    await arrangementLoader(args('spillkveld'));
    expect(fetch).toHaveBeenCalledWith(ARRANGEMENT_BY_SLUG_QUERY, { slug: 'spillkveld' });
  });

  it('returns an event with its own page', async () => {
    fetch.mockResolvedValue({ event, festival: null });
    await expect(arrangementLoader(args('spillkveld'))).resolves.toEqual({ kind: 'event', event });
  });

  it('returns a festival, and prefers it if both somehow share a slug', async () => {
    fetch.mockResolvedValue({ event, festival });
    await expect(arrangementLoader(args('bgm-2027'))).resolves.toEqual({
      kind: 'festival',
      festival,
    });
  });

  it('is a 404 when neither exists', async () => {
    fetch.mockResolvedValue({ event: null, festival: null });
    expect(await status(arrangementLoader(args('finnes-ikke')))).toBe(404);
  });

  it('is a 400 without a slug, and does not query', async () => {
    expect(await status(arrangementLoader(args()))).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('boardGameMastersLoader', () => {
  it('asks for the edition that has not ended yet, by the Oslo date', async () => {
    vi.useFakeTimers({ now: new Date('2027-01-29T23:30:00Z') });
    try {
      fetch.mockResolvedValue(festival);
      await expect(boardGameMastersLoader()).resolves.toEqual({ festival });
      expect(fetch).toHaveBeenCalledWith(CURRENT_BGM_QUERY, { today: '2027-01-30' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('returns null rather than a 404 when no edition is published', async () => {
    fetch.mockResolvedValue(null);
    await expect(boardGameMastersLoader()).resolves.toEqual({ festival: null });
  });
});
