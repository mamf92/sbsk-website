import { useLoaderData } from 'react-router-dom';
import AboutUsSection from '../components/sections/AboutUsSection/AboutUsSection';
import type { AboutPageTypes } from '../sanity/queryHelpers/about-page';
import type { BoardMemberTypes } from '../sanity/queryHelpers/board-members';

export default function AboutUs() {
  const { aboutPage, boardMembers } = useLoaderData() as {
    aboutPage: AboutPageTypes | null;
    boardMembers: BoardMemberTypes[];
  };

  return (
    <div className="dark:bg-darkestblue min-h-[60vh] bg-white dark:text-white">
      <AboutUsSection aboutPage={aboutPage} boardMembers={boardMembers} />
    </div>
  );
}
