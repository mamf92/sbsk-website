import { useLoaderData } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import HomeHero from '../components/sections/HomeHero';
import Calendar from '../components/sections/Calendar';
import Posts from '../components/sections/Posts';
import type { PostTypes } from '../sanity/queryHelpers/posts';
import type { HomeHeroTypes } from '../sanity/queryHelpers/home-hero';
import type { CalendarHeroTypes } from '../sanity/queryHelpers/calendar-hero';
import type { CalendarEventTypes } from '../sanity/queryHelpers/events';

interface Admin {
  id: number;
  name: string;
  email: string;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supbaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supbaseKey);

export default function Home() {
  const { posts, homeHero, calendarHero, events } = useLoaderData() as {
    posts: PostTypes[];
    homeHero: HomeHeroTypes | null;
    calendarHero: CalendarHeroTypes | null;
    events: CalendarEventTypes[];
  };
  const base = import.meta.env.VITE_BASE;
  console.log('Base URL:', base);
  const host = window.location.host;
  console.log('Current host:', host);
  const [admins, setAdmins] = useState<Admin[]>([]);
  console.log('Fetched posts:', posts);
  useEffect(() => {
    getAdmins();
  }, []);

  async function getAdmins() {
    const { data, error } = await supabase.from('admins').select('*');
    if (error) {
      console.error('Error fetching admins:', error);
    } else {
      setAdmins(data);
    }
  }

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
        {admins.map((admin) => (
          <li key={admin.id}>
            <h3 className="text-xl font-semibold">{admin.name}</h3>
            <p>{admin.email}</p>
          </li>
        ))}
      </div>
    </>
  );
}
