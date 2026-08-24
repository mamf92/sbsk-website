import type { AboutPageTypes } from '../../../sanity/queryHelpers/about-page';
import type { BoardMemberTypes } from '../../../sanity/queryHelpers/board-members';
import { urlFor } from '../../../sanity/sanityImageUrl';
import { BoardMemberCard } from './BoardMemberCard';
import { FALLBACK_ABOUT, FALLBACK_BOARD } from './fallbackAbout';

interface AboutUsSectionProps {
  aboutPage?: AboutPageTypes | null;
  boardMembers: BoardMemberTypes[];
}

export default function AboutUsSection({ aboutPage, boardMembers }: AboutUsSectionProps) {
  const imageUrl = aboutPage?.image
    ? urlFor(aboutPage.image).width(1440).fit('crop').url()
    : FALLBACK_ABOUT.imageUrl;
  const imageSourceName = aboutPage?.imageSource?.imageSourceName;
  const imageSourceUrl = aboutPage?.imageSource?.imageSourceUrl;

  const clubTitle = aboutPage?.clubTitle || FALLBACK_ABOUT.clubTitle;
  const clubIntro = aboutPage?.clubIntro || FALLBACK_ABOUT.clubIntro;
  const clubBody =
    aboutPage?.clubBody && aboutPage.clubBody.length > 0
      ? aboutPage.clubBody
      : FALLBACK_ABOUT.clubBody;

  const boardTitle = aboutPage?.boardTitle || FALLBACK_ABOUT.boardTitle;
  const boardIntro = aboutPage?.boardIntro || FALLBACK_ABOUT.boardIntro;

  // Real content wins the moment the Studio has any board members in it — same rule
  // OurGamesSection applies to its own hardcoded fallback.
  const members =
    boardMembers.length > 0
      ? boardMembers.map((member) => ({
          _id: member._id,
          name: member.name,
          role: member.role,
          bio: member.bio,
          imageUrl: member.image
            ? urlFor(member.image).width(400).height(400).fit('crop').url()
            : undefined,
        }))
      : FALLBACK_BOARD;

  return (
    <div className="flex flex-col items-center">
      <div className="h-56 w-full overflow-hidden sm:h-72 lg:h-96">
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        {imageSourceName && imageSourceUrl ? (
          <div className="relative">
            <a
              href={imageSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute right-4 bottom-2 text-sm text-white underline"
            >
              {imageSourceName}
            </a>
          </div>
        ) : null}
      </div>

      <div className="max-w-content w-full px-2 py-8 sm:px-0">
        <div className="bg-darkblue flex w-full flex-col gap-4 p-4 text-white sm:p-8">
          <h1 className="font-heading text-h1 font-bold">{clubTitle}</h1>
          <p className="font-body font-bold">{clubIntro}</p>
          {clubBody.map((paragraph, index) => (
            <p key={index} className="font-body">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      <div className="max-w-content w-full px-2 pb-8 sm:px-0">
        <div className="bg-darkblue flex w-full flex-col gap-6 p-4 text-white sm:p-8">
          <div className="flex flex-col gap-4">
            <h2 className="font-heading text-h2 font-bold">{boardTitle}</h2>
            <p className="font-body font-bold">{boardIntro}</p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] items-stretch gap-5">
            {members.map((member) => (
              <BoardMemberCard
                key={member._id}
                name={member.name}
                role={member.role}
                bio={member.bio}
                imageUrl={member.imageUrl}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
