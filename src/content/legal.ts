import { CURRENT_LEGAL_VERSION } from '../utils/legal';
import { CLUB_EMAIL } from '../utils/contact';

/**
 * The privacy policy (`/personvern`) and the terms (`/vilkår`), docs/plans/gdpr.md.
 *
 * Shaped for translation: each document is keyed by locale, and `en` is optional until the
 * English text is written. Pages fall back to `nb` (rendered with `lang="nb"`). The text must
 * say exactly what the data inventory in docs/plans/gdpr.md says; a PR that adds personal data
 * updates both.
 */
export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  list?: string[];
}

export interface LegalDocument {
  version: string;
  title: string;
  intro: string;
  sections: LegalSection[];
}

export type Localised<T> = { nb: T; en?: T };

export const PRIVACY_POLICY: Localised<LegalDocument> = {
  nb: {
    version: CURRENT_LEGAL_VERSION,
    title: 'Personvernerklæring',
    intro:
      'Her står hvilke opplysninger Stavanger Brettspillklubb lagrer om deg, hvorfor vi gjør det, og hvordan du bestemmer over dem.',
    sections: [
      {
        heading: 'Hvem er ansvarlig?',
        paragraphs: [
          `Stavanger Brettspillklubb er ansvarlig for opplysningene. Styret har ansvaret samlet. Skriv til ${CLUB_EMAIL} hvis du har spørsmål om personvern.`,
        ],
      },
      {
        heading: 'Hva lagrer vi, og hvorfor?',
        list: [
          'Medlemsregisteret: navn, e-post, telefon (valgfritt), fødselsår (valgfritt), når du ble medlem og om medlemskapet er aktivt. Vi trenger dette fordi du er medlem.',
          'Innlogging: e-post, passord (kryptert) og når du sist logget inn. Styret har i tillegg tofaktorinnlogging.',
          'Profilen din: visningsnavn, bilde, kort tekst om deg og språkvalg. Bilde og tekst er frivillig.',
          'Påmeldinger til arrangementer, slik at andre medlemmer ser hvem som kommer.',
          'Innsjekking ved døren og merker du har fått. Vi bruker dette til statistikk, til søknader om tilskudd og til merkene på Min side.',
          'Betalinger av medlemskontingent. Regnskapsloven krever at vi tar vare på dem.',
          'Søknader om medlemskap og meldinger du sender oss, slik at vi kan svare.',
        ],
      },
      {
        heading: 'Hvor lagres det?',
        paragraphs: [
          'Medlemsdata lagres hos Supabase i EU (Frankfurt). Nettsidens innhold ligger hos Sanity og inneholder ingen medlemsdata. Nettsiden ligger hos GitHub Pages, som ser IP-adressen din når du besøker siden.',
          'Vi lagrer ikke medlemsdata utenfor EU/EØS.',
        ],
      },
      {
        heading: 'Hvem ser hva?',
        list: [
          'Andre medlemmer ser navn, bilde og tekst om deg, og hvilke arrangementer du er påmeldt. Du kan skjule deg fra deltakerlistene i innstillingene.',
          'Styret ser medlemsregisteret, betalinger og innsjekkinger.',
          'Ingen utenfor klubben ser opplysningene dine. Vi selger ingenting, viser ingen reklame og bruker ingen sporing eller analyseverktøy.',
        ],
      },
      {
        heading: 'Hvor lenge tar vi vare på det?',
        list: [
          'Profil, påmeldinger, merker og innlogging: til du sletter kontoen.',
          'Medlemsregisteret: til 24 måneder etter at medlemskapet er avsluttet.',
          'Betalinger: 5 år etter utgangen av regnskapsåret.',
          'Søknader: 30 dager etter godkjenning, 90 dager etter avslag.',
          'Meldinger til klubben: 12 måneder.',
          'Sikkerhetskopier: slettede data forsvinner fra dem innen 12 uker.',
        ],
      },
      {
        heading: 'Dine rettigheter',
        paragraphs: [
          'Du kan se, rette, laste ned og slette opplysningene dine. Det meste gjør du selv på Min side, under Innstillinger. Du kan også skrive til oss, og vi svarer innen én måned.',
          'Når du sletter kontoen, sletter vi alt om deg. Unntaket er betalinger, som vi må beholde i 5 år. De kobles fra kontoen din og viser bare navn, beløp og dato. Innsjekkingene dine blir et anonymt tall i statistikken.',
          'Du kan klage til Datatilsynet (datatilsynet.no) hvis du mener vi behandler opplysningene dine feil.',
        ],
      },
      {
        heading: 'Barn',
        paragraphs: [
          'Du må være 13 år eller eldre for å lage din egen konto. Yngre medlemmer står i medlemsregisteret uten konto, og en forelder eller foresatt tar kontakt med klubben for dem.',
        ],
      },
      {
        heading: 'Lagring i nettleseren',
        paragraphs: [
          'Nettsiden lagrer innloggingen din og valgene dine for tema, bevegelse og språk i nettleseren. Dette er nødvendig for at siden skal virke, så vi trenger ikke å spørre om informasjonskapsler.',
        ],
      },
      {
        heading: 'Sikkerhet',
        paragraphs: [
          'Data krypteres når de sendes og når de lagres. Bare styret har tilgang til medlemsregisteret, og styret må bruke tofaktorinnlogging.',
        ],
      },
      {
        heading: 'Endringer',
        paragraphs: [
          'Vi gir hver versjon et nummer. Ved viktige endringer ber vi deg godta den nye versjonen neste gang du logger inn.',
        ],
      },
    ],
  },
};

export const TERMS: Localised<LegalDocument> = {
  nb: {
    version: CURRENT_LEGAL_VERSION,
    title: 'Vilkår for medlemmer',
    intro: 'Disse vilkårene gjelder medlemskapet ditt og kontoen din på nettsiden.',
    sections: [
      {
        heading: 'Medlemskap',
        list: [
          'Et medlemskap gjelder for ett kalenderår.',
          'Årsmøtet bestemmer kontingenten.',
          'Medlemskapet gjelder når kontingenten er betalt.',
          'Vi betaler ikke tilbake kontingenten etter at sesongen har begynt.',
        ],
      },
      {
        heading: 'Kontoen din',
        list: [
          'Én konto er for én person.',
          'Hold passord og engangskoder for deg selv.',
          'Styret kan deaktivere en konto som bryter vilkårene eller klubbens regler.',
        ],
      },
      {
        heading: 'Oppførsel',
        paragraphs: [
          'Vær vennlig og inkluderende. Trakassering eller juks kan føre til at kontoen deaktiveres og at du blir utestengt etter klubbens vedtekter.',
        ],
      },
      {
        heading: 'Bilder og tekst du legger ut',
        paragraphs: [
          'Du må ha rett til å bruke bildet du laster opp. Ikke legg ut støtende innhold. Styret kan fjerne innhold som bryter dette.',
        ],
      },
      {
        heading: 'Arrangementer',
        paragraphs: [
          'Meld deg av hvis du ikke kan komme. Arrangementer med betaling har egne vilkår for refusjon, som du ser når du melder deg på.',
        ],
      },
      {
        heading: 'Ansvar',
        paragraphs: [
          'Klubben drives av frivillige. Vi gjør vårt beste for at nettsiden virker, men kan ikke love at den alltid er tilgjengelig. Ta godt vare på klubbens spill når du låner dem.',
        ],
      },
      {
        heading: 'Endringer og kontakt',
        paragraphs: [
          `Vi kan endre vilkårene. Ved viktige endringer ber vi deg godta dem på nytt. Spørsmål sender du til ${CLUB_EMAIL}. Norsk lov gjelder.`,
        ],
      },
    ],
  },
};
