import { useLoaderData } from 'react-router-dom';
import PostsSection from '../components/sections/PostsSection';
import type { PostTypes } from '../sanity/queryHelpers/posts';

/**
 * `/innlegg`: every post, with today's filterable feed. The new front page shows only the latest
 * notes, so «Alle innlegg» needs somewhere to go (behind `redesignEnabled`).
 */
export default function Posts() {
  const { posts, failed } = useLoaderData() as { posts: PostTypes[]; failed: boolean };
  return (
    <div className="dark:bg-darkestblue min-h-[60vh] bg-white dark:text-white">
      <h1 className="sr-only">Innlegg</h1>
      <PostsSection posts={posts} failed={failed} />
    </div>
  );
}
