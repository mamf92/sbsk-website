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

const exampleContent = {
  title: 'Velkommen til Stavanger Brettspillklubb',
  subtitle: 'Din destinasjon for brettspillglede i Stavanger',
  imageUrl:
    'https://img.freepik.com/premium-photo/people-having-fun-while-playing-board-game_146671-2342.jpg?w=1480',
  imageAlt: 'Brettspill på bordet',
  imageLicense: 'CC BY-SA 4.0',
  imageSourceUrl: 'https://example.com/image',
  links: [
    { label: 'Bli medlem', url: '/bli-medlem' },
    { label: 'Se arrangementer', url: '/arrangementer' },
  ],
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supbaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supbaseKey);

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
        <HomeHero {...exampleContent} />
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
