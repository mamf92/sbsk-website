import { defineConfig, Studio } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { nbNOLocale } from '@sanity/locale-nb-no';
import { documentActions, newDocumentOptions, structure } from '../sanity/structure';
import { homeHeroType } from '../sanity/schemaTypes/heroType';
import { calendarHeroType } from '../sanity/schemaTypes/calendarHeroType';
import { eventType } from '../sanity/schemaTypes/eventType';
import { postType } from '../sanity/schemaTypes/postType';
import { gameType } from '../sanity/schemaTypes/gameType';
import { gamesHeroType } from '../sanity/schemaTypes/gamesHeroType';
import { aboutPageType } from '../sanity/schemaTypes/aboutPageType';
import { boardMemberType } from '../sanity/schemaTypes/boardMemberType';

const appBase = import.meta.env.VITE_BASE ?? '/';
const basePrefix = appBase === '/' ? '' : appBase.replace(/\/$/, '');
const studioBasePath = `${basePrefix}/studio`;

const config = defineConfig({
  projectId: '85tc4tb0',
  dataset: 'production',
  basePath: studioBasePath,
  title: 'SBSK – nettsidens innhold',
  // The Studio's own buttons and menus in Norwegian, like the field labels. Each editor can
  // still switch to English from their profile menu.
  // Vision (the query playground) is a developer tool, so editors on the deployed site never see
  // it in the menu.
  plugins: [
    structureTool({ structure, title: 'Innhold' }),
    nbNOLocale(),
    ...(import.meta.env.DEV ? [visionTool()] : []),
  ],
  document: {
    newDocumentOptions,
    actions: (prev, context) => documentActions(prev, context),
  },
  schema: {
    types: [
      homeHeroType,
      eventType,
      calendarHeroType,
      postType,
      gameType,
      gamesHeroType,
      aboutPageType,
      boardMemberType,
    ],
  },
});

export default function StudioRoute() {
  return (
    <div className="h-[calc(100vh-5.0625rem)] max-h-dvh overflow-auto antialiased">
      <Studio config={config} />
    </div>
  );
}
