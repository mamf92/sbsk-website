import * as React from 'react';
import { Link as RouterLink } from 'react-router-dom';

export type CardImage = {
  src: string;
  srcSet?: string;
  sizes?: string;
  /** `object-position`, so the crop keeps the editor's hotspot in frame. */
  position?: string;
};

type CardProps = Omit<React.HTMLAttributes<HTMLElement>, 'title'> & {
  /** Where the card goes. The whole card is one link to it. */
  to: string;
  title: string;
  image?: CardImage;
  /** Usually a `Tag`. */
  tag?: React.ReactNode;
  /** Usually a `<time>`. */
  date?: React.ReactNode;
  /** Two lines at most; the rest is cut with an ellipsis. */
  summary?: React.ReactNode;
  /** A list under a section `h2` wants `3`, the default. */
  headingLevel?: 2 | 3;
};

/**
 * A content card for a grid (decision 9): photo, tag, date, title and a two-line summary on a
 * white surface with the soft card shadow. The whole card is the link, made by stretching the
 * title's link over the card, so a screen reader hears one link named by the title. Hover
 * underlines the title and nothing moves. Keyboard focus outlines the whole card.
 *
 * The photo is decorative (`alt=""`): the title already says what the item is. Without a photo
 * the slot keeps its shape as a tinted block, so a row of cards stays even.
 */
export const Card = React.forwardRef<HTMLElement, CardProps>(function Card(
  { to, title, image, tag, date, summary, headingLevel = 3, className = '', ...props },
  ref,
) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';

  return (
    <article
      ref={ref}
      className={[
        'group bg-surface shadow-card relative flex flex-col rounded-none',
        'has-[a:focus-visible]:outline-focus has-[a:focus-visible]:outline-3 has-[a:focus-visible]:outline-offset-2',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {image ? (
        <img
          src={image.src}
          srcSet={image.srcSet}
          sizes={image.sizes}
          alt=""
          loading="lazy"
          decoding="async"
          style={image.position ? { objectPosition: image.position } : undefined}
          className="bg-surface-muted aspect-video w-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          data-testid="card-image-placeholder"
          className="bg-surface-muted aspect-video w-full"
        />
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {tag || date ? (
          <div className="text-fg-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {tag}
            {date}
          </div>
        ) : null}
        <Heading className="font-heading text-heading text-h4 font-bold">
          <RouterLink
            to={to}
            className="underline-offset-2 group-hover:underline after:absolute after:inset-0 focus-visible:outline-none"
          >
            {title}
          </RouterLink>
        </Heading>
        {summary ? <p className="text-fg-muted line-clamp-2">{summary}</p> : null}
      </div>
    </article>
  );
});
