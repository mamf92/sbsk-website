import { useLoaderData } from 'react-router-dom';
import HomeHero from '../components/sections/HomeHero';
import Calendar from '../components/sections/Calendar';
import Posts from '../components/sections/Posts';
import type { PostTypes } from '../sanity/queryHelpers/posts';
import type { HomeHeroTypes } from '../sanity/queryHelpers/home-hero';
import type { CalendarHeroTypes } from '../sanity/queryHelpers/calendar-hero';
import type { CalendarEventTypes } from '../sanity/queryHelpers/events';
import type { AdminTypes } from '../supabase/queryHelpers/getAdmins';

export default function Home() {
  const { posts, homeHero, calendarHero, events, admins } = useLoaderData() as {
    posts: PostTypes[];
    homeHero: HomeHeroTypes | null;
    calendarHero: CalendarHeroTypes | null;
    events: CalendarEventTypes[];
    admins: AdminTypes[];
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
        {admins && admins.length > 0 && (
          <ul>
            {admins.map((admin) => (
              <li key={admin.id}>
                <h3 className="text-xl font-semibold">{admin.name}</h3>
                <p>{admin.email}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
