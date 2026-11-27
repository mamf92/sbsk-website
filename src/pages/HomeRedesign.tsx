import { useLoaderData } from 'react-router-dom';
import type { HomeRedesignData } from '../loaders/home-redesign-loader';
import { NextEventHero } from '../components/sections/redesign/NextEventHero';
import { NewcomerPath } from '../components/sections/redesign/NewcomerPath';
import { NoticeBoard } from '../components/sections/redesign/NoticeBoard';
import { PosterGrid } from '../components/sections/redesign/UpcomingHighlights';
import { SectionHeading } from '../components/ui/SectionHeading';
import { TextLink } from '../components/ui/TextLink';
import { eventHighlights, nextGameNight, upcomingEvents } from '../utils/eventHighlights';

/**
 * The new front page (round 3, behind `redesignEnabled`). Answers the first question most
 * visitors have, «when can I just come?», before anything else: the next game night is the hero.
 * Then the way in for newcomers, the club's notice board, and the special events to plan for.
 */
export default function HomeRedesign() {
  const { homeHero, posts, postsFailed, events } = useLoaderData() as HomeRedesignData;
  const now = new Date();
  const next = nextGameNight(events, now);
  const later = upcomingEvents(events, now)
    .filter((event) => event !== next)
    .slice(0, 3);
  const highlights = eventHighlights(events, now).slice(0, 3);

  return (
    <div className="dark:bg-darkestblue bg-white">
      <h1 className="sr-only">Stavanger Brettspillklubb</h1>
      <NextEventHero next={next} later={later} photo={homeHero?.image} now={now} />
      <NewcomerPath />
      <NoticeBoard posts={posts} failed={postsFailed} />
      {highlights.length > 0 && (
        <section
          aria-labelledby="hoydepunkter"
          className="max-w-shell mx-auto flex flex-col gap-6 px-4 py-10 sm:px-6 lg:py-12"
        >
          <SectionHeading
            id="hoydepunkter"
            kicker="Sett av datoen"
            title="Kommende høydepunkter"
            action={
              <span className="text-darkestblue dark:text-white">
                <TextLink to="/kalender">Hele kalenderen</TextLink>
              </span>
            }
          />
          <PosterGrid highlights={highlights} />
        </section>
      )}
    </div>
  );
}
