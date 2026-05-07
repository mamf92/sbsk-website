import { Button } from '../ui/Buttons';
import { useNavigate } from 'react-router-dom';
import { urlFor } from '../../sanity/sanityImageUrl';
import calendarPlaceholderImage from '../../assets/images/calendar-placeholder.png';
import { type SanityImageSource } from '@sanity/image-url';

interface CalendarHeroProps {
  title?: string;
  subtitle?: string;
  image?: SanityImageSource;
  imageUrl?: string;
  imageSourceName?: string;
  imageSourceUrl?: string;
}

const FALLBACK_CALENDAR = {
  title: 'Kalender',
  subtitle:
    'Her vil du finne oversikt over alle våre arrangementer fra ukentlige spillkvelder, til turneringer og andre events. ',
  imageUrl: calendarPlaceholderImage,
  imageSourceName: 'Designed by Freepik',
  imageSourceUrl: 'www.freepik.com',
};

export default function Calendar() {
  return (
    <div className="flex flex-col items-center gap-12 py-12">
      <CalendarHero />
      {/* <CalendarSearch /> */}
      {/* <EventList /> */}
    </div>
  );
  /* ... */
}

function CalendarHero({
  title,
  subtitle,
  image,
  imageUrl,
  imageSourceName,
  imageSourceUrl,
}: CalendarHeroProps = {}) {
  const resolvedTitle = title || FALLBACK_CALENDAR.title;
  const resolvedSubtitle = subtitle || FALLBACK_CALENDAR.subtitle;
  const resolvedImageSource = imageSourceName || FALLBACK_CALENDAR.imageSourceName;
  const resolvedImageSourceUrl = imageSourceUrl || FALLBACK_CALENDAR.imageSourceUrl;
  return (
    <div className="flex max-w-5xl flex-col px-3 sm:px-0">
      <div className="relative">
        {image && (
          <img
            src={urlFor(image).width(1440).fit('crop').url()}
            srcSet={[
              `${urlFor(image).width(400).fit('crop').url()} 400w`,
              `${urlFor(image).width(800).fit('crop').url()} 800w`,
              `${urlFor(image).width(1200).fit('crop').url()} 1200w`,
              `${urlFor(image).width(1440).fit('crop').url()} 1440w`,
            ].join(', ')}
            sizes="(max-width: 400px) 400px, (max-width: 800px) 800px, (max-width: 1200px) 1200px, 1440px"
            alt=""
            className="h-full w-full object-cover"
          />
        )}
        {!image && (
          <img src={FALLBACK_CALENDAR.imageUrl} alt="" className="h-full w-full object-cover" />
        )}
        <div>
          {resolvedImageSource && resolvedImageSourceUrl && (
            <div className="absolute right-4 bottom-2 flex flex-col">
              <a
                href={resolvedImageSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-darkestblue/50 text-xs text-white underline sm:text-sm"
              >
                {resolvedImageSource}
              </a>
            </div>
          )}
        </div>
      </div>
      <div className="bg-darkblue flex flex-col items-start gap-2 p-2 text-white">
        <h1 className="text-xl font-bold">{resolvedTitle}</h1>
        <p> {resolvedSubtitle}</p>
      </div>
    </div>
  );
}

function CalendarSearch() {
  /* ... */
}
function EventList() {
  /* ... */
}
function EventCard() {
  /* ... */
}
