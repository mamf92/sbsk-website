import { Button } from '../ui/Buttons';
import { Card, type CardCategory } from '../ui/Card';
import { Chip, type ChipCategory } from '../ui/Chip';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import EmptyState from '../ui/EmptyState';
import { useState } from 'react';
import Clock from '../../assets/icons/symbols/clock.svg?react';
import { getThumbnail, type PostTypes } from '../../sanity/queryHelpers/posts';
import { hotspotPosition } from '../../utils/sanityImage';
import type { PostsHeroTypes } from '../../sanity/queryHelpers/posts-hero';
import { PortableText, toPlainText } from '@portabletext/react';
import { components } from '../../sanity/editors/portableTextComponents';
import type { PortableTextBlock } from '@portabletext/types';
import { useNavigate } from 'react-router-dom';
import { urlFor } from '../../sanity/sanityImageUrl';

interface PostsProps {
  postsHero?: PostsHeroTypes;
  posts: PostTypes[];
  /** The fetch failed, as opposed to succeeding with nothing in it. See `homeLoader`. */
  failed?: boolean;
}

type PostCategory = 'nyheter' | 'spillkveldrapporter' | 'arrangementer';

type PostLink = {
  label: string;
  url: string;
};

type PostWithExtras = PostTypes & {
  category: PostCategory;
  publishedAt: string;
  links?: PostLink[];
  content?: PortableTextBlock[];
};

const FALLBACK_POSTS = {
  title: 'Innlegg',
  subtitle:
    'Her vil du finne de siste nyhetene, spillkveldrapportene og annet innhold fra klubben. ',
};

const categories: Array<'all' | PostCategory> = [
  'all',
  'nyheter',
  'spillkveldrapporter',
  'arrangementer',
];

// 'all' has no category colour of its own — it takes the neutral fill. A spillkveld*rapport*
// is a write-up of a spillkveld, so it inherits that category's colour.
const chipCategories: Record<'all' | PostCategory, ChipCategory> = {
  all: 'neutral',
  nyheter: 'nyheter',
  spillkveldrapporter: 'spillkveld',
  arrangementer: 'arrangementer',
};

// Same reasoning, against the Card's own palette rather than the Chip's.
const cardCategories: Record<PostCategory, CardCategory> = {
  nyheter: 'nyheter',
  spillkveldrapporter: 'spillkveld',
  arrangementer: 'arrangementer',
};

// Which Button variant survives on the open panel's fill. `primary` is orange, which all but
// vanishes on the orange-family panels the other two categories expand to.
const linkVariants: Record<PostCategory, 'primary' | 'tertiary'> = {
  nyheter: 'primary',
  spillkveldrapporter: 'tertiary',
  arrangementer: 'tertiary',
};

const sortOptions = [
  { label: 'Dato (siste til første)', value: 'date-desc' },
  { label: 'Dato (første til siste)', value: 'date-asc' },
  { label: 'Tittel (A-Å)', value: 'title-asc' },
  { label: 'Tittel (Å-A)', value: 'title-desc' },
] as const;

export default function Posts({ postsHero, posts, failed = false }: PostsProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-6">
      {postsHero ? <PostsHero {...postsHero} /> : <PostsHero />}
      <PostsList posts={posts} failed={failed} />
    </div>
  );
}

// An <h2>, not an <h1>. This renders on `/` under `HomeHeroSection`, whose title is the page's
// document heading — two h1s on one page leaves a screen reader without a single answer to
// "what is this page", and the h1 → h3 jump to the cards below came from the same place. The
// posts stack is a section of the front page, so h2 is both the honest level and the step that
// puts this heading above the card titles it introduces rather than below them.
function PostsHero({ title, subtitle }: PostsHeroTypes = {}) {
  const resolvedTitle = title || FALLBACK_POSTS.title;
  const resolvedSubtitle = subtitle || FALLBACK_POSTS.subtitle;
  return (
    <div className="bg-darkblue max-w-content flex w-full flex-col items-start gap-2 p-4 py-8 text-white">
      <h2 className="text-h2 font-bold">{resolvedTitle}</h2>
      <p> {resolvedSubtitle}</p>
    </div>
  );
}

function PostsList({ posts, failed }: { posts: PostTypes[]; failed?: boolean }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | PostCategory>('all');
  const [sortBy, setSelectedSort] = useState('date-desc');
  const [visibleItemCount, setVisibleItemCount] = useState(5);
  // Each card opens and closes on its own, seeded with the newest post open. `posts` arrives
  // publishedAt-desc from the GROQ query, so [0] is newest.
  //
  // Deliberately not an accordion, even though the design library specifies one. Auto-closing
  // the previously open card moves everything below it up by that card's full height, so the
  // header you just clicked jumps out from under the pointer — worst exactly when the open
  // card was long, which is when the reader is most likely to be mid-article. Nothing here
  // closes without the reader asking for it, so the only content shift is one they caused.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() =>
    posts[0] ? new Set([posts[0]._id]) : new Set(),
  );
  const postItems = posts as PostWithExtras[];

  const filteredPosts = postItems.filter((post) => {
    const bodyText = toPlainText(post.content || []);
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bodyText.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    const aPublishedAt = new Date(a.publishedAt);
    const bPublishedAt = new Date(b.publishedAt);
    if (sortBy === 'date-asc') return aPublishedAt.getTime() - bPublishedAt.getTime();
    if (sortBy === 'date-desc') return bPublishedAt.getTime() - aPublishedAt.getTime();
    if (sortBy === 'title-asc')
      return a.title.localeCompare(b.title, ['no', 'sv', 'da'], {
        sensitivity: 'base',
      });
    if (sortBy === 'title-desc')
      return b.title.localeCompare(a.title, ['no', 'sv', 'da'], {
        sensitivity: 'base',
      });
    return 0;
  });

  const displayedPosts = sortedPosts.slice(0, visibleItemCount);

  const handleLoadedMore = () => {
    setVisibleItemCount((prev) => prev + 5);
  };

  function clearFilters() {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedSort('date-desc');
  }

  if (posts.length === 0 || !posts) {
    return (
      <div className="max-w-content text-darkestblue mx-auto px-2 sm:px-0 dark:text-white">
        {/* "There are no posts" and "we could not reach Sanity" look identical from here, and only
            one of them is true. Saying the wrong one sends a visitor away believing the club has
            gone quiet. */}
        {failed ? (
          <EmptyState
            title="Kunne ikke laste innlegg"
            body="Vi fikk ikke kontakt med innholdstjenesten. Prøv å laste siden på nytt om et øyeblikk."
          />
        ) : (
          <EmptyState
            title="Ingen innlegg"
            body="Det ser ikke ut til å være noen innlegg for øyeblikket. Vennligst sjekk igjen senere."
          />
        )}
      </div>
    );
  }
  return (
    <div className="max-w-content flex w-full flex-col items-center gap-4 px-2 pb-2 sm:px-0 sm:pb-4">
      <Input
        type="search"
        icon="search"
        aria-label="Søk etter innlegg"
        placeholder="Søk etter innlegg…"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="flex w-full flex-col items-center gap-2">
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <Chip
              key={category}
              category={chipCategories[category]}
              active={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? 'Alle innlegg' : category}
            </Chip>
          ))}
        </div>
        <Select
          aria-label="Sorter innlegg"
          options={sortOptions}
          value={sortBy}
          onChange={(event) => setSelectedSort(event.target.value)}
          className="max-w-full"
        />
      </div>
      {displayedPosts.length === 0 && (
        <div className="flex w-full flex-col items-center justify-center gap-4 p-6">
          <p className="text-darkestblue text-h2 font-bold dark:text-white">
            Ingen innlegg matcher søket.
          </p>
          <Button variant="primary" size="lg" icon="backspace" onClick={clearFilters}>
            Fjern filtre
          </Button>
        </div>
      )}
      {displayedPosts.length > 0 && (
        // 14px between cards, per the design library — enough that the 6px hover shadow of
        // one card never touches the next.
        <div className="flex w-full flex-col gap-3.5">
          {displayedPosts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              expanded={expandedIds.has(post._id)}
              onToggle={() =>
                setExpandedIds((prev) => {
                  const next = new Set(prev);
                  // `delete` reports whether it removed anything, so this is toggle in one step.
                  if (!next.delete(post._id)) next.add(post._id);
                  return next;
                })
              }
            />
          ))}
        </div>
      )}
      {visibleItemCount < sortedPosts.length && (
        <Button variant="primary" size="lg" onClick={handleLoadedMore}>
          Last inn flere
        </Button>
      )}
    </div>
  );
}

function PostDate({ publishedAt }: { publishedAt: Date }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <Clock className="h-4 w-4 fill-current" aria-hidden="true" />
      <span className="capitalize">{publishedAt.toLocaleString('no-NO', { weekday: 'long' })}</span>
      <span>
        {publishedAt.toLocaleString('no-NO', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })}
      </span>
    </span>
  );
}

function PostCard({
  post,
  expanded,
  onToggle,
}: {
  post: PostWithExtras;
  expanded: boolean;
  onToggle: () => void;
}) {
  const navigate = useNavigate();
  const INTERNAL_ORIGIN = 'https://www.mamf92.github.io/sbsk-website';
  const publishedAt = new Date(post.publishedAt);
  const hasLinks = !!post.links && post.links.length > 0;
  const thumbnail = getThumbnail(post);

  return (
    <Card
      category={cardCategories[post.category]}
      date={<PostDate publishedAt={publishedAt} />}
      title={post.title}
      subtitle={post.subtitle}
      image={thumbnail && urlFor(thumbnail).width(320).height(320).fit('crop').url()}
      imagePosition={thumbnail && hotspotPosition(thumbnail)}
      expanded={expanded}
      onToggle={onToggle}
    >
      {post.content && <PortableText value={post.content} components={components} />}
      {hasLinks && (
        <div className="flex flex-row flex-wrap gap-2">
          {post.links?.map((link, index) => {
            const isInternal = link.url.startsWith(INTERNAL_ORIGIN);

            return (
              <Button
                key={index}
                variant={linkVariants[post.category]}
                size="sm"
                icon="right"
                onClick={() => {
                  if (isInternal) {
                    navigate(new URL(link.url, window.location.href).pathname);
                  } else {
                    window.location.href = link.url;
                  }
                }}
              >
                {link.label}
              </Button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
