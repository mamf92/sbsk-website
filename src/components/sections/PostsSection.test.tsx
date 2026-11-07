import { render, screen, within } from '@testing-library/react';
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
    subtitle: 'En kort ingress',
    publishedAt: '2026-06-05T18:00:00Z',
    category: 'nyheter',
    content: body('a', 'Brødtekst for det nyeste'),
  },
  {
    _id: 'midt',
    title: 'Midterste innlegg',
    publishedAt: '2026-05-05T18:00:00Z',
    category: 'spillkveldrapporter',
    content: body('b', 'Brødtekst for det midterste'),
  },
  {
    _id: 'eldst',
    title: 'Eldste innlegg',
    publishedAt: '2026-04-05T18:00:00Z',
    category: 'arrangementer',
    content: body('c', 'Brødtekst for det eldste'),
  },
];

const renderList = (list: PostTypes[] = posts, failed = false) =>
  render(
    <MemoryRouter>
      <Posts posts={list} failed={failed} />
    </MemoryRouter>,
  );

const cardTitles = () =>
  within(screen.getByRole('list'))
    .getAllByRole('heading', { level: 3 })
    .map((h) => h.textContent);

describe('PostsSection', () => {
  it('shows every post as a card that links to its own page', () => {
    renderList();
    expect(cardTitles()).toEqual(['Nyeste innlegg', 'Midterste innlegg', 'Eldste innlegg']);
    expect(screen.getByRole('link', { name: 'Nyeste innlegg' })).toHaveAttribute(
      'href',
      '/innlegg/nyest',
    );
  });

  it('summarises with the subtitle, or with the start of the body when there is none', () => {
    renderList();
    expect(screen.getByText('En kort ingress')).toBeInTheDocument();
    expect(screen.getByText('Brødtekst for det midterste')).toBeInTheDocument();
  });

  it('labels each card with its category as a tag', () => {
    renderList();
    expect(screen.getByText('Spillkveldrapport')).toHaveClass('bg-tag-orange-bg');
  });

  it('counts the results and filters by category', async () => {
    renderList();
    expect(screen.getByText('3 innlegg')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Nyheter' }));
    expect(cardTitles()).toEqual(['Nyeste innlegg']);
    expect(screen.getByText('1 innlegg')).toBeInTheDocument();
  });

  it('searches titles and body text', async () => {
    renderList();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Søk etter innlegg' }), 'eldste');
    expect(cardTitles()).toEqual(['Eldste innlegg']);
  });

  it('sorts with the native select', async () => {
    renderList();
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Sorter etter' }),
      screen.getByRole('option', { name: 'Tittel (A–Å)' }),
    );
    expect(cardTitles()).toEqual(['Eldste innlegg', 'Midterste innlegg', 'Nyeste innlegg']);
  });

  it('offers Nullstill only once something is filtered, and it resets everything', async () => {
    renderList();
    expect(screen.queryByRole('button', { name: 'Nullstill' })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Arrangementer' }));
    await userEvent.click(screen.getByRole('button', { name: 'Nullstill' }));

    expect(cardTitles()).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Alle' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('turns a search with no matches into an empty state with a way back', async () => {
    renderList();
    await userEvent.type(screen.getByRole('searchbox'), 'zzzz');
    expect(
      screen.getByRole('heading', { name: 'Ingen innlegg matcher søket' }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Nullstill filtre' }));
    expect(cardTitles()).toHaveLength(3);
  });

  it('shows six at a time and reveals more on request', async () => {
    const many = Array.from({ length: 8 }, (_, i) => ({
      ...posts[0],
      _id: `p${i}`,
      title: `Innlegg ${i}`,
    }));
    renderList(many);
    expect(cardTitles()).toHaveLength(6);

    await userEvent.click(screen.getByRole('button', { name: 'Vis flere innlegg' }));
    expect(cardTitles()).toHaveLength(8);
    expect(screen.queryByRole('button', { name: 'Vis flere innlegg' })).toBeNull();
  });

  it('tells a failed fetch apart from an empty feed', () => {
    const { unmount } = renderList([], true);
    expect(screen.getByRole('heading', { name: 'Kunne ikke laste innlegg' })).toBeInTheDocument();
    unmount();

    renderList([]);
    expect(screen.getByRole('heading', { name: 'Ingen innlegg' })).toBeInTheDocument();
  });

  it('reads its filters from the URL, so Back from a post returns to the same view', () => {
    render(
      <MemoryRouter initialEntries={['/?kategori=spillkveldrapporter&sok=midterste']}>
        <Posts posts={posts} />
      </MemoryRouter>,
    );
    expect(cardTitles()).toEqual(['Midterste innlegg']);
    expect(screen.getByRole('searchbox')).toHaveValue('midterste');
    expect(screen.getByRole('button', { name: 'Spillkveldrapporter' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('keeps every card it had shown when the URL says so', () => {
    const many = Array.from({ length: 8 }, (_, i) => ({
      ...posts[0],
      _id: `p${i}`,
      title: `Innlegg ${i}`,
    }));
    render(
      <MemoryRouter initialEntries={['/?vis=12']}>
        <Posts posts={many} />
      </MemoryRouter>,
    );
    expect(cardTitles()).toHaveLength(8);
  });

  it('ignores a category or sort in the URL that it does not know', () => {
    render(
      <MemoryRouter initialEntries={['/?kategori=tull&sorter=tull']}>
        <Posts posts={posts} />
      </MemoryRouter>,
    );
    expect(cardTitles()).toHaveLength(3);
    expect(screen.getByRole('combobox')).toHaveValue('date-desc');
  });
});
