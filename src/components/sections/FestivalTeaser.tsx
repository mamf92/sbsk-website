import { Link as RouterLink } from 'react-router-dom';
import { buttonClasses } from '../ui/buttonClasses';
import { Tag } from '../ui/Tag';
import type { FestivalTeaserTypes } from '../../sanity/queryHelpers/festivals';
import { urlFor } from '../../sanity/sanityImageUrl';
import { formatDateRange, formatDayLong } from '../../utils/eventDateFormat';
import { festivalDate } from '../../utils/festival';

/**
 * A band on the home page for a festival that is running or starts within two months. The home
 * page is Norwegian-only, so this is too.
 */
export default function FestivalTeaser({ festival }: { festival: FestivalTeaserTypes }) {
  const title = festival.title?.nb?.trim() || 'Board Game Masters';
  const dates =
    festival.startDate === festival.endDate
      ? formatDayLong(festivalDate(festival.startDate), 'nb')
      : formatDateRange(festivalDate(festival.startDate), festivalDate(festival.endDate), 'nb');
  const path = `/arrangementer/${festival.slug}`;

  return (
    <section
      aria-labelledby="festival-teaser-heading"
      className="max-w-content content-gutter:px-0 mx-auto w-full px-2 pt-6"
    >
      <div className="bg-darkblue surface-dark font-body flex flex-col text-white sm:flex-row">
        {festival.heroImage && (
          <img
            src={urlFor(festival.heroImage).width(640).height(400).fit('crop').auto('format').url()}
            alt=""
            loading="lazy"
            className="aspect-[8/5] w-full object-cover sm:w-2/5"
          />
        )}
        <div className="flex flex-1 flex-col items-start gap-3 p-6 sm:p-8">
          {festival.edition && <Tag tone="orange">{festival.edition}</Tag>}
          <h2 id="festival-teaser-heading" className="font-heading text-h2 font-bold">
            {title}
          </h2>
          <p className="font-bold">{dates}</p>
          {festival.tagline?.nb && <p>{festival.tagline.nb}</p>}
          <RouterLink
            to={`${path}#program`}
            className={buttonClasses({ variant: 'primary', size: 'md', className: 'mt-2' })}
          >
            Se programmet
          </RouterLink>
        </div>
      </div>
    </section>
  );
}
