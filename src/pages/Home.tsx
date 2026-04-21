import type { SanityDocument } from '@sanity/client';
import { Link, useLoaderData } from 'react-router-dom';

export default function Home() {
  const { posts } = useLoaderData() as { posts: SanityDocument[] };
  return (
    <>
      <main className="dark:bg-darkestblue min-h-[60vh] bg-white dark:text-white">
        <div className="text-orange font-heading text-6xl font-bold">Stavanger Brettspillklubb</div>
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
      </main>
    </>
  );
}
