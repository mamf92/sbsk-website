import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Posts from './PostsSection';
import type { PostTypes } from '../../sanity/queryHelpers/posts';

const body = (key: string, text: string) => [
  {
    _type: 'block' as const,
    _key: key,
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span' as const, _key: `${key}-s`, text, marks: [] }],
  },
];

// publishedAt-desc, the order the GROQ query returns.
const posts: PostTypes[] = [
  {
    _id: 'nyest',
    title: 'Nyeste innlegg',
    slug: { current: 'nyeste' },
    publishedAt: '2026-06-05T18:00:00Z',
    category: 'nyheter',
    content: body('a', 'Brødtekst for det nyeste'),
  },
  {
    _id: 'midt',
    title: 'Midterste innlegg',
    slug: { current: 'midterste' },
    publishedAt: '2026-05-05T18:00:00Z',
    category: 'spillkveldrapporter',
    content: body('b', 'Brødtekst for det midterste'),
  },
  {
    _id: 'eldst',
    title: 'Eldste innlegg',
    slug: { current: 'eldste' },
    publishedAt: '2026-04-05T18:00:00Z',
    category: 'arrangementer',
    content: body('c', 'Brødtekst for det eldste'),
  },
];

const renderList = () =>
  render(
    <MemoryRouter>
      <Posts posts={posts} />
    </MemoryRouter>,
  );

// Card toggles are the only buttons carrying aria-expanded — the filter and sort chips use
// aria-pressed — so querying by expanded state selects exactly the post headers.
const toggle = (title: string) => screen.getByRole('button', { name: new RegExp(title) });
const openTitles = () =>
  screen
    .getAllByRole('button', { expanded: true })
    .map((el) => el.textContent?.match(/\w[\wåøæÅØÆ ]*innlegg/)?.[0]);

describe('PostsSection expand behaviour', () => {
  it('opens the newest post and leaves the rest closed', () => {
    renderList();

    expect(toggle('Nyeste innlegg')).toHaveAttribute('aria-expanded', 'true');
    expect(toggle('Midterste innlegg')).toHaveAttribute('aria-expanded', 'false');
    expect(toggle('Eldste innlegg')).toHaveAttribute('aria-expanded', 'false');
  });

  it('opening a post leaves the already-open ones open', async () => {
    // The reason this is not an accordion: auto-closing the post above shifts everything
    // below it up by that post's full height, yanking the header out from under the pointer.
    renderList();

    await userEvent.click(toggle('Midterste innlegg'));
    expect(openTitles()).toHaveLength(2);

    await userEvent.click(toggle('Eldste innlegg'));
    expect(openTitles()).toHaveLength(3);

    expect(toggle('Nyeste innlegg')).toHaveAttribute('aria-expanded', 'true');
    expect(toggle('Midterste innlegg')).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes only the post that was clicked', async () => {
    renderList();

    await userEvent.click(toggle('Midterste innlegg'));
    await userEvent.click(toggle('Nyeste innlegg'));

    expect(toggle('Nyeste innlegg')).toHaveAttribute('aria-expanded', 'false');
    expect(toggle('Midterste innlegg')).toHaveAttribute('aria-expanded', 'true');
  });

  it('can close every post, leaving nothing open', async () => {
    renderList();

    await userEvent.click(toggle('Nyeste innlegg'));
    expect(screen.queryAllByRole('button', { expanded: true })).toHaveLength(0);
  });
});
