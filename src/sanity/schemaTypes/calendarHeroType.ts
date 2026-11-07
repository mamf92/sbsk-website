import { defineType } from 'sanity';
import { pageImageField, pageSubtitleField, pageTitleField } from './pageTopFields';
import { imageCreditField } from './sharedFields';

export const calendarHeroType = defineType({
  name: 'calendarHero',
  title: 'Toppen av kalenderen',
  type: 'document',
  fields: [pageTitleField('Kalender'), pageSubtitleField(100), pageImageField, imageCreditField],
  preview: { prepare: () => ({ title: 'Toppen av kalenderen' }) },
});
