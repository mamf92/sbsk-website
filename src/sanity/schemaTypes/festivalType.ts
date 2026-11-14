import { defineArrayMember, defineField, defineType } from 'sanity';
import { isUniqueAcrossEvents } from './slugAcrossEvents';
import { CLUB_EMAIL } from '../../utils/contact';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const HHMM_ERROR = 'Skriv klokkeslettet som TT:MM, f.eks. 10:00.';

export const SESSION_FORMATS = [
  { title: 'Turnering', value: 'turnering' },
  { title: 'Finale', value: 'finale' },
  { title: 'Lær å spille', value: 'laer-a-spille' },
  { title: 'Fri spilling', value: 'fri-spilling' },
  { title: 'Demo', value: 'demo' },
  { title: 'Pause', value: 'pause' },
  { title: 'Annet', value: 'annet' },
] as const;

const LEVELS = [
  { title: 'Nybegynnere', value: 'nybegynner' },
  { title: 'Alle', value: 'alle' },
  { title: 'Erfarne', value: 'erfaren' },
] as const;

const STABLE_KEYS =
  'Når påmeldingen har åpnet: ikke slett og lag på nytt – endre heller det som står, så påmeldingene fortsatt peker riktig.';

type LocaleValue = { nb?: string } | undefined;
type SessionValue = {
  start?: string;
  end?: string;
  title?: LocaleValue;
  format?: string;
  gameName?: string;
};
type DayValue = { date?: string; label?: LocaleValue; sessions?: unknown[] };

const formatTitle = (value?: string) =>
  SESSION_FORMATS.find((format) => format.value === value)?.title;

/** One item in a day's programme («Programpost»). */
export const festivalSessionType = defineType({
  name: 'festivalSession',
  title: 'Programpost',
  type: 'object',
  fields: [
    defineField({
      name: 'start',
      title: 'Starter',
      type: 'string',
      description: 'Klokkeslett som TT:MM. Datoen er dagen posten ligger under.',
      validation: (rule) => rule.required().regex(HHMM, { name: 'klokkeslett' }).error(HHMM_ERROR),
    }),
    defineField({
      name: 'end',
      title: 'Slutter',
      type: 'string',
      description: 'Klokkeslett som TT:MM. Et klokkeslett før starten betyr etter midnatt.',
      // Two rules, not one chain: `.error()` would replace the custom check's own message.
      validation: (rule) => [
        rule.required().regex(HHMM, { name: 'klokkeslett' }).error(HHMM_ERROR),
        rule.custom((end, context) => {
          const start = (context.parent as SessionValue | undefined)?.start;
          return end && end === start ? 'Kan ikke slutte samme minutt som den starter.' : true;
        }),
      ],
    }),
    defineField({
      name: 'title',
      title: 'Tittel',
      type: 'localeString',
      description: 'F.eks. «Innledende runder: Catan».',
      validation: (rule) =>
        rule.custom((value) =>
          (value as LocaleValue)?.nb?.trim() ? true : 'Skriv en norsk tittel.',
        ),
    }),
    defineField({
      name: 'format',
      title: 'Type',
      type: 'string',
      description: 'Bestemmer fargen på merkelappen og hvilke filtre besøkende kan velge.',
      options: { list: [...SESSION_FORMATS], layout: 'radio' },
      validation: (rule) => rule.required().error('Velg hva slags programpost dette er.'),
    }),
    defineField({
      name: 'game',
      title: 'Spill',
      type: 'reference',
      to: [{ type: 'game' }],
      description: 'Valgfritt. Velg et spill fra «Våre spill» for å vise bilde og antall spillere.',
    }),
    defineField({
      name: 'gameName',
      title: 'Spillets navn',
      type: 'string',
      description: 'Bruk dette hvis spillet ikke finnes under «Våre spill».',
      hidden: ({ parent }) => !!(parent as { game?: unknown } | undefined)?.game,
    }),
    defineField({
      name: 'room',
      title: 'Rom eller bord',
      type: 'string',
      description: 'F.eks. «Sal 2, bord 1–8». Valgfritt.',
    }),
    defineField({
      name: 'seats',
      title: 'Antall plasser',
      type: 'number',
      validation: (rule) => rule.integer().min(1),
    }),
    defineField({
      name: 'level',
      title: 'Passer for',
      type: 'string',
      options: { list: [...LEVELS], layout: 'radio' },
    }),
    defineField({
      name: 'description',
      title: 'Beskrivelse',
      type: 'localeText',
      description: 'Kort, helst én eller to setninger.',
      validation: (rule) =>
        rule.custom((value) => {
          const v = value as { nb?: string; en?: string } | undefined;
          const tooLong = [v?.nb, v?.en].some((text) => (text?.length ?? 0) > 300);
          return tooLong ? 'Hold beskrivelsen under 300 tegn.' : true;
        }),
    }),
    defineField({
      name: 'signup',
      title: 'Egen påmelding',
      type: 'signup',
      description: 'Bare hvis denne posten har en egen påmelding, f.eks. en turnering.',
    }),
    defineField({
      name: 'sponsor',
      title: 'Presentert av',
      type: 'string',
      description:
        'Valgfritt. Skriv navnet på en av sponsorene til arrangementet, nøyaktig slik det står under «Sponsorer».',
      validation: (rule) =>
        rule.custom((name, context) => {
          if (!name) return true;
          const sponsors = (context.document?.sponsors as { altText?: string }[] | undefined) ?? [];
          const names = sponsors.map((sponsor) => sponsor.altText).filter(Boolean);
          return names.includes(name as string)
            ? true
            : names.length
              ? `Finner ikke sponsoren. Velg en av: ${names.join(', ')}.`
              : 'Legg til sponsoren under «Sponsorer» først.';
        }),
    }),
  ],
  preview: {
    select: {
      start: 'start',
      end: 'end',
      title: 'title.nb',
      gameTitle: 'game.title',
      gameName: 'gameName',
      format: 'format',
    },
    prepare: ({ start, end, title, gameTitle, gameName, format }: Record<string, string>) => ({
      title: `${start ?? '??'}–${end ?? '??'} · ${title ?? gameTitle ?? gameName ?? 'Uten tittel'}`,
      subtitle: formatTitle(format),
    }),
  },
});

/** One day of a festival («Dag»). */
export const festivalDayType = defineType({
  name: 'festivalDay',
  title: 'Dag',
  type: 'object',
  fields: [
    defineField({
      name: 'date',
      title: 'Dato',
      type: 'date',
      validation: (rule) => rule.required().error('Velg datoen.'),
    }),
    defineField({
      name: 'label',
      title: 'Navn på dagen',
      type: 'localeString',
      description:
        'Valgfritt, f.eks. «Fredag – oppvarming». Tomt gir ukedag og dato, f.eks. «fredag 29. januar».',
    }),
    defineField({
      name: 'opens',
      title: 'Dørene åpner',
      type: 'string',
      description: 'Klokkeslett som TT:MM. Kan stå tomt til dere vet det.',
      // Optional: a festival is announced before its hours are set. The page then shows the
      // day without opening hours, and the calendar row covers the whole day.
      validation: (rule) => rule.regex(HHMM, { name: 'klokkeslett' }).error(HHMM_ERROR),
    }),
    defineField({
      name: 'closes',
      title: 'Vi stenger',
      type: 'string',
      description:
        'Klokkeslett som TT:MM. Et klokkeslett før åpning betyr etter midnatt. Kan stå tomt til dere vet det.',
      validation: (rule) => [
        rule.regex(HHMM, { name: 'klokkeslett' }).error(HHMM_ERROR),
        // Hours are shown only as a pair, so one without the other would silently vanish.
        rule.custom(
          (closes, context) =>
            dayHoursProblem(
              (context.parent as { opens?: string } | undefined)?.opens,
              closes as string | undefined,
            ) ?? true,
        ),
      ],
    }),
    defineField({
      name: 'summary',
      title: 'Kort om dagen',
      type: 'localeText',
      description: 'Vises på kortet for dagen. Valgfritt.',
    }),
    defineField({
      name: 'venue',
      title: 'Annet oppmøtested denne dagen',
      type: 'venue',
      description: 'Bare hvis dagen er et annet sted enn resten av arrangementet.',
      options: { collapsible: true, collapsed: true },
    }),
    defineField({
      name: 'signup',
      title: 'Påmelding for denne dagen',
      type: 'signup',
      description: 'Bare hvis man melder seg på hver dag for seg.',
      options: { collapsible: true, collapsed: true },
    }),
    defineField({
      name: 'sessions',
      title: 'Programmet',
      type: 'array',
      description: `Alt som skjer denne dagen. Rekkefølgen her spiller ingen rolle – siden sorterer etter klokkeslett. ${STABLE_KEYS}`,
      of: [defineArrayMember({ type: 'festivalSession' })],
    }),
  ],
  preview: {
    select: { date: 'date', label: 'label.nb', sessions: 'sessions' },
    prepare: ({
      date,
      label,
      sessions,
    }: {
      date?: string;
      label?: string;
      sessions?: unknown[];
    }) => {
      const day = date
        ? new Date(`${date}T12:00:00Z`).toLocaleDateString('nb-NO', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            timeZone: 'Europe/Oslo',
          })
        : 'Uten dato';
      const count = sessions?.length ?? 0;
      return {
        title: label ? `${day} – ${label}` : day,
        subtitle: `${count} programpost${count === 1 ? '' : 'er'}`,
      };
    },
  },
});

/** A festival over several days with its own programme: «Storarrangement», e.g. BGM. */
export const festivalType = defineType({
  name: 'festival',
  title: 'Storarrangement',
  type: 'document',
  description:
    'Arrangementer over flere dager med eget program, som Board Game Masters. Får sin egen side under /arrangementer når det er publisert, og den nyeste Board Game Masters vises på /board-game-masters.',
  groups: [
    { name: 'basics', title: 'Grunninfo', default: true },
    { name: 'program', title: 'Program' },
    { name: 'signup', title: 'Påmelding og priser' },
    { name: 'venue', title: 'Oppmøte' },
    { name: 'sponsors', title: 'Sponsorer' },
    { name: 'texts', title: 'Bilder og tekst' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Navn',
      type: 'localeString',
      group: 'basics',
      description: 'F.eks. «Stavanger Board Game Masters XIX».',
      validation: (rule) =>
        rule.custom((value) =>
          (value as LocaleValue)?.nb?.trim() ? true : 'Skriv et norsk navn.',
        ),
    }),
    defineField({
      name: 'series',
      title: 'Hvilken serie?',
      type: 'string',
      group: 'basics',
      description:
        'Board Game Masters vises på /board-game-masters: den neste som kommer, ellers den siste.',
      options: {
        list: [
          { title: 'Board Game Masters', value: 'bgm' },
          { title: 'Annet', value: 'annet' },
        ],
        layout: 'radio',
      },
      initialValue: 'bgm',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'edition',
      title: 'Utgave',
      type: 'string',
      group: 'basics',
      description: 'Valgfritt, f.eks. «XIX» eller «2027». Vises som en merkelapp.',
    }),
    defineField({
      name: 'slug',
      title: 'Nettadresse',
      type: 'slug',
      group: 'basics',
      description: 'Siste del av adressen: /arrangementer/<dette>. Trykk «Generer».',
      options: { source: 'title.nb', isUnique: isUniqueAcrossEvents },
      validation: (rule) => rule.required().error('Lag en nettadresse.'),
    }),
    defineField({
      name: 'tagline',
      title: 'Kort om arrangementet',
      type: 'localeText',
      group: 'basics',
      description: 'Én eller to setninger under navnet, og i kalenderen.',
      validation: (rule) =>
        rule.custom((value) => {
          const v = value as { nb?: string; en?: string } | undefined;
          return [v?.nb, v?.en].some((text) => (text?.length ?? 0) > 160)
            ? 'Hold den under 160 tegn.'
            : true;
        }),
    }),
    defineField({
      name: 'heroImage',
      title: 'Toppbilde',
      type: 'image',
      group: 'basics',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Hva viser bildet?',
          type: 'string',
          description: 'Leses opp for skjermlesere. Tomt hvis bildet bare er pynt.',
        }),
      ],
    }),
    defineField({
      name: 'days',
      title: 'Dagene',
      type: 'array',
      group: 'program',
      description: `Én rad per dag, i rekkefølge. ${STABLE_KEYS}`,
      of: [defineArrayMember({ type: 'festivalDay' })],
      // Separate rules so each keeps its own message; `.error()` applies to a whole chain.
      validation: (rule) => [
        rule.required().min(1).error('Legg til minst én dag.'),
        rule.max(7).error('Høyst sju dager.'),
        rule.custom((days) => {
          const dates = ((days as DayValue[] | undefined) ?? [])
            .map((day) => day.date)
            .filter((date): date is string => !!date);
          for (let i = 1; i < dates.length; i++) {
            if (dates[i] <= dates[i - 1])
              return 'Dagene må komme i rekkefølge, og samme dato kan ikke stå to ganger.';
          }
          return true;
        }),
      ],
    }),
    defineField({
      name: 'signup',
      title: 'Påmelding for hele arrangementet',
      type: 'signup',
      group: 'signup',
      description: 'Valgfritt. Dager og programposter kan ha sin egen påmelding i tillegg.',
    }),
    defineField({
      name: 'pricing',
      title: 'Priser',
      type: 'localeBlock',
      group: 'signup',
    }),
    defineField({
      name: 'venue',
      title: 'Oppmøte',
      type: 'venue',
      group: 'venue',
      description: 'Gjelder alle dagene, med mindre en dag har sitt eget oppmøtested.',
    }),
    defineField({
      name: 'sponsors',
      title: 'Sponsorer',
      type: 'array',
      group: 'sponsors',
      of: [defineArrayMember({ type: 'sponsor' })],
    }),
    defineField({
      name: 'intro',
      title: 'Om arrangementet',
      type: 'localeBlock',
      group: 'texts',
    }),
    defineField({
      name: 'rules',
      title: 'Regler og praktisk',
      type: 'localeBlock',
      group: 'texts',
      description: 'F.eks. turneringsregler og hva man bør ta med.',
    }),
    defineField({
      name: 'faq',
      title: 'Spørsmål og svar',
      type: 'array',
      group: 'texts',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqItem',
          title: 'Spørsmål',
          fields: [
            defineField({ name: 'question', title: 'Spørsmål', type: 'localeString' }),
            defineField({ name: 'answer', title: 'Svar', type: 'localeBlock' }),
          ],
          preview: { select: { title: 'question.nb' } },
        }),
      ],
    }),
    defineField({
      name: 'contactEmail',
      title: 'E-post for spørsmål',
      type: 'string',
      group: 'texts',
      description: 'Klubbens e-post. Ikke skriv en privat adresse – alt på siden er offentlig.',
      initialValue: CLUB_EMAIL,
      validation: (rule) => rule.email().error('Skriv en gyldig e-postadresse.'),
    }),
    defineField({
      name: 'gallery',
      title: 'Bilder fra tidligere år',
      type: 'array',
      group: 'texts',
      description: 'Valgfritt, opptil 12. Bare bilder der de som er med har sagt ja.',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [defineField({ name: 'alt', title: 'Hva viser bildet?', type: 'string' })],
        }),
      ],
      validation: (rule) => rule.max(12),
    }),
  ],
  orderings: [
    {
      title: 'Første dag, nyeste først',
      name: 'firstDayDesc',
      by: [{ field: 'days[0].date', direction: 'desc' }],
    },
  ],
  preview: {
    select: { title: 'title.nb', edition: 'edition', first: 'days.0.date', media: 'heroImage' },
    prepare: ({ title, edition, first, media }: Record<string, unknown>) => ({
      title: [title, edition].filter(Boolean).join(' · ') || 'Uten navn',
      subtitle: (first as string | undefined) ?? 'Ingen dager ennå',
      media: media as never,
    }),
  },
});

/**
 * What is wrong with a day's opening hours, if anything. They are shown only as a pair, so one
 * without the other would silently vanish; and the same minute twice would read as 24 hours.
 */
export function dayHoursProblem(opens?: string, closes?: string): string | null {
  if (!opens !== !closes)
    return 'Fyll inn både når dørene åpner og når dere stenger, eller ingen av dem.';
  if (opens && opens === closes) return 'Kan ikke stenge samme minutt som dørene åpner.';
  return null;
}

export const festivalTypes = [festivalSessionType, festivalDayType, festivalType];
