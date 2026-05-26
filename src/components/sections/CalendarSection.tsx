import { Button } from '../ui/Buttons';
import { useState } from 'react';
import { urlFor } from '../../sanity/sanityImageUrl';
import calendarPlaceholderImage from '../../assets/images/calendar-placeholder.png';
import ExpandIcon from '../../assets/icons/arrows/expand.svg?react';
import LocationPin from '../../assets/icons/symbols/locationpin.svg?react';
import Clock from '../../assets/icons/symbols/clock.svg?react';
import ArrowRight from '../../assets/icons/arrows/arrowright.svg?react';
import type { CalendarEventTypes } from '../../sanity/queryHelpers/events';
import type { CalendarHeroTypes } from '../../sanity/queryHelpers/calendar-hero';
import { useNavigate } from 'react-router-dom';
import { PortableText, toPlainText } from '@portabletext/react';
import { components } from '../../sanity/editors/portableTextComponents';

interface CalendarSectionProps {
  calendarHero?: CalendarHeroTypes;
  events: CalendarEventTypes[];
}

const FALLBACK_CALENDAR = {
  title: 'Kalender',
  subtitle:
    'Her vil du finne oversikt over alle våre arrangementer fra ukentlige spillkvelder, til turneringer og andre events. ',
  imageUrl: calendarPlaceholderImage,
  imageSourceName: 'Designed by Freepik',
  imageSourceUrl: 'www.freepik.com',
};

export default function CalendarSection({ calendarHero, events }: CalendarSectionProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-6">
      {calendarHero ? <CalendarHero {...calendarHero} /> : <CalendarHero />}
      <EventList events={events} />
    </div>
  );
}

function CalendarHero({
  title,
  subtitle,
  image,
  imageSourceName,
  imageSourceUrl,
}: CalendarHeroTypes = {}) {
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
              `${urlFor(image).width(1024).fit('crop').url()} 1024w`,
            ].join(', ')}
            sizes="(max-width: 400px) 400px, (max-width: 800px) 800px, 1024px"
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

function EventList({ events }: { events: CalendarEventTypes[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSelectedSort] = useState('date-asc');
  const [visibleItemCount, setVisibleItemCount] = useState(5);

  const categories = ['all', 'spillkveld', 'turnering', 'annet'];

  const sortOptions = [
    { label: 'Dato (første til siste)', value: 'date-asc' },
    { label: 'Dato (siste til første)', value: 'date-desc' },
    { label: 'Tittel (A-Å)', value: 'title-asc' },
    { label: 'Tittel (Å-A)', value: 'title-desc' },
  ];

  const categoryColors =
    {
      spillkveld: 'bg-darkblue text-white',
      turnering: 'bg-orange text-darkestblue',
      annet: 'bg-darkorange text-white border-black',
    }[selectedCategory] || 'bg-darkorange border-black text-white';

  const filteredEvents = events.filter((event) => {
    const contentText = toPlainText(event.content || []);
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contentText.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || event.category.toLowerCase() === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const aStart = new Date(a.eventStartTime);
    const bStart = new Date(b.eventStartTime);
    if (sortBy === 'date-asc') return aStart.getTime() - bStart.getTime();
    if (sortBy === 'date-desc') return bStart.getTime() - aStart.getTime();
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

  const displayedEvents = sortedEvents.slice(0, visibleItemCount);

  const handleLoadedMore = () => {
    setVisibleItemCount((prev) => prev + 5);
  };

  function clearFilters() {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedSort('date-asc');
  }

  if (events.length === 0 || !events) {
    return (
      <div className="mx-auto max-w-5xl px-2 sm:px-0">
        <div className="mx-auto max-w-5xl px-5 py-8">
          <h2 className="text-darkestblue mb-2 text-3xl font-bold md:text-4xl dark:text-white">
            Ingen arrangementer
          </h2>
          <p className="text-darkestblue mb-6 text-base dark:text-white">
            Det ser ikke ut til å være noen kommende arrangementer for øyeblikket. Vennligst sjekk
            igjen senere.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex w-full max-w-5xl flex-col items-center gap-2 px-2 sm:px-0">
      <input
        type="text"
        placeholder="Søk etter arrangementer..."
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
            {category === 'all' ? 'Alle arrangementer' : category}
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
      {displayedEvents.length === 0 && (
        <div className="flex w-full flex-col items-center justify-center gap-4 p-6">
          <p className="text-darkestblue text-3xl font-bold md:text-4xl dark:text-white">
            Ingen arrangementer matcher søket.
          </p>
          <Button variant="primary" size="lg" icon="backspace" onClick={clearFilters}>
            Fjern filtre
          </Button>
        </div>
      )}
      {displayedEvents.map((calendarEvent) => (
        <EventCard key={calendarEvent._id} calendarEvent={calendarEvent} />
      ))}
      {visibleItemCount < sortedEvents.length && (
        <Button variant="primary" size="lg" onClick={handleLoadedMore}>
          Last inn flere
        </Button>
      )}
    </div>
  );
}

function EventCard({ calendarEvent }: { calendarEvent: CalendarEventTypes }) {
  const [expandedEvent, setExpandedEvent] = useState(false);
  console.log(calendarEvent.eventSlug);
  const INTERNAL_ORIGIN = 'https://www.mamf92.github.io/sbsk-website';
  const navigate = useNavigate();

  const backgroundColor = {
    spillkveld: 'darkblue',
    turnering: 'orange',
    annet: 'darkorange',
  }[calendarEvent.category];

  const expandColor = {
    spillkveld: 'darkestblue',
    turnering: 'darkestorange',
    annet: 'orange',
  }[calendarEvent.category];

  const textColor = {
    spillkveld: 'white',
    turnering: 'darkestblue',
    annet: 'white',
  }[calendarEvent.category];
  const startTime = new Date(calendarEvent.eventStartTime);
  const endTime = new Date(calendarEvent.eventEndTime);
  return (
    <div
      className={`bg-${backgroundColor} text-${textColor} flex w-full flex-col items-center justify-between border border-black`}
    >
      <div className="flex w-full items-center justify-between gap-4 p-4 sm:h-27">
        <div className="flex flex-col items-center gap-0">
          <p className="text-center text-4xl font-bold text-inherit">
            {startTime.toLocaleString('no-NO', { day: 'numeric' })}
          </p>
          <p className="text-center text-2xl font-bold text-inherit uppercase">
            {startTime.toLocaleString('no-NO', { month: 'short' })}
          </p>
        </div>
        <div className="flex h-full flex-1 flex-col gap-2 sm:flex-initial sm:justify-between sm:gap-0">
          <div className="flex sm:flex-row sm:items-center sm:gap-1">
            <div className="flex items-center gap-1">
              <span>
                <Clock className="h-4 w-4 fill-current text-inherit" />
              </span>
              <p className="text-sm text-inherit capitalize">
                {startTime.toLocaleString('no-NO', {
                  weekday: 'long',
                })}
              </p>
              <p className="text-sm text-inherit normal-case">
                {startTime.toLocaleString('no-NO', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </p>
            </div>
            <span className="hidden text-sm text-inherit sm:block">-</span>
            <div className="hidden items-center gap-1 sm:flex">
              <p className="text-sm text-inherit capitalize">
                {endTime.toLocaleString('no-NO', {
                  weekday: 'long',
                })}
              </p>
              <p className="text-sm text-inherit normal-case">
                {endTime.toLocaleString('no-NO', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-lg leading-5 font-bold text-inherit sm:leading-normal">
              {calendarEvent.title}
            </h3>
          </div>
          {calendarEvent.location && (
            <div className="flex items-center gap-1">
              <span>
                <LocationPin className="h-4 w-4 fill-current text-inherit" />
              </span>
              <p className="text-sm leading-4 text-inherit sm:text-center sm:leading-normal">
                {calendarEvent.location}
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end sm:flex-1 sm:pr-4">
          {calendarEvent.category === 'spillkveld' || calendarEvent.category === 'annet' ? (
            <button onClick={() => setExpandedEvent((prev) => !prev)}>
              <ExpandIcon
                className={`${expandedEvent ? 'rotate-180' : 'rotate-0'} h-6 w-6 fill-current text-inherit`}
              />
            </button>
          ) : null}
          {calendarEvent.category === 'turnering' && (
            <button
              onClick={() =>
                window.open(
                  `${window.location.origin}/arrangementer/${calendarEvent.eventSlug}`,
                  '_blank',
                )
              }
            >
              <ArrowRight className="h-6 w-6 fill-current text-inherit" />
            </button>
          )}
        </div>
      </div>
      {expandedEvent && (
        <div className={`bg-${expandColor} flex w-full flex-col p-2 sm:p-6`}>
          <div className={`bg-${backgroundColor} flex flex-col gap-4 p-2 sm:p-6`}>
            {calendarEvent.content && (
              <PortableText value={calendarEvent.content} components={components} />
            )}
            {calendarEvent.image && (
              <div className="relative h-84 w-full lg:h-100">
                <img
                  src={urlFor(calendarEvent.image).width(1440).fit('crop').url()}
                  srcSet={[
                    `${urlFor(calendarEvent.image).width(400).fit('crop').url()} 400w`,
                    `${urlFor(calendarEvent.image).width(800).fit('crop').url()} 800w`,
                    `${urlFor(calendarEvent.image).width(1024).fit('crop').url()} 1024w`,
                  ].join(', ')}
                  sizes="(max-width: 400px) 400px, (max-width: 800px) 800px, 1024px"
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            {calendarEvent.links && calendarEvent.links.length > 0 && (
              <div className="flex flex-row flex-wrap gap-2">
                {calendarEvent.links.map((link, index) => {
                  const isInternal = link.url.startsWith(INTERNAL_ORIGIN);
                  if (isInternal) {
                    const path = new URL(link.url, window.location.href).pathname;
                    return (
                      <Button
                        variant={calendarEvent.category === 'annet' ? 'tertiary' : 'primary'}
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
                      variant={calendarEvent.category === 'annet' ? 'tertiary' : 'primary'}
                      size="sm"
                      icon="right"
                      key={index}
                      onClick={() => window.open(link.url, '_blank')}
                      rel="noopener noreferrer"
                    >
                      {link.label}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
