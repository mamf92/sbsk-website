import type { SanityDocument } from '@sanity/client';
import { Link, useLoaderData } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import HomeHero from '../components/sections/HomeHero';

interface Admin {
  id: number;
  name: string;
  email: string;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supbaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supbaseKey);

const testdata = {
  title: 'Stavanger Brettspillklubb',
  subtitle: 'Dette er en annen tekst.',
  imageUrl:
    'https://images.unsplash.com/photo-1676482721063-75c432590cdd?q=80&w=3432&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  imageSource: 'Designed by Freepik',
  imageSourceUrl: 'www.freepik.com',
  links: [
    { label: 'Kalender med velding lang link tekst', url: '/kalender' },
    {
      label: 'Om oss. ',
      url: '/om-oss',
    },
  ],
};

export default function Home() {
  const { posts } = useLoaderData() as { posts: SanityDocument[] };
  const [admins, setAdmins] = useState<Admin[]>([]);

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
        <HomeHero />
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
