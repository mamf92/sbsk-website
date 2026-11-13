import type { LoaderFunctionArgs } from 'react-router-dom';
import { evaluate, parse } from 'groq-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();
vi.mock('../client', () => ({ client: { fetch: (...args: unknown[]) => fetchMock(...args) } }));

const { POST_BY_SLUG_QUERY, postDetailLoader } = await import('./posts');

const args = (id?: string) => ({ params: { id } }) as unknown as LoaderFunctionArgs;

describe('postDetailLoader', () => {
  beforeEach(() => fetchMock.mockReset());

  it('passes the slug as a parameter and returns the post', async () => {
    fetchMock.mockResolvedValue({ _id: 'p1', title: 'Høstprogrammet' });
    await expect(postDetailLoader(args('host"]'))).resolves.toEqual({
      post: { _id: 'p1', title: 'Høstprogrammet' },
    });
    expect(fetchMock).toHaveBeenCalledWith(POST_BY_SLUG_QUERY, { slug: 'host"]' });
  });

  it('is a 404 when there is no such post, and a 400 without a slug', async () => {
    fetchMock.mockResolvedValue(null);
    const missing = await postDetailLoader(args('finnes-ikke')).catch((e: unknown) => e);
    expect((missing as Response).status).toBe(404);
    const noSlug = await postDetailLoader(args()).catch((e: unknown) => e);
    expect((noSlug as Response).status).toBe(400);
  });
});

describe('POST_BY_SLUG_QUERY', () => {
  const post = (id: string, ref: string) => ({
    _id: id,
    _type: 'post',
    title: id,
    slug: { current: id },
    relatedEvent: { _ref: ref },
  });
  const dataset = [
    post('om-festival', 'f1'),
    post('om-side', 'e1'),
    post('om-kalender', 'e2'),
    { _id: 'f1', _type: 'festival', title: { nb: 'BGM' }, slug: { current: 'bgm' } },
    {
      _id: 'e1',
      _type: 'event',
      title: 'Med side',
      slug: { current: 'med-side' },
      hasDetailPage: true,
    },
    { _id: 'e2', _type: 'event', title: 'Bare kalender', slug: { current: 'kalender' } },
  ];
  const related = async (slug: string) =>
    (
      (await (await evaluate(parse(POST_BY_SLUG_QUERY), { dataset, params: { slug } })).get()) as {
        relatedEvent: unknown;
      }
    ).relatedEvent;

  it('links back to a festival, or to an event with its own page', async () => {
    expect(await related('om-festival')).toEqual({ title: 'BGM', path: '/arrangementer/bgm' });
    expect(await related('om-side')).toEqual({
      title: 'Med side',
      path: '/arrangementer/med-side',
    });
  });

  it('gives no path to a calendar-only event', async () => {
    expect(await related('om-kalender')).toEqual({ title: 'Bare kalender', path: null });
  });
});
