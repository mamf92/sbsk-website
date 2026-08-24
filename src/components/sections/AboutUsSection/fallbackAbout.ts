import aboutPlaceholderImage from '../../../assets/images/about-placeholder.jpg';

export interface FallbackBoardMember {
  _id: string;
  name: string;
  role?: string;
  bio: string;
  imageUrl?: string;
}

/**
 * Shown until the Studio has an `aboutPage` document. Same role as `FALLBACK_HERO` in
 * `HomeHeroSection` — real content wins the moment `aboutPage` from Sanity is non-null.
 */
export const FALLBACK_ABOUT = {
  imageUrl: aboutPlaceholderImage,
  clubTitle: 'Om klubben',
  clubIntro:
    'Velkommen til Stavanger Brettspillklubb, et fellesskap for brettspillentusiaster i alle ' +
    'aldre! Vi er en lidenskapelig gjeng som møtes regelmessig for å utforske nye verdener, ' +
    'utfordre våre strategiske ferdigheter og dele gleden ved brettspill.',
  clubBody: [
    'Lorem ipsum dolor sit amet consectetur. Odio dictumst vitae at ullamcorper viverra ' +
      'vivamus et maecenas. Metus commodo mi dui mi vitae viverra ornare. Adipiscing praesent ' +
      'pulvinar in aliquet sed. Rutrum ac sapien eget mauris ullamcorper. Suspendisse nisl ' +
      'interdum orci semper hendrerit risus aenean mi facilisis. Viverra eget lectus in urna ' +
      'egestas. Iaculis hac dolor in condimentum fames adipiscing ut quis. Lectus egestas ' +
      'pulvinar ac habitant magna arcu. In bibendum proin vulputate morbi et viverra eget nisl.',
    'Tellus mauris cursus volutpat commodo bibendum praesent nisl sollicitudin. Et adipiscing ' +
      'consectetur purus sed. Sit at tempor id leo non. Venenatis nam aliquam vel sit sem. Et ' +
      'iaculis tincidunt sit nulla aliquet morbi lobortis vestibulum eu. Bibendum odio ' +
      'vestibulum amet ut. At blandit eget erat pellentesque urna leo in turpis urna. Mauris ' +
      'lacus odio condimentum quisque. Ut eu mattis cras auctor justo metus non.',
  ],
  boardTitle: 'Om styret',
  boardIntro:
    'Styret i Stavanger Brettspillklubb er en engasjert gruppe frivillige som brenner for ' +
    'brettspill. De jobber hardt for å skape et inkluderende og aktivt fellesskap for alle ' +
    'brettspillentusiaster i regionen.',
};

/** The club's own board, shown until members are entered in the Studio. No portraits — a
 * member with no `image` renders initials, and the fallback set never claims a stock photo. */
export const FALLBACK_BOARD: FallbackBoardMember[] = [
  {
    _id: 'fallback-astrid-lindgren',
    name: 'Astrid Lindgren',
    role: 'Leder',
    bio: 'Lidenskapelig brettspiller med sans for strategi. Har vært med i klubben siden starten.',
  },
  {
    _id: 'fallback-knut-hamsun',
    name: 'Knut Hamsun',
    role: 'Nestleder',
    bio: 'Elsker å utforske nye verdener gjennom spill. Alltid klar for en spennende spillkveld.',
  },
  {
    _id: 'fallback-selma-lagerlof',
    name: 'Selma Lagerlöf',
    role: 'Kasserer',
    bio: 'Holder styr på regnskapet og på reglene når diskusjonen om en tvilsom trekk blusser opp.',
  },
  {
    _id: 'fallback-jens-peter-kristiansen',
    name: 'Jens Peter Kristiansen',
    bio:
      'Ble med i styret fordi han ønsket å bidra til å skape et enda bedre tilbud for ' +
      'brettspillinteresserte i regionen.',
  },
  {
    _id: 'fallback-vanessa-johansson',
    name: 'Vanessa Johansson',
    bio: 'Brettspillentusiast med sans for strategi. Elsker å utforske nye verdener gjennom spill.',
  },
  {
    _id: 'fallback-ibrahim-davidovich',
    name: 'Ibrahim Davidovich',
    bio:
      'Ble med i styret fordi han ønsket å bidra til å skape et enda bedre tilbud for ' +
      'brettspillinteresserte i regionen.',
  },
];
