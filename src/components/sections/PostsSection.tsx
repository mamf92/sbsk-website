import { Button } from '../ui/Buttons';
import { Card, type CardCategory } from '../ui/Card';
import { Carousel } from '../ui/Carousel';
import { Chip, type ChipCategory } from '../ui/Chip';
import { Dropdown } from '../ui/Dropdown';
import { Divider } from '../ui/Divider';
import { Input } from '../ui/Input';
import EmptyState from '../ui/EmptyState';
import { groupByMonth } from '../../utils/groupByMonth';
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
import { isInternalLink, internalLinkPath } from '../../utils/internalLinks';

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

// Which Button variant survives on the open card's *header* fill — these render in `Card`'s
// `actions` slot now, not the panel below it (#203). `primary` is orange, which all but
// vanishes on `spillkveld`'s orange header and `arrangementer`'s darkorange one; `tertiary`'s
// navy clears both. The values are unchanged from when this was keyed off the panel fill — the
// header and panel swap which of the two orange tones each category gets, but navy clears
// either one, so the same assignment still holds.
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

type SortOption = (typeof sortOptions)[number]['value'];

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
  const [sortBy, setSelectedSort] = useState<SortOption>('date-desc');
  const [visibleItemCount, setVisibleItemCount] = useState(5);
  // Each card opens and closes on its own, and the page loads with every one of them closed
  // (#223). Seeding the newest post open meant the list arrived already scrolled past by one
  // article's worth of body copy, which is not what a list of headlines is for.
  //
  // Deliberately not an accordion, even though the design library specifies one. Auto-closing
  // the previously open card moves everything below it up by that card's full height, so the
  // header you just clicked jumps out from under the pointer — worst exactly when the open
  // card was long, which is when the reader is most likely to be mid-article. Nothing here
  // opens or closes without the reader asking for it, so the only content shift is one they
  // caused.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
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

  // Dividers only read as month sections on a date-sorted list — grouping a title-sorted one
  // the same way would print the same month's divider again every time the alphabetical order
  // revisits it (see `groupByMonth`'s own comment, and the same call in `CalendarSection`), so
  // a title sort renders `displayedPosts` flat.
  const isTitleSort = sortBy === 'title-asc' || sortBy === 'title-desc';
  const postGroups = isTitleSort
    ? []
    : groupByMonth(displayedPosts, (post) => new Date(post.publishedAt));

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
      <div className="max-w-content text-darkestblue content-gutter:px-0 mx-auto px-2 dark:text-white">
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
    <div className="max-w-content content-gutter:px-0 flex w-full flex-col items-center gap-4 px-2 pb-2 sm:pb-4">
      <Input
        type="search"
        icon="search"
        aria-label="Søk etter innlegg"
        placeholder="Søk etter innlegg…"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
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
        <Dropdown
          label="Sorter innlegg"
          options={sortOptions}
          value={sortBy}
          onChange={setSelectedSort}
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
      {displayedPosts.length > 0 && isTitleSort && (
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
      {displayedPosts.length > 0 && !isTitleSort && (
        <div className="flex w-full flex-col gap-4">
          {postGroups.map((group) => (
            <div key={group.key} className="flex flex-col gap-3.5">
              <Divider>
                <span>{group.label}</span>
              </Divider>
              {group.items.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  expanded={expandedIds.has(post._id)}
                  onToggle={() =>
                    setExpandedIds((prev) => {
                      const next = new Set(prev);
                      if (!next.delete(post._id)) next.add(post._id);
                      return next;
                    })
                  }
                />
              ))}
            </div>
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
  const publishedAt = new Date(post.publishedAt);
  const hasLinks = !!post.links && post.links.length > 0;
  const thumbnail = getThumbnail(post);

  const actions = hasLinks
    ? post.links?.map((link, index) => {
        const isInternal = isInternalLink(link.url);

        return (
          <Button
            key={index}
            variant={linkVariants[post.category]}
            size="sm"
            icon="right"
            onClick={() => {
              if (isInternal) {
                navigate(internalLinkPath(link.url));
              } else {
                window.location.href = link.url;
              }
            }}
          >
            {link.label}
          </Button>
        );
      })
    : undefined;

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
      actions={actions}
    >
      {/* First child in the same normal-flow block as the body text below it — a carousel is a
          flex sibling of nothing, so the float here is what lets the body's text wrap beside it.
          Floated only from `lg` up; below that it's a full-width block at the top of the panel,
          per the mobile/tablet "top and centered, one column" treatment. */}
      {post.carousel && post.carousel.length > 0 && (
        <Carousel
          images={post.carousel}
          label={`Bilder fra «${post.title}»`}
          className="lg:float-left lg:mr-4 lg:mb-4 lg:w-1/2"
        />
      )}
      {post.content && <PortableText value={post.content} components={components} />}
    </Card>
  );
}
