import { Link as RouterLink, useLoaderData } from 'react-router-dom';
import { PortableText } from '@portabletext/react';
import { components } from '../sanity/editors/portableTextComponents';
import {
  POST_CATEGORY_LABELS,
  POST_CATEGORY_TONES,
  postDateLabel,
  type PostTypes,
} from '../sanity/queryHelpers/posts';
import { Carousel } from '../components/ui/Carousel';
import { Tag } from '../components/ui/Tag';
import { buttonClasses } from '../components/ui/buttonClasses';
import { linkClasses } from '../components/ui/linkClasses';
import { isInternalLink, internalLinkPath } from '../utils/internalLinks';
import ArrowLeft from '../assets/icons/arrows/arrowleft.svg?react';
import ArrowRight from '../assets/icons/arrows/arrowright.svg?react';

/**
 * A post's own page (decision 9): back link, tag and date, the title as the page's one `h1`,
 * the subtitle as a lead, the photos, the body, and the post's links as buttons. The first link
 * is the one orange action; any others are secondary.
 */
export default function PostPage() {
  const { post } = useLoaderData() as { post: PostTypes };
  const links = post.links ?? [];

  return (
    <div className="bg-page text-fg min-h-[60vh] pb-16">
      <article className="max-w-content content-gutter:px-0 mx-auto flex w-full flex-col gap-6 px-4 pt-8">
        <RouterLink to="/" className={`${linkClasses()} inline-flex items-center gap-2 self-start`}>
          <ArrowLeft aria-hidden="true" className="size-4 fill-current" />
          Alle innlegg
        </RouterLink>

        <header className="flex max-w-[70ch] flex-col gap-3">
          <div className="text-fg-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <Tag tone={POST_CATEGORY_TONES[post.category]}>
              {POST_CATEGORY_LABELS[post.category]}
            </Tag>
            <time dateTime={post.publishedAt}>{postDateLabel(post.publishedAt)}</time>
          </div>
          <h1 className="font-heading text-heading text-h1 font-bold">{post.title}</h1>
          {post.subtitle ? <p className="text-fg-muted text-lg">{post.subtitle}</p> : null}
        </header>

        {post.carousel && post.carousel.length > 0 ? (
          <Carousel images={post.carousel} label={`Bilder fra «${post.title}»`} />
        ) : null}

        {post.content ? (
          <div className="flex max-w-[70ch] flex-col gap-4 text-base">
            <PortableText value={post.content} components={components} />
          </div>
        ) : null}

        {links.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {links.map((link, index) => {
              const variant = index === 0 ? 'primary' : 'secondary';
              const content = (
                <>
                  {link.label}
                  <ArrowRight aria-hidden="true" className="size-4 shrink-0 fill-current" />
                </>
              );
              return isInternalLink(link.url) ? (
                <RouterLink
                  key={link.url + index}
                  to={internalLinkPath(link.url)}
                  className={buttonClasses({ variant })}
                >
                  {content}
                </RouterLink>
              ) : (
                <a key={link.url + index} href={link.url} className={buttonClasses({ variant })}>
                  {content}
                </a>
              );
            })}
          </div>
        ) : null}
      </article>
    </div>
  );
}
