import { Link as RouterLink } from 'react-router-dom';
import { buttonClasses } from '../ui/buttonClasses';
import { Tag } from '../ui/Tag';
import type { FestivalTeaserTypes } from '../../sanity/queryHelpers/festivals';
import { HeroImage } from '../ui/HeroImage';
import { festivalDateLabel, festivalNameNb } from '../../utils/festival';

/**
 * A band on the home page for a festival that is running or starts within two months. The home
 * page is Norwegian-only, so this is too.
 */
export default function FestivalTeaser({ festival }: { festival: FestivalTeaserTypes }) {
  const title = festivalNameNb(festival.title);
  const dates = festivalDateLabel(festival.startDate, festival.endDate, 'nb');
  const path = `/arrangementer/${festival.slug}`;

  return (
    <section
      aria-labelledby="festival-teaser-heading"
      className="max-w-content content-gutter:px-0 mx-auto w-full px-2 pt-6"
    >
      <div className="bg-darkblue surface-dark font-body flex flex-col text-white sm:flex-row">
        {festival.heroImage && (
          <div className="aspect-[8/5] w-full sm:aspect-auto sm:w-2/5">
            <HeroImage image={festival.heroImage} />
          </div>
        )}
        <div className="flex flex-1 flex-col items-start gap-3 p-6 sm:p-8">
          {festival.edition && <Tag tone="orange">{festival.edition}</Tag>}
          <h2 id="festival-teaser-heading" className="font-heading text-h2 font-bold">
            {title}
          </h2>
          {dates && <p className="font-bold">{dates}</p>}
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
