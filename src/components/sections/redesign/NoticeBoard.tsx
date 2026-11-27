import { Link } from 'react-router-dom';
import { toPlainText } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/types';
import type { PostTypes } from '../../../sanity/queryHelpers/posts';
import { getThumbnail } from '../../../sanity/queryHelpers/posts';
import { urlFor } from '../../../sanity/sanityImageUrl';
import { formatDate } from '../../../utils/eventDateFormat';
import { SectionHeading } from '../../ui/SectionHeading';
import { TextLink } from '../../ui/TextLink';
import { postCategory } from './eventStyles';
import ArrowRight from '../../../assets/icons/arrows/arrowright.svg?react';

const TILTS = ['tilt-left', 'tilt-right', 'tilt-left', 'tilt-right'];

function excerpt(post: PostTypes, length: number) {
  const blocks = (post.content ?? []).filter(
    (block): block is PortableTextBlock =>
      block._type === 'block' && (block as { style?: string }).style === 'normal',
  );
  const plain = toPlainText(blocks);
  return plain.length > length ? `${plain.slice(0, length).replace(/\s+\S*$/, '')} …` : plain;
}

/**
 * «Oppslagstavla»: the latest posts as notes pinned to the club's notice board. The newest is a
 * wide lead note; the pin colour is the post's category. `isNew` marks a note «Ny» (members).
 */
export function NoticeBoard({
  posts,
  failed,
  isNew,
}: {
  posts: PostTypes[];
  failed?: boolean;
  isNew?: (post: PostTypes) => boolean;
}) {
  const [lead, ...rest] = posts;
  return (
    <section
      aria-labelledby="oppslagstavla"
      className="bg-darkestblue dot-pattern relative overflow-hidden"
    >
      <div className="max-w-shell relative mx-auto flex flex-col gap-8 px-4 py-10 sm:px-6 lg:py-12">
        <SectionHeading
          id="oppslagstavla"
          invert
          kicker="Siste fra klubben"
          title="Oppslagstavla"
          action={
            <span className="text-white">
              <TextLink to="/innlegg">Alle innlegg</TextLink>
            </span>
          }
        />
        {failed && (
          <p className="font-body text-white">
            Vi fikk ikke hentet innleggene akkurat nå. Prøv igjen om litt.
          </p>
        )}
        {lead && (
          <ul className="grid gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-4">
            <Note post={lead} tilt={TILTS[0]} lead fresh={isNew?.(lead)} />
            {rest.slice(0, 6).map((post, i) => (
              <Note
                key={post._id}
                post={post}
                tilt={TILTS[(i + 1) % TILTS.length]}
                hiddenOnPhone={i >= 3}
                fresh={isNew?.(post)}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Note({
  post,
  tilt,
  lead = false,
  fresh = false,
  hiddenOnPhone = false,
}: {
  post: PostTypes;
  tilt: string;
  lead?: boolean;
  fresh?: boolean;
  /** Phones show the lead and three notes; the rest wait behind «Alle innlegg». */
  hiddenOnPhone?: boolean;
}) {
  const category = postCategory(post.category);
  const thumbnail = getThumbnail(post);
  const image = thumbnail
    ? urlFor(thumbnail)
        .width(lead ? 900 : 600)
        .height(lead ? 506 : 400)
        .fit('crop')
        .auto('format')
        .url()
    : null;
  const text = lead && !image ? excerpt(post, 300) : '';
  return (
    <li className={`flex ${lead ? 'md:col-span-2' : ''} ${hiddenOnPhone ? 'max-md:hidden' : ''}`}>
      <Link
        to={`/innlegg/${post.slug.current}`}
        className={`text-darkestblue tilt-straighten focus-visible:outline-focus-ring relative flex w-full flex-col gap-2 border border-black bg-white p-4 pt-6 no-underline shadow-[6px_6px_0_rgb(0_0_0/0.35)] focus-visible:outline-2 focus-visible:outline-offset-4 ${tilt}`}
      >
        <span
          aria-hidden="true"
          className={`absolute -top-2.5 left-1/2 size-5 -translate-x-1/2 rounded-full border-2 border-black ${category.pin}`}
        />
        {fresh && (
          <span className="font-heading bg-orange absolute -top-3 -right-3 rotate-6 px-2 py-0.5 text-xs font-extrabold tracking-[0.12em] uppercase">
            Ny
          </span>
        )}
        {image && (
          <img
            src={image}
            alt=""
            loading="lazy"
            className={`w-full border border-black object-cover ${lead ? 'aspect-video' : 'aspect-[3/2]'}`}
          />
        )}
        <span className="font-body text-xs">
          <span className="font-heading font-extrabold tracking-[0.14em] uppercase">
            {category.label}
          </span>{' '}
          · {formatDate(new Date(post.publishedAt), 'nb')}
        </span>
        <h3 className={`font-heading font-extrabold ${lead ? 'text-h2' : 'text-h3'}`}>
          {post.title}
        </h3>
        {post.subtitle && (
          <p className={`font-body ${lead ? 'text-lg' : 'text-sm'}`}>{post.subtitle}</p>
        )}
        {text && <p className="font-body text-sm opacity-90">{text}</p>}
        {lead && (
          <span className="font-heading mt-auto inline-flex items-center gap-1.5 pt-1 text-sm font-bold">
            Les hele <ArrowRight aria-hidden="true" className="h-4 w-4 fill-current" />
          </span>
        )}
      </Link>
    </li>
  );
}
