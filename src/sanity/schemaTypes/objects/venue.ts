import { defineField, defineType } from 'sanity';

/** Where and how to show up. Shown as the «Oppmøte» box on event and festival pages. */
export const venueType = defineType({
  name: 'venue',
  title: 'Oppmøte',
  type: 'object',
  options: { collapsible: true, collapsed: false },
  fields: [
    defineField({
      name: 'name',
      title: 'Sted',
      type: 'string',
      description: 'F.eks. «Tasta bydelshus».',
      validation: (rule) => rule.required().error('Skriv navnet på stedet.'),
    }),
    defineField({
      name: 'address',
      title: 'Adresse',
      type: 'string',
      description: 'F.eks. «Tastarustå 6, 4027 Stavanger». Siden lager en kartlenke av adressen.',
    }),
    defineField({
      name: 'meetingPoint',
      title: 'Hvor møter vi?',
      type: 'localeText',
      description: 'F.eks. «Inngang fra parkeringsplassen, 2. etasje».',
    }),
    defineField({
      name: 'doorsOpen',
      title: 'Dørene åpner',
      type: 'string',
      description: 'Klokkeslett som TT:MM, f.eks. 17:30. Valgfritt.',
      validation: (rule) =>
        rule
          .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { name: 'klokkeslett' })
          .error('Skriv klokkeslettet som TT:MM, f.eks. 17:30.'),
    }),
    defineField({
      name: 'directions',
      title: 'Slik kommer du deg dit',
      type: 'localeBlock',
      description: 'Buss, parkering, sykkel. Valgfritt.',
    }),
    defineField({
      name: 'accessibility',
      title: 'Tilgjengelighet',
      type: 'localeText',
      description: 'F.eks. trinnfri inngang, heis, HC-toalett. Valgfritt.',
    }),
    defineField({
      name: 'contact',
      title: 'Kontaktperson på stedet',
      type: 'string',
      description: 'Bare navnet. Ikke skriv telefonnummer her – alt på siden er offentlig.',
    }),
  ],
  preview: { select: { title: 'name', subtitle: 'address' } },
});
