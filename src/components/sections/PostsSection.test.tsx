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

// Card toggles are the only buttons whose aria-expanded is ever true in these tests — the
// filter chips use aria-pressed, and the sort Dropdown's trigger also carries aria-expanded
// but stays closed (false) throughout — so querying by `expanded: true` selects exactly the
// open post headers.
const toggle = (title: string) => screen.getByRole('button', { name: new RegExp(title) });
const openTitles = () =>
  screen
    .getAllByRole('button', { expanded: true })
    .map((el) => el.textContent?.match(/\w[\wåøæÅØÆ ]*innlegg/)?.[0]);

describe('PostsSection expand behaviour', () => {
  it('leaves every post closed on load, the newest one included', () => {
    renderList();

    expect(toggle('Nyeste innlegg')).toHaveAttribute('aria-expanded', 'false');
    expect(toggle('Midterste innlegg')).toHaveAttribute('aria-expanded', 'false');
    expect(toggle('Eldste innlegg')).toHaveAttribute('aria-expanded', 'false');
  });

  it('opening a post leaves the already-open ones open', async () => {
    // The reason this is not an accordion: auto-closing the post above shifts everything
    // below it up by that post's full height, yanking the header out from under the pointer.
    renderList();

    await userEvent.click(toggle('Nyeste innlegg'));
    await userEvent.click(toggle('Midterste innlegg'));
    expect(openTitles()).toHaveLength(2);

    await userEvent.click(toggle('Eldste innlegg'));
    expect(openTitles()).toHaveLength(3);

    expect(toggle('Nyeste innlegg')).toHaveAttribute('aria-expanded', 'true');
    expect(toggle('Midterste innlegg')).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes only the post that was clicked', async () => {
    renderList();

    await userEvent.click(toggle('Nyeste innlegg'));
    await userEvent.click(toggle('Midterste innlegg'));
    await userEvent.click(toggle('Nyeste innlegg'));

    expect(toggle('Nyeste innlegg')).toHaveAttribute('aria-expanded', 'false');
    expect(toggle('Midterste innlegg')).toHaveAttribute('aria-expanded', 'true');
  });

  it('can close every post, leaving nothing open', async () => {
    renderList();

    await userEvent.click(toggle('Nyeste innlegg'));
    expect(screen.queryAllByRole('button', { expanded: true })).toHaveLength(1);

    await userEvent.click(toggle('Nyeste innlegg'));
    expect(screen.queryAllByRole('button', { expanded: true })).toHaveLength(0);
  });
});

describe('PostsSection month grouping', () => {
  it('groups posts under uppercase month dividers when sorted by date', () => {
    renderList();

    expect(screen.getByText('JUNI 2026')).toBeInTheDocument();
    expect(screen.getByText('MAI 2026')).toBeInTheDocument();
    expect(screen.getByText('APRIL 2026')).toBeInTheDocument();
  });

  it('hides the month dividers under a title sort, without dropping any post', async () => {
    renderList();

    await userEvent.click(screen.getByRole('button', { name: 'Sorter innlegg' }));
    await userEvent.click(screen.getByRole('option', { name: 'Tittel (A-Å)' }));

    expect(screen.queryByText('JUNI 2026')).not.toBeInTheDocument();
    expect(screen.queryByText('MAI 2026')).not.toBeInTheDocument();
    expect(screen.queryByText('APRIL 2026')).not.toBeInTheDocument();
    expect(toggle('Nyeste innlegg')).toBeInTheDocument();
    expect(toggle('Midterste innlegg')).toBeInTheDocument();
    expect(toggle('Eldste innlegg')).toBeInTheDocument();
  });
});

describe('PostsSection links', () => {
  it('shows a post’s link buttons only while it is open', async () => {
    const withLinks: PostTypes[] = [
      {
        ...posts[0],
        links: [{ label: 'Meld deg på', url: 'https://example.com/paamelding' }],
      },
      posts[1],
      posts[2],
    ];
    render(
      <MemoryRouter>
        <Posts posts={withLinks} />
      </MemoryRouter>,
    );

    // Every post loads closed (#223), so the link is not reachable until one is opened.
    expect(screen.queryByRole('button', { name: /Meld deg på/ })).not.toBeInTheDocument();

    await userEvent.click(toggle('Nyeste innlegg'));
    expect(screen.getByRole('button', { name: /Meld deg på/ })).toBeInTheDocument();

    await userEvent.click(toggle('Nyeste innlegg'));
    expect(screen.queryByRole('button', { name: /Meld deg på/ })).not.toBeInTheDocument();
  });

  it('renders every link a post has, not just one or two', async () => {
    const withManyLinks: PostTypes[] = [
      {
        ...posts[0],
        links: [
          { label: 'Første lenke', url: 'https://example.com/1' },
          { label: 'Andre lenke', url: 'https://example.com/2' },
          { label: 'Tredje lenke', url: 'https://example.com/3' },
        ],
      },
      posts[1],
      posts[2],
    ];
    render(
      <MemoryRouter>
        <Posts posts={withManyLinks} />
      </MemoryRouter>,
    );

    await userEvent.click(toggle('Nyeste innlegg'));

    expect(screen.getByRole('button', { name: /Første lenke/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Andre lenke/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tredje lenke/ })).toBeInTheDocument();
  });
});

describe('PostsSection carousel', () => {
  it('renders a floated carousel region for a post that has one', () => {
    const withCarousel: PostTypes[] = [
      {
        ...posts[0],
        carousel: [
          {
            _type: 'image',
            _key: 'c1',
            alt: 'Bilde 1',
            asset: { _ref: 'image-abc-1536x2048-png' },
          },
          {
            _type: 'image',
            _key: 'c2',
            alt: 'Bilde 2',
            asset: { _ref: 'image-def-1536x2048-png' },
          },
        ],
      },
    ];
    render(
      <MemoryRouter>
        <Posts posts={withCarousel} />
      </MemoryRouter>,
    );

    const region = screen.getByRole('region', { name: /Bilder fra/ });
    expect(region).toHaveClass('lg:float-left', 'lg:w-1/2');
  });

  it('renders no carousel region for a post without one', () => {
    renderList();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
});
