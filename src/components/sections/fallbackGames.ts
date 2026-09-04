import wingspan from '../../assets/images/games/wingspan.webp';
import azul from '../../assets/images/games/azul.webp';
import catan from '../../assets/images/games/catan.webp';
import ticketToRide from '../../assets/images/games/ticket-to-ride.webp';
import codenames from '../../assets/images/games/codenames.webp';
import loveLetter from '../../assets/images/games/love-letter.webp';
import splendor from '../../assets/images/games/splendor.webp';
import root from '../../assets/images/games/root.webp';
import scythe from '../../assets/images/games/scythe.webp';
import terraformingMars from '../../assets/images/games/terraforming-mars.webp';
import cascadia from '../../assets/images/games/cascadia.webp';
import arkNova from '../../assets/images/games/ark-nova.webp';
import seti from '../../assets/images/games/seti.webp';
import skyTeam from '../../assets/images/games/sky-team.webp';
import calico from '../../assets/images/games/calico.webp';
import rebirth from '../../assets/images/games/rebirth.webp';
import huesAndCues from '../../assets/images/games/hues-and-cues.webp';

export interface FallbackGame {
  _id: string;
  title: string;
  genre: string;
  description: string;
  image: string;
  difficulty: 1 | 2 | 3;
  time: string;
  players: string;
  playersMin: number;
  playersMax: number;
  /** The game's BoardGameGeek page. Every game here has one. */
  bggUrl: string;
  /**
   * A rules walkthrough, Watch It Played's wherever one could be confirmed (#223). Optional
   * because not every game in the collection has one — `GameCard` simply renders no video
   * button when this is absent, so a gap costs nothing and can be filled from the Studio.
   */
  videoUrl?: string;
}

/**
 * The club's own collection, shown until the games are entered in the Studio. Same role as
 * `FALLBACK_HERO` in HomeHeroSection — real content wins the moment `games` from Sanity is
 * non-empty (see `OurGamesSection`).
 *
 * `bggUrl` is the canonical `/boardgame/<id>/<slug>` page; BGG redirects on the slug, so the id
 * is the part that has to be right. `videoUrl` is a Watch It Played walkthrough where one was
 * confirmed for that game — the channel teaches rules the same way every time, which is worth
 * more to someone learning a game than whichever video ranks highest that week.
 */
export const FALLBACK_GAMES: FallbackGame[] = [
  {
    _id: 'fallback-wingspan',
    title: 'Wingspan',
    genre: 'Strategi · Motorbygging',
    description: 'Lokk til deg flest mulig fugler til reservatene dine.',
    image: wingspan,
    difficulty: 2,
    time: '40–70',
    players: '1–5',
    playersMin: 1,
    playersMax: 5,
    bggUrl: 'https://boardgamegeek.com/boardgame/266192/wingspan',
    videoUrl: 'https://youtu.be/lgDgcLI2B0U',
  },
  {
    _id: 'fallback-azul',
    title: 'Azul',
    genre: 'Abstrakt · Flislegging',
    description: 'Legg vakre keramikkfliser – og unngå å kaste bort noen.',
    image: azul,
    difficulty: 1,
    time: '30–45',
    players: '2–4',
    playersMin: 2,
    playersMax: 4,
    bggUrl: 'https://boardgamegeek.com/boardgame/230802/azul',
    videoUrl: 'https://youtu.be/83a0BZg7JLg',
  },
  {
    _id: 'fallback-catan',
    title: 'Catan',
    genre: 'Familie · Handel og bygging',
    description: 'Bygg veier og byer, bytt ressurser og kolonisér øya.',
    image: catan,
    difficulty: 2,
    time: '60–90',
    players: '3–4',
    playersMin: 3,
    playersMax: 4,
    bggUrl: 'https://boardgamegeek.com/boardgame/13/catan',
  },
  {
    _id: 'fallback-ticket-to-ride',
    title: 'Ticket to Ride',
    genre: 'Familie · Ruteplanlegging',
    description: 'Krev jernbanestrekninger på tvers av kontinentet.',
    image: ticketToRide,
    difficulty: 1,
    time: '30–60',
    players: '2–5',
    playersMin: 2,
    playersMax: 5,
    bggUrl: 'https://boardgamegeek.com/boardgame/9209/ticket-to-ride',
  },
  {
    _id: 'fallback-codenames',
    title: 'Codenames',
    genre: 'Party · Ordspill',
    description: 'To lag kappes om å finne sine agenter med ett hint.',
    image: codenames,
    difficulty: 1,
    time: '15–30',
    players: '2–8',
    playersMin: 2,
    playersMax: 8,
    bggUrl: 'https://boardgamegeek.com/boardgame/178900/codenames',
  },
  {
    _id: 'fallback-love-letter',
    title: 'Love Letter',
    genre: 'Party · Bløffspill',
    description: 'Vinn prinsessens gunst i en rask duell med bare 16 kort.',
    image: loveLetter,
    difficulty: 1,
    time: '15–20',
    players: '2–4',
    playersMin: 2,
    playersMax: 4,
    bggUrl: 'https://boardgamegeek.com/boardgame/129622/love-letter',
  },
  {
    _id: 'fallback-splendor',
    title: 'Splendor',
    genre: 'Strategi · Ressursbygging',
    description: 'Invester i gruver og håndverkere og bygg et handelsimperium.',
    image: splendor,
    difficulty: 1,
    time: '30',
    players: '2–4',
    playersMin: 2,
    playersMax: 4,
    bggUrl: 'https://boardgamegeek.com/boardgame/148228/splendor',
  },
  {
    _id: 'fallback-root',
    title: 'Root',
    genre: 'Strategi · Asymmetrisk krigføring',
    description: 'Fire svært ulike fraksjoner kjemper om kontrollen over skogen.',
    image: root,
    difficulty: 3,
    time: '60–90',
    players: '2–4',
    playersMin: 2,
    playersMax: 4,
    bggUrl: 'https://boardgamegeek.com/boardgame/237182/root',
  },
  {
    _id: 'fallback-scythe',
    title: 'Scythe',
    genre: 'Strategi · Områdekontroll',
    description: 'Bygg opp en alternativ 1920-talls-nasjon i kjølvannet av krigen.',
    image: scythe,
    difficulty: 3,
    time: '90–115',
    players: '1–5',
    playersMin: 1,
    playersMax: 5,
    bggUrl: 'https://boardgamegeek.com/boardgame/169786/scythe',
    videoUrl: 'https://youtu.be/ffMLIL5qGQg',
  },
  {
    _id: 'fallback-terraforming-mars',
    title: 'Terraforming Mars',
    genre: 'Strategi · Motorbygging',
    description: 'Kappløp om å gjøre Mars beboelig for mennesker.',
    image: terraformingMars,
    difficulty: 3,
    time: '90–120',
    players: '1–5',
    playersMin: 1,
    playersMax: 5,
    bggUrl: 'https://boardgamegeek.com/boardgame/167791/terraforming-mars',
    videoUrl: 'https://youtu.be/n3yVpsiVwL8',
  },
  {
    _id: 'fallback-cascadia',
    title: 'Cascadia',
    genre: 'Strategi · Flislegging',
    description: 'Bygg det vakreste habitatet for dyrene i Stillehavets nordvest.',
    image: cascadia,
    difficulty: 2,
    time: '30–45',
    players: '1–4',
    playersMin: 1,
    playersMax: 4,
    bggUrl: 'https://boardgamegeek.com/boardgame/295947/cascadia',
  },
  {
    _id: 'fallback-ark-nova',
    title: 'Ark Nova',
    genre: 'Strategi · Dyrehagebygging',
    description: 'Planlegg og driv en moderne, vitenskapsbasert dyrehage.',
    image: arkNova,
    difficulty: 3,
    time: '90–150',
    players: '1–4',
    playersMin: 1,
    playersMax: 4,
    bggUrl: 'https://boardgamegeek.com/boardgame/342942/ark-nova',
    videoUrl: 'https://youtu.be/EvjY7lWoycM',
  },
  {
    _id: 'fallback-seti',
    title: 'SETI: Search for Extraterrestrial Intelligence',
    genre: 'Strategi · Utforskning',
    description: 'Led søket etter tegn på liv utenfor jorden.',
    image: seti,
    difficulty: 3,
    time: '80–140',
    players: '1–4',
    playersMin: 1,
    playersMax: 4,
    bggUrl:
      'https://boardgamegeek.com/boardgame/418059/seti-search-for-extraterrestrial-intelligence',
  },
  {
    _id: 'fallback-sky-team',
    title: 'Sky Team',
    genre: 'Samarbeid · To spillere',
    description: 'Land flyet sammen som pilot og styrmann – uten å snakke om terningene.',
    image: skyTeam,
    difficulty: 2,
    time: '15–20',
    players: '2',
    playersMin: 2,
    playersMax: 2,
    bggUrl: 'https://boardgamegeek.com/boardgame/373106/sky-team',
  },
  {
    _id: 'fallback-calico',
    title: 'Calico',
    genre: 'Strategi · Flislegging',
    description: 'Sy sammen det peneste lappeteppet og lokk til deg katter.',
    image: calico,
    difficulty: 2,
    time: '30–45',
    players: '1–4',
    playersMin: 1,
    playersMax: 4,
    bggUrl: 'https://boardgamegeek.com/boardgame/283155/calico',
  },
  {
    _id: 'fallback-rebirth',
    title: 'Rebirth',
    genre: 'Strategi · Sivilisasjonsbygging',
    description: 'Gjenreis verden flis for flis etter at den gikk under.',
    image: rebirth,
    difficulty: 2,
    time: '45–90',
    players: '1–4',
    playersMin: 1,
    playersMax: 4,
    bggUrl: 'https://boardgamegeek.com/boardgame/417197/rebirth',
  },
  {
    _id: 'fallback-hues-and-cues',
    title: 'Hues and Cues',
    genre: 'Party · Gjettelek',
    description: 'Gi et ett-ords hint og se hvor godt de andre finner fargen din.',
    image: huesAndCues,
    difficulty: 1,
    time: '20–30',
    players: '3–10',
    playersMin: 3,
    playersMax: 10,
    bggUrl: 'https://boardgamegeek.com/boardgame/302520/hues-and-cues',
  },
];
