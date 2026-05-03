import { Link, useLoaderData } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import HomeHero from '../components/sections/HomeHero';
import type { Post } from '../sanity/queryHelpers/posts';
import type { HomeHeroType } from '../sanity/queryHelpers/home-hero';

interface Admin {
  id: number;
  name: string;
  email: string;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supbaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supbaseKey);

export default function Home() {
  const { posts, homeHero } = useLoaderData() as {
    posts: Post[];
    homeHero: HomeHeroType | null;
  };
  const [admins, setAdmins] = useState<Admin[]>([]);
  console.log('Home loader data:', { posts });

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
        <h1 className="mb-8 text-4xl font-bold">Posts</h1>
        <ul className="flex flex-col gap-y-4">
          {posts.map((post) => (
            <li className="hover:underline" key={post._id}>
              <Link to={`/${post.slug.current}`}>
                <h2 className="text-xl font-semibold">{post.title}</h2>
                <p>{new Date(post.publishedAt).toLocaleDateString()}</p>
              </Link>
            </li>
          ))}
        </ul>
        <ul className="flex flex-col gap-y-4">
          {admins.map((admin) => (
            <li key={admin.id}>
              <h3 className="text-xl font-semibold">{admin.name}</h3>
              <p>{admin.email}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
