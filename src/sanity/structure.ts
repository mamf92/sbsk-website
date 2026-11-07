import type { DocumentActionComponent, NewDocumentOptionsResolver } from 'sanity';
import type { StructureResolver } from 'sanity/structure';

/**
 * The page-specific documents. Each page reads exactly one, so the Studio opens that one by a
 * fixed id instead of listing documents an editor could duplicate by accident. The query helpers
 * look this id up first (see `home-hero.ts` and its siblings).
 */
export const singletons = [
  { type: 'homeHero', title: 'Forsiden' },
  { type: 'calendarHero', title: 'Kalender' },
  { type: 'gamesHero', title: 'Våre spill' },
] as const;

const aboutPage = { type: 'aboutPage', title: 'Om oss' } as const;

const singletonTypes = new Set<string>([...singletons.map((s) => s.type), aboutPage.type]);

/** The left-hand menu in the Studio, in the order an editor thinks about the site. */
export const structure: StructureResolver = (S) => {
  const singletonItem = ({ type, title }: { type: string; title: string }) =>
    S.listItem()
      .title(title)
      .id(type)
      .child(S.document().schemaType(type).documentId(type).title(title));

  return S.list()
    .title('Innhold')
    .items([
      S.documentTypeListItem('post').title('Innlegg'),
      S.documentTypeListItem('event').title('Arrangementer'),
      S.documentTypeListItem('game').title('Spill'),
      S.documentTypeListItem('boardMember').title('Styremedlemmer'),
      S.divider(),
      S.listItem()
        .title('Toppen av sidene')
        .id('pageTops')
        .child(S.list().title('Toppen av sidene').items(singletons.map(singletonItem))),
      singletonItem(aboutPage),
    ]);
};

/** Keeps the page documents out of the "Create" menu: each one already has its place above. */
export const newDocumentOptions: NewDocumentOptionsResolver = (prev, { creationContext }) =>
  creationContext.type === 'global'
    ? prev.filter((template) => !singletonTypes.has(template.templateId))
    : prev;

/** A page document can be edited and published, but not duplicated or deleted. */
export function documentActions(
  prev: DocumentActionComponent[],
  { schemaType }: { schemaType: string },
): DocumentActionComponent[] {
  if (!singletonTypes.has(schemaType)) return prev;
  return prev.filter(
    ({ action }) => action !== 'duplicate' && action !== 'delete' && action !== 'unpublish',
  );
}
