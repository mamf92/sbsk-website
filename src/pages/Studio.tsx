import { defineConfig, Studio } from 'sanity';
import { structureTool } from 'sanity/structure';
import { postType } from '../sanity/schemaTypes/postType';
import { visionTool } from '@sanity/vision';
import { eventType } from '../sanity/schemaTypes/eventType';

const config = defineConfig({
  projectId: '85tc4tb0',
  dataset: 'production',
  basePath: '/studio',
  plugins: [structureTool(), visionTool()],
  schema: {
    types: [postType, eventType],
  },
});

export default function StudioRoute() {
  return (
    <div className="h-[calc(100vh-5.0625rem)] max-h-dvh overflow-auto antialiased">
      <Studio config={config} />
    </div>
  );
}
