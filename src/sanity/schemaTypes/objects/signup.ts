import { defineField, defineType } from 'sanity';

export const SIGNUP_METHODS = [
  { title: 'Påmelding i Spond', value: 'spond' },
  { title: 'Påmelding på en annen nettside', value: 'lenke' },
  { title: 'Ingen påmelding – bare møt opp', value: 'oppmote' },
  { title: 'Påmeldingen er stengt', value: 'stengt' },
  // 'sbsk' (our own sign-up) is reserved for the members phase and not offered yet.
] as const;

type SignupParent = { method?: string; opens?: string };

const needsUrl = (parent: unknown) => {
  const method = (parent as SignupParent | undefined)?.method;
  return method === 'spond' || method === 'lenke';
};

/**
 * How visitors sign up. Shared by events, festivals, festival days and single sessions, and
 * rendered by one component (`SignupBlock`), so the members phase adds a method here instead of
 * rewriting pages. Price and capacity live here because the payment phase reads them server-side.
 */
export const signupType = defineType({
  name: 'signup',
  title: 'Påmelding',
  type: 'object',
  options: { collapsible: true, collapsed: false },
  fields: [
    defineField({
      name: 'method',
      title: 'Hvordan melder man seg på?',
      type: 'string',
      options: { list: [...SIGNUP_METHODS], layout: 'radio' },
      validation: (rule) => rule.required().error('Velg hvordan man melder seg på.'),
    }),
    defineField({
      name: 'url',
      title: 'Lenke til påmeldingen',
      type: 'url',
      description: 'Lim inn lenken fra Spond eller nettsiden der man melder seg på.',
      hidden: ({ parent }) => !needsUrl(parent),
      validation: (rule) => [
        rule.uri({ scheme: ['https'] }).error('Lenken må starte med https://'),
        rule.custom((url, context) => {
          if (!needsUrl(context.parent)) return true;
          return url ? true : 'Lim inn lenken til påmeldingen.';
        }),
        rule
          .custom((url, context) => {
            const method = (context.parent as SignupParent | undefined)?.method;
            if (method !== 'spond' || typeof url !== 'string') return true;
            try {
              const host = new URL(url).hostname;
              return host === 'spond.com' || host.endsWith('.spond.com')
                ? true
                : 'Dette ser ikke ut som en Spond-lenke. Sjekk at den er riktig.';
            } catch {
              return true;
            }
          })
          .warning(),
      ],
    }),
    defineField({
      name: 'label',
      title: 'Tekst på knappen',
      type: 'localeString',
      description: 'Står det tomt, står det «Meld deg på».',
      hidden: ({ parent }) => !needsUrl(parent),
    }),
    defineField({
      name: 'opens',
      title: 'Påmeldingen åpner',
      type: 'datetime',
      description: 'Valgfritt. Før dette tidspunktet viser siden når påmeldingen åpner.',
      hidden: ({ parent }) => !needsUrl(parent),
    }),
    defineField({
      name: 'closes',
      title: 'Påmeldingsfrist',
      type: 'datetime',
      description: 'Valgfritt. Etter dette tidspunktet vises påmeldingen som stengt.',
      hidden: ({ parent }) => !needsUrl(parent),
      validation: (rule) =>
        rule.custom((closes, context) => {
          const opens = (context.parent as SignupParent | undefined)?.opens;
          if (!opens || typeof closes !== 'string') return true;
          return closes > opens ? true : 'Fristen må være etter at påmeldingen åpner.';
        }),
    }),
    defineField({
      name: 'price',
      title: 'Pris',
      type: 'localeString',
      description: 'Slik prisen vises på siden, f.eks. «150 kr, gratis for medlemmer». Valgfritt.',
    }),
    defineField({
      name: 'priceNok',
      title: 'Pris i kroner',
      type: 'number',
      description: 'Brukes når man kan betale på nettsiden. Tomt betyr gratis.',
      // Not used until our own sign-up (method 'sbsk') exists; the Vipps phase charges it.
      hidden: true,
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: 'capacity',
      title: 'Antall plasser',
      type: 'number',
      description: 'Valgfritt. Vises på siden. Begrenser ikke påmeldingen i Spond.',
      validation: (rule) => rule.integer().min(1),
    }),
    defineField({
      name: 'note',
      title: 'Mer om påmeldingen',
      type: 'localeText',
      description: 'Valgfritt, f.eks. «Meld deg på hver dag for seg».',
    }),
  ],
  preview: {
    select: { method: 'method', url: 'url' },
    prepare: ({ method, url }: { method?: string; url?: string }) => ({
      title: SIGNUP_METHODS.find((option) => option.value === method)?.title ?? 'Påmelding',
      subtitle: url,
    }),
  },
});
