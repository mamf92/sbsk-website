import { useLoaderData } from 'react-router-dom';
import HomeHero from '../components/sections/HomeHeroSection';
import Posts from '../components/sections/PostsSection';
import type { PostTypes } from '../sanity/queryHelpers/posts';
import type { HomeHeroTypes } from '../sanity/queryHelpers/home-hero';

export default function Home() {
  const { posts, homeHero, postsFailed } = useLoaderData() as {
    posts: PostTypes[];
    homeHero: HomeHeroTypes | null;
    postsFailed: boolean;
  };

  return (
    <>
      <div className="bg-page text-fg min-h-[60vh]">
        {homeHero ? <HomeHero {...homeHero} /> : <HomeHero />}
        <Posts posts={posts} failed={postsFailed} />
      </div>
    </>
  );
}
