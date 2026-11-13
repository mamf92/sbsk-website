import * as React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { linkClassesInherit } from './Link';
import { useEventsT } from '../../i18n';
import { useLocale } from '../../hooks/locale/useLocale';
import type { RelatedPostTypes } from '../../sanity/queryHelpers/fragments';
import { formatDayLong } from '../../utils/eventDateFormat';

type RelatedPostsProps = Omit<React.HTMLAttributes<HTMLElement>, 'children'> & {
  posts: RelatedPostTypes[] | null | undefined;
};

/**
 * «Innlegg om arrangementet»: the newest posts an editor tied to this event or festival, each
 * linking to its own page. Posts are Norwegian-only, so on an English page they say so.
 */
export const RelatedPosts = React.forwardRef<HTMLElement, RelatedPostsProps>(
  ({ posts, className = '', ...props }, ref) => {
    const t = useEventsT();
    const { locale } = useLocale();
    const headingId = React.useId();
    if (!posts?.length) return null;
    const nbLang = locale === 'nb' ? undefined : 'nb';
    return (
      <section
        ref={ref}
        aria-labelledby={headingId}
        className={['font-body flex flex-col gap-3', className].join(' ')}
        {...props}
      >
        <h2 id={headingId} className="font-heading text-h3 font-bold">
          {t('relatedPosts')}
        </h2>
        <ul className="flex flex-col gap-3">
          {posts.map((post) => (
            <li key={post._id} className="border border-black p-4 dark:border-white">
              <time dateTime={post.publishedAt} className="text-sm opacity-80">
                {formatDayLong(new Date(post.publishedAt), locale)}
              </time>
              <p className="font-heading text-h4 font-bold" lang={nbLang}>
                <RouterLink
                  to={`/innlegg/${post.slug}`}
                  className={`${linkClassesInherit} underline`}
                >
                  {post.title}
                </RouterLink>
              </p>
              {post.subtitle && (
                <p className="text-sm" lang={nbLang}>
                  {post.subtitle}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>
    );
  },
);

RelatedPosts.displayName = 'RelatedPosts';
