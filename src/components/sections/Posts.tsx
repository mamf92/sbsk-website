import { Button } from '../ui/Buttons';
import { useState } from 'react';
import ExpandIcon from '../../assets/icons/arrows/expand.svg?react';
import Clock from '../../assets/icons/symbols/clock.svg?react';
import type { PostTypes } from '../../sanity/queryHelpers/posts';
import type { PostsHeroTypes } from '../../sanity/queryHelpers/posts-hero';
import { PortableText, toPlainText } from '@portabletext/react';
import { components } from '../../sanity/editors/portableTextComponents';
import type { PortableTextBlock } from '@portabletext/types';
import { useNavigate } from 'react-router-dom';

interface PostsProps {
  postsHero?: PostsHeroTypes;
  posts: PostTypes[];
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
  eventSlug?: string;
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

const sortOptions = [
  { label: 'Dato (siste til første)', value: 'date-desc' },
  { label: 'Dato (første til siste)', value: 'date-asc' },
  { label: 'Tittel (A-Å)', value: 'title-asc' },
  { label: 'Tittel (Å-A)', value: 'title-desc' },
] as const;

export default function Posts({ postsHero, posts }: PostsProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-12">
      {postsHero ? <PostsHero {...postsHero} /> : <PostsHero />}
      <PostsList posts={posts} />
    </div>
  );
}

function PostsHero({ title, subtitle }: PostsHeroTypes = {}) {
  const resolvedTitle = title || FALLBACK_POSTS.title;
  const resolvedSubtitle = subtitle || FALLBACK_POSTS.subtitle;
  return (
    <div className="bg-darkblue flex w-full max-w-5xl flex-col items-start gap-2 p-4 py-8 text-white">
      <h1 className="text-xl font-bold sm:text-2xl">{resolvedTitle}</h1>
      <p> {resolvedSubtitle}</p>
    </div>
  );
}

function PostsList({ posts }: { posts: PostTypes[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | PostCategory>('all');
  const [sortBy, setSelectedSort] = useState('date-desc');
  const [visibleItemCount, setVisibleItemCount] = useState(5);
  const postItems = posts as PostWithExtras[];
  const categoryColorMap: Record<PostCategory, string> = {
    nyheter: 'bg-darkblue text-white',
    spillkveldrapporter: 'bg-orange text-darkestblue',
    arrangementer: 'bg-darkorange text-white border-black',
  };

  const categoryColors =
    selectedCategory === 'all'
      ? 'bg-darkorange border-black text-white'
      : categoryColorMap[selectedCategory];

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
      <div className="mx-auto max-w-5xl px-2 sm:px-0">
        <div className="mx-auto max-w-5xl px-5 py-8">
          <h2 className="text-darkestblue mb-2 text-3xl font-bold md:text-4xl dark:text-white">
            Ingen innlegg
          </h2>
          <p className="text-darkestblue mb-6 text-base dark:text-white">
            Det ser ikke ut til å være noen innlegg for øyeblikket. Vennligst sjekk igjen senere.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex w-full max-w-5xl flex-col items-center gap-2 px-2 sm:px-0">
      <input
        type="text"
        placeholder="Søk etter innlegg..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="focus:ring-orange border-darkblue dark:border-orange placeholder:text-placeholder text-darkblue w-full border px-4 py-3 focus:ring-2 focus:outline-none"
      />
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`border px-4 py-2 text-sm font-medium capitalize transition ${
              selectedCategory === category
                ? `${categoryColors}`
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {category === 'all' ? 'Alle innlegg' : category}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelectedSort(option.value)}
            className={`border px-4 py-2 text-sm font-medium capitalize transition ${
              sortBy === option.value
                ? `bg-darkorange border-black text-white`
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {displayedPosts.length === 0 && (
        <div className="flex w-full flex-col items-center justify-center gap-4 p-6">
          <p className="text-darkestblue text-3xl font-bold md:text-4xl dark:text-white">
            Ingen innlegg matcher søket.
          </p>
          <Button variant="primary" size="lg" icon="backspace" onClick={clearFilters}>
            Fjern filtre
          </Button>
        </div>
      )}
      {displayedPosts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
      {visibleItemCount < sortedPosts.length && (
        <Button variant="primary" size="lg" onClick={handleLoadedMore}>
          Last inn flere
        </Button>
      )}
    </div>
  );
}

function PostCard({ post }: { post: PostWithExtras }) {
  const [expandedPost, setExpandedPost] = useState(true);
  const postCategory: PostCategory = post.category;
  const navigate = useNavigate();
  const INTERNAL_ORIGIN = 'https://www.mamf92.github.io/sbsk-website';

  const categoryStyles = {
    nyheter: {
      container: 'bg-darkblue text-white',
      expandWrapper: 'bg-darkestblue',
      detailsPanel: 'bg-darkblue',
    },
    spillkveldrapporter: {
      container: 'bg-orange text-darkestblue',
      expandWrapper: 'bg-darkestorange',
      detailsPanel: 'bg-orange',
    },
    arrangementer: {
      container: 'bg-darkorange text-white',
      expandWrapper: 'bg-orange',
      detailsPanel: 'bg-darkorange',
    },
  }[postCategory];

  const publishedAt = new Date(post.publishedAt);

  return (
    <div
      className={`${categoryStyles.container} flex w-full flex-col items-center justify-between border border-black`}
    >
      <div className="flex w-full items-center justify-between gap-2 p-4 sm:max-h-38">
        <div className="flex h-full flex-1 flex-col gap-1 sm:flex-initial sm:gap-2">
          <div className="flex sm:flex-row sm:items-center sm:gap-1">
            <div className="flex items-center gap-1">
              <span>
                <Clock className="h-4 w-4 fill-current text-inherit" />
              </span>
              <p className="text-sm text-inherit capitalize">
                {publishedAt.toLocaleString('no-NO', {
                  weekday: 'long',
                })}
              </p>
              <p className="text-sm text-inherit normal-case">
                {publishedAt.toLocaleString('no-NO', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </p>
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-center gap-2">
            <h3 className="text-xl leading-5 font-bold text-inherit sm:text-2xl sm:leading-normal">
              {post.title}
            </h3>
            {post.subtitle && <p className="text-heading text-md sm:text-base">{post.subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center justify-end sm:flex-1 sm:pr-4">
          <button onClick={() => setExpandedPost((prev) => !prev)}>
            <ExpandIcon
              className={`${expandedPost ? 'rotate-180' : 'rotate-0'} h-6 w-6 fill-current text-inherit`}
            />
          </button>
        </div>
      </div>
      {expandedPost && (
        <div className={`${categoryStyles.expandWrapper} flex w-full flex-col p-2 sm:p-4`}>
          <div
            className={`${categoryStyles.detailsPanel} flex flex-col items-start gap-1 p-2 sm:p-4`}
          >
            {post.content && <PortableText value={post.content} components={components} />}
          </div>
        </div>
      )}
      {post.links && post.links.length > 0 && (
        <div
          className={`${categoryStyles.expandWrapper} flex w-full flex-col px-2 pt-0 pb-2 sm:px-4 sm:pt-0 sm:pb-4`}
        >
          <div className="flex flex-row flex-wrap gap-2">
            {post.links.map((link, index) => {
              const isInternal = link.url.startsWith(INTERNAL_ORIGIN);

              if (isInternal) {
                const path = new URL(link.url, window.location.href).pathname;
                return (
                  <Button
                    variant={postCategory === 'arrangementer' ? 'tertiary' : 'primary'}
                    size="sm"
                    icon="right"
                    key={index}
                    onClick={() => navigate(path)}
                  >
                    {link.label}
                  </Button>
                );
              }

              return (
                <Button
                  key={index}
                  variant={postCategory === 'arrangementer' ? 'tertiary' : 'primary'}
                  size="sm"
                  icon="right"
                  onClick={() => {
                    window.location.href = link.url;
                  }}
                >
                  {link.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
