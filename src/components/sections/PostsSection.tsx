import { useState } from 'react';
import { toPlainText } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/types';
import { Button } from '../ui/Buttons';
import { Card } from '../ui/Card';
import { Chip } from '../ui/Chip';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Tag } from '../ui/Tag';
import EmptyState from '../ui/EmptyState';
import AlertCircleIcon from '../../assets/icons/symbols/alert-circle.svg?react';
import InfoIcon from '../../assets/icons/symbols/info.svg?react';
import SearchIcon from '../../assets/icons/symbols/search.svg?react';
import {
  POST_CATEGORY_LABELS,
  POST_CATEGORY_TONES,
  getThumbnail,
  postDateLabel,
  postPath,
  postSummary,
  type PostTypes,
} from '../../sanity/queryHelpers/posts';
import type { PostsHeroTypes } from '../../sanity/queryHelpers/posts-hero';
import { hotspotPosition } from '../../utils/sanityImage';
import { urlFor } from '../../sanity/sanityImageUrl';

interface PostsProps {
  postsHero?: PostsHeroTypes;
  posts: PostTypes[];
  /** The fetch failed, as opposed to succeeding with nothing in it. See `homeLoader`. */
  failed?: boolean;
}

type PostCategory = PostTypes['category'];

const FALLBACK_POSTS = {
  title: 'Innlegg',
  subtitle: 'Her finner du de siste nyhetene, spillkveldrapportene og annet nytt fra klubben.',
};

const CATEGORY_FILTERS: { value: 'all' | PostCategory; label: string }[] = [
  { value: 'all', label: 'Alle' },
  { value: 'nyheter', label: 'Nyheter' },
  { value: 'spillkveldrapporter', label: 'Spillkveldrapporter' },
  { value: 'arrangementer', label: 'Arrangementer' },
];

const sortOptions = [
  { label: 'Nyeste først', value: 'date-desc' },
  { label: 'Eldste først', value: 'date-asc' },
  { label: 'Tittel (A–Å)', value: 'title-asc' },
  { label: 'Tittel (Å–A)', value: 'title-desc' },
] as const;

type SortOption = (typeof sortOptions)[number]['value'];

/** Two rows of three on a wide screen. */
const PAGE_SIZE = 6;

export default function Posts({ postsHero, posts, failed = false }: PostsProps) {
  return (
    <section className="max-w-content content-gutter:px-0 mx-auto flex w-full flex-col gap-6 px-4 py-10">
      <PostsHeading {...postsHero} />
      <PostsList posts={posts} failed={failed} />
    </section>
  );
}

// An <h2>, not an <h1>: this renders on `/` under the hero, whose title is the page's heading.
function PostsHeading({ title, subtitle }: PostsHeroTypes = {}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-heading text-heading text-h2 font-bold">
        {title || FALLBACK_POSTS.title}
      </h2>
      <p className="text-fg-muted max-w-[60ch]">{subtitle || FALLBACK_POSTS.subtitle}</p>
    </div>
  );
}

function PostsList({ posts, failed }: { posts: PostTypes[]; failed?: boolean }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<'all' | PostCategory>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (posts.length === 0) {
    // "There are no posts" and "we could not reach Sanity" look identical from here, and only
    // one of them is true.
    return failed ? (
      <EmptyState
        icon={AlertCircleIcon}
        headingLevel={3}
        title="Kunne ikke laste innlegg"
        body="Vi fikk ikke kontakt med innholdstjenesten. Prøv å laste siden på nytt om et øyeblikk."
      />
    ) : (
      <EmptyState
        icon={InfoIcon}
        headingLevel={3}
        title="Ingen innlegg"
        body="Det er ingen innlegg her ennå. Sjekk igjen senere."
      />
    );
  }

  const query = searchTerm.trim().toLowerCase();
  const filtered = posts.filter((post) => {
    const blocks = (post.content ?? []).filter(
      (block): block is PortableTextBlock => block._type === 'block',
    );
    const matchesSearch =
      !query ||
      post.title.toLowerCase().includes(query) ||
      toPlainText(blocks).toLowerCase().includes(query);
    return matchesSearch && (category === 'all' || post.category === category);
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date-asc') return Date.parse(a.publishedAt) - Date.parse(b.publishedAt);
    if (sortBy === 'date-desc') return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
    const byTitle = a.title.localeCompare(b.title, 'nb', { sensitivity: 'base' });
    return sortBy === 'title-asc' ? byTitle : -byTitle;
  });

  const shown = sorted.slice(0, visibleCount);
  const isFiltered = query !== '' || category !== 'all' || sortBy !== 'date-desc';

  function reset() {
    setSearchTerm('');
    setCategory('all');
    setSortBy('date-desc');
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <Input
        type="search"
        icon="search"
        aria-label="Søk etter innlegg"
        placeholder="Søk etter innlegg…"
        value={searchTerm}
        onChange={(event) => {
          setSearchTerm(event.target.value);
          setVisibleCount(PAGE_SIZE);
        }}
      />
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORY_FILTERS.map((filter) => (
            <Chip
              key={filter.value}
              active={category === filter.value}
              onClick={() => {
                setCategory(filter.value);
                setVisibleCount(PAGE_SIZE);
              }}
            >
              {filter.label}
            </Chip>
          ))}
        </div>
        <Select
          label="Sorter etter"
          labelHidden
          className="w-full sm:w-56"
          options={sortOptions}
          value={sortBy}
          onChange={setSortBy}
        />
      </div>

      <div className="flex min-h-9 items-center justify-between gap-3">
        <p aria-live="polite" className="text-fg-muted text-sm">
          {filtered.length === 1 ? '1 innlegg' : `${filtered.length} innlegg`}
        </p>
        {isFiltered ? (
          <Button variant="ghost" size="sm" onClick={reset}>
            Nullstill
          </Button>
        ) : null}
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          variant="inline"
          headingLevel={3}
          title="Ingen innlegg matcher søket"
          body="Prøv et annet søkeord, eller nullstill filtrene."
          action={
            <Button variant="secondary" onClick={reset}>
              Nullstill filtre
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((post) => (
            <li key={post._id} className="flex">
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      )}

      {visibleCount < sorted.length ? (
        <Button
          variant="secondary"
          className="self-center"
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
        >
          Vis flere innlegg
        </Button>
      ) : null}
    </div>
  );
}

function PostCard({ post }: { post: PostTypes }) {
  const thumbnail = getThumbnail(post);
  const crop = (width: number) =>
    thumbnail
      ? urlFor(thumbnail)
          .width(width)
          .height(Math.round((width * 9) / 16))
          .fit('crop')
          .auto('format')
          .url()
      : '';

  return (
    <Card
      className="w-full"
      to={postPath(post._id)}
      title={post.title}
      image={
        thumbnail
          ? {
              src: crop(640),
              srcSet: `${crop(400)} 400w, ${crop(640)} 640w, ${crop(960)} 960w`,
              sizes: '(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw',
              position: hotspotPosition(thumbnail),
            }
          : undefined
      }
      tag={
        <Tag tone={POST_CATEGORY_TONES[post.category]}>{POST_CATEGORY_LABELS[post.category]}</Tag>
      }
      date={<time dateTime={post.publishedAt}>{postDateLabel(post.publishedAt)}</time>}
      summary={postSummary(post)}
    />
  );
}
