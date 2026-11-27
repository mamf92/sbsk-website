import { Link } from 'react-router-dom';
import { SectionHeading } from '../../ui/SectionHeading';
import { buttonClasses } from '../../ui/buttonClasses';
import ArrowRight from '../../../assets/icons/arrows/arrowright.svg?react';

const STEPS = [
  {
    title: 'Møt opp',
    body: 'Annenhver torsdag på Byhaugkafeen fra klokka 17. Ingen påmelding.',
    tilt: '-rotate-2',
  },
  {
    title: 'Lær et spill',
    body: 'Vi har spillene, og noen ved bordet forklarer gjerne reglene. Ta med ditt eget om du vil.',
    tilt: 'rotate-3',
  },
  {
    title: 'Bli medlem',
    body: 'Liker du det, blir du medlem: turneringer, festivalen og rabatt hos partnerne våre.',
    tilt: '',
  },
];

/** «Tre trekk, så er du i gang»: the newcomer's way in, as three spaces on a dashed track. */
export function NewcomerPath() {
  return (
    <section
      aria-labelledby="tre-trekk"
      className="bg-cream dark:bg-darkblue border-b border-black dark:border-white/20"
    >
      <div className="max-w-shell mx-auto flex flex-col gap-8 px-4 py-10 sm:px-6 lg:py-12">
        <SectionHeading id="tre-trekk" kicker="Ny her?" title="Tre trekk, så er du i gang" />
        <div className="relative">
          <div
            aria-hidden="true"
            className="border-darkestblue absolute top-11 right-[16%] left-[16%] hidden border-t-4 border-dashed md:block dark:border-white/50"
          />
          <ol className="relative grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="relative flex flex-col items-start gap-3 md:items-center md:text-center"
              >
                <span
                  aria-hidden="true"
                  className={`font-heading border-darkestblue text-darkestblue relative flex size-14 flex-none items-center justify-center border-2 text-3xl font-extrabold shadow-[6px_6px_0_var(--color-darkestblue)] md:size-22 md:text-5xl dark:border-white dark:shadow-[6px_6px_0_white] ${
                    i === 2 ? 'bg-orange' : 'bg-white'
                  } ${step.tilt}`}
                >
                  {i + 1}
                </span>
                <div className="flex flex-col items-start gap-2 md:items-center md:gap-3">
                  <h3 className="font-heading text-darkestblue text-h3 font-extrabold dark:text-white">
                    <span className="sr-only">Trekk {i + 1}: </span>
                    {step.title}
                  </h3>
                  <p className="font-body text-darkestblue max-w-[36ch] dark:text-white/90">
                    {step.body}
                  </p>
                  {i === 2 && (
                    <Link
                      to="/bli-medlem"
                      className={buttonClasses({ variant: 'primary', size: 'md' })}
                    >
                      Bli medlem <ArrowRight aria-hidden="true" className="h-4 w-4 fill-current" />
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
