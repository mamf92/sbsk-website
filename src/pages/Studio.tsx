import { defineConfig, Studio } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { homeHeroType } from '../sanity/schemaTypes/heroType';
import { calendarHeroType } from '../sanity/schemaTypes/calendarHeroType';
import { eventType } from '../sanity/schemaTypes/eventType';
import { postType } from '../sanity/schemaTypes/postType';
import { gameType } from '../sanity/schemaTypes/gameType';
import { gamesHeroType } from '../sanity/schemaTypes/gamesHeroType';

const appBase = import.meta.env.VITE_BASE ?? '/';
const basePrefix = appBase === '/' ? '' : appBase.replace(/\/$/, '');
const studioBasePath = `${basePrefix}/studio`;

const config = defineConfig({
  projectId: '85tc4tb0',
  dataset: 'production',
  basePath: studioBasePath,
  title: 'SBSK Studio',
  subtitle: 'production',
  plugins: [structureTool(), visionTool()],
  schema: {
    types: [homeHeroType, eventType, calendarHeroType, postType, gameType, gamesHeroType],
  },
});

export default function StudioRoute() {
  return (
    <div className="h-[calc(100vh-5.0625rem)] max-h-dvh overflow-auto antialiased">
      <Studio config={config} />
    </div>
  );
}
