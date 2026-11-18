import * as React from 'react';

type PanelProps = Omit<React.HTMLAttributes<HTMLElement>, 'title'> & {
  /** The panel's heading. Without one the panel is a plain block and not a landmark. */
  title?: React.ReactNode;
  headingLevel?: 'h2' | 'h3';
  tone?: 'blue' | 'orange';
  /** `lang` of the heading when it differs from the page's. */
  titleLang?: string;
};

// Fixed brand fills in both themes, like the calendar's category cards. Each tone declares the
// hard-shadow colour its fill can carry, so a button lifting inside it casts a visible edge.
const base = 'font-body flex flex-col gap-3 p-4 sm:p-6';
const tones = {
  blue: 'bg-darkblue surface-dark text-white',
  orange: 'bg-orange surface-light text-darkestblue',
} as const;

/**
 * A block of event information on a solid brand fill: «Priser», «Program», «Oppmøte», «Om
 * arrangementet». One component, so the event pages carry no fill or padding of their own and a
 * reskin changes them all here. With a `title` it is a `<section>` named by its heading.
 */
export const Panel = React.forwardRef<HTMLElement, PanelProps>(
  (
    { title, headingLevel = 'h2', tone = 'blue', titleLang, className = '', children, ...props },
    ref,
  ) => {
    const headingId = React.useId();
    const Heading = headingLevel;
    const classes = [base, tones[tone], className].join(' ');

    if (title === undefined) {
      return (
        <div ref={ref as React.Ref<HTMLDivElement>} className={classes} {...props}>
          {children}
        </div>
      );
    }
    return (
      <section ref={ref} aria-labelledby={headingId} className={classes} {...props}>
        <Heading id={headingId} className="font-heading text-h3 font-bold" lang={titleLang}>
          {title}
        </Heading>
        {children}
      </section>
    );
  },
);

Panel.displayName = 'Panel';
