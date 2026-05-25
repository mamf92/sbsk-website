import { useLoaderData } from 'react-router-dom';
import HomeHero from '../components/sections/HomeHeroSection';
import Calendar from '../components/sections/CalendarSection';
import Posts from '../components/sections/PostsSection';
import type { PostTypes } from '../sanity/queryHelpers/posts';
import type { HomeHeroTypes } from '../sanity/queryHelpers/home-hero';
import type { CalendarHeroTypes } from '../sanity/queryHelpers/calendar-hero';
import type { CalendarEventTypes } from '../sanity/queryHelpers/events';

export default function Home() {
  const { posts, homeHero, calendarHero, events } = useLoaderData() as {
    posts: PostTypes[];
    homeHero: HomeHeroTypes | null;
    calendarHero: CalendarHeroTypes | null;
    events: CalendarEventTypes[];
  };

  return (
    <>
      <div className="dark:bg-darkestblue min-h-[60vh] bg-white dark:text-white">
        {homeHero ? <HomeHero {...homeHero} /> : <HomeHero />}
        {calendarHero ? (
          <Calendar calendarHero={calendarHero} events={events} />
        ) : (
          <Calendar events={events} />
        )}
        <Posts posts={posts} />
      </div>
    </>
  );
}
