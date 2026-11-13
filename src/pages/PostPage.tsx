import * as React from 'react';
import { Link as RouterLink, useLoaderData } from 'react-router-dom';
import { PortableText } from '@portabletext/react';
import { Carousel } from '../components/ui/Carousel';
import { linkClassesInherit } from '../components/ui/Link';
import { PostDate } from '../components/ui/PostDate';
import { PostLinkButtons } from '../components/ui/PostLinkButtons';
import { Tag } from '../components/ui/Tag';
import { components } from '../sanity/editors/portableTextComponents';
import type { PostTypes } from '../sanity/queryHelpers/posts';
import { resolvePostLinks } from '../utils/postLinks';

const SITE = 'Stavanger Brettspillklubb';

const categoryLabel: Record<PostTypes['category'], string> = {
  nyheter: 'Nyheter',
  spillkveldrapporter: 'Spillkveldrapport',
  arrangementer: 'Arrangementer',
};

/**
 * One post on a page of its own, so it can be linked to and shared. The feed on the front page
 * still opens posts in place; this is where «Les hele innlegget» and shared links land.
 */
export default function PostPage() {
  const { post } = useLoaderData() as { post: PostTypes };
  const links = resolvePostLinks(post.links);
  const related = post.relatedEvent?.path ? post.relatedEvent : null;

  React.useEffect(() => {
    document.title = `${post.title} · ${SITE}`;
    return () => {
      document.title = SITE;
    };
  }, [post.title]);

  return (
    <div className="dark:bg-darkestblue min-h-[60vh] bg-white pb-16 dark:text-white">
      <article className="max-w-content content-gutter:px-0 font-body mx-auto flex w-full flex-col gap-6 px-3 pt-6">
        <RouterLink to="/" className={`${linkClassesInherit} w-fit underline`}>
          ← Alle innlegg
        </RouterLink>

        <header className="bg-darkblue surface-dark flex flex-col items-start gap-3 p-4 text-white sm:p-6">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Tag tone="orange">{categoryLabel[post.category] ?? post.category}</Tag>
            <PostDate publishedAt={new Date(post.publishedAt)} />
          </div>
          <h1 className="font-heading text-h1 tracking-heading font-bold">{post.title}</h1>
          {post.subtitle && <p className="text-lg">{post.subtitle}</p>}
        </header>

        {post.carousel && post.carousel.length > 0 && (
          <Carousel images={post.carousel} label={`Bilder fra «${post.title}»`} />
        )}

        {post.content && (
          <div className="sbsk-rt flow-root">
            <PortableText value={post.content} components={components} />
          </div>
        )}

        {(links.length > 0 || related) && (
          <div className="flex flex-wrap gap-3">
            {related?.path && (
              <RouterLink
                to={related.path}
                className={`${linkClassesInherit} self-center font-bold underline`}
              >
                Les om {related.title ?? 'arrangementet'}
              </RouterLink>
            )}
            <PostLinkButtons links={links} variant="primary" size="md" />
          </div>
        )}
      </article>
    </div>
  );
}
