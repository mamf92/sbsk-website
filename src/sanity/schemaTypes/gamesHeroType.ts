import { defineType } from 'sanity';
import { heroLinksField } from './heroLinksField';
import { pageImageField, pageSubtitleField, pageTitleField } from './pageTopFields';

// No photo credit field: the Våre spill page does not show one.
export const gamesHeroType = defineType({
  name: 'gamesHero',
  title: 'Toppen av Våre spill',
  type: 'document',
  fields: [pageTitleField('Våre spill'), pageSubtitleField(200), pageImageField, heroLinksField],
  preview: { prepare: () => ({ title: 'Toppen av Våre spill' }) },
});
