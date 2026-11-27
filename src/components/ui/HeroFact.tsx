import type { ComponentType, ReactNode, SVGProps } from 'react';

/**
 * One fact on a navy hero: an orange icon and a line of text, with room for a quieter second
 * part (an address, «Dørene åpner») and a link that wrap together under the icon on a phone.
 * The icon is decoration; the text says the fact on its own.
 */
export function HeroFact({
  icon: Icon,
  children,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  children: ReactNode;
}) {
  return (
    <p className="font-body flex items-start gap-2.5 text-lg">
      <Icon aria-hidden="true" className="text-orange mt-1 h-5 w-5 flex-none fill-current" />
      <span className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-0.5">{children}</span>
    </p>
  );
}

/** The quieter second part of a `HeroFact`. */
export function HeroFactNote({ children, lang }: { children: ReactNode; lang?: string }) {
  return (
    <span className="text-base text-white/80" lang={lang}>
      {children}
    </span>
  );
}

HeroFact.displayName = 'HeroFact';
HeroFactNote.displayName = 'HeroFactNote';
