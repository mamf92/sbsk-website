import * as React from 'react';
import { Button } from './Buttons';
import { Link } from './Link';
import { useEventsT } from '../../i18n';
import { urlFor } from '../../sanity/sanityImageUrl';
import type { SponsorTier, SponsorTypes } from '../../sanity/queryHelpers/fragments';
import { groupSponsorsByTier, tierOf } from '../../utils/sponsors';
import { openExternal, safeExternalUrl } from '../../utils/safeUrl';

// Fixed boxes per tier, so logos of odd shapes line up and the grading reads at a glance.
const logoBox = {
  hovedsponsor: 'h-24 w-48',
  sponsor: 'h-16 w-32',
  partner: 'h-12 w-24',
} as const;

/**
 * One sponsor's logo, linked to their site when that link is safe. Many logos are dark on a
 * transparent background. On a surface that follows the theme (`themed`), dark mode shows the
 * editor's light version when there is one, else puts the logo on a white tile. On a fixed
 * light surface such as the orange strip, the normal logo is always right. A sponsor without a
 * logo gets a text tile with its name.
 */
export function SponsorLogo({
  sponsor,
  size,
  themed = true,
}: {
  sponsor: SponsorTypes;
  size: SponsorTier;
  themed?: boolean;
}) {
  const t = useEventsT();
  const link = safeExternalUrl(sponsor.link);
  const box = `${logoBox[size]} flex items-center justify-center`;

  let mark: React.ReactNode;
  if (!sponsor.logo) {
    mark = (
      <span
        className={`${box} font-heading border border-current p-2 text-center text-sm font-bold`}
      >
        {sponsor.altText}
      </span>
    );
  } else if (themed && sponsor.logoOnDark) {
    mark = (
      <span className={box}>
        <img
          src={urlFor(sponsor.logo).width(480).url()}
          alt={sponsor.altText}
          className="max-h-full max-w-full object-contain dark:hidden"
        />
        <img
          src={urlFor(sponsor.logoOnDark).width(480).url()}
          alt={sponsor.altText}
          className="hidden max-h-full max-w-full object-contain dark:block"
        />
      </span>
    );
  } else {
    mark = (
      <span className={`${box} ${themed ? 'dark:bg-white dark:p-2' : ''}`}>
        <img
          src={urlFor(sponsor.logo).width(480).url()}
          alt={sponsor.altText}
          className="max-h-full max-w-full object-contain"
        />
      </span>
    );
  }

  if (!link) return <>{mark}</>;
  return (
    <Link
      variant="inherit"
      href={link}
      target="_blank"
      rel="noopener noreferrer sponsored"
      aria-label={`${sponsor.altText} ${t('opensInNewTab')}`}
      className="block"
    >
      {mark}
    </Link>
  );
}

function SponsorOffer({ sponsor }: { sponsor: SponsorTypes }) {
  const target = safeExternalUrl(sponsor.ctaLink) ?? safeExternalUrl(sponsor.link);
  if (!sponsor.ctaLabel || !target) return null;
  return (
    <Button variant="tertiary" size="xs" onClick={() => openExternal(target)}>
      {sponsor.ctaLabel}
    </Button>
  );
}

type SponsorListProps = Omit<React.HTMLAttributes<HTMLElement>, 'children'> & {
  sponsors: SponsorTypes[] | null | undefined;
};

/** The band of main sponsors right under the top of an event page. Only `hovedsponsor`. */
export const SponsorStrip = React.forwardRef<HTMLElement, SponsorListProps>(
  ({ sponsors, className = '', ...props }, ref) => {
    const t = useEventsT();
    const main = (sponsors ?? []).filter((sponsor) => tierOf(sponsor) === 'hovedsponsor');
    if (main.length === 0) return null;
    return (
      <section
        ref={ref}
        aria-label={t('sponsors.supportedBy')}
        className={[
          'bg-darkorange text-darkestblue flex flex-col items-center gap-6 px-4 py-8 sm:px-8',
          className,
        ].join(' ')}
        {...props}
      >
        <p className="font-body text-xs font-semibold tracking-[0.14em] uppercase">
          {t('sponsors.supportedBy')}
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {main.map((sponsor, index) => (
            <li key={sponsor._key ?? index} className="flex flex-col items-center gap-2">
              <SponsorLogo sponsor={sponsor} size="hovedsponsor" themed={false} />
              <SponsorOffer sponsor={sponsor} />
            </li>
          ))}
        </ul>
      </section>
    );
  },
);

SponsorStrip.displayName = 'SponsorStrip';

/** Every sponsor, grouped by tier under its own heading, logos sized by tier. */
export const SponsorGrid = React.forwardRef<HTMLElement, SponsorListProps>(
  ({ sponsors, className = '', ...props }, ref) => {
    const t = useEventsT();
    const groups = groupSponsorsByTier(sponsors ?? []);
    if (groups.length === 0) return null;
    return (
      <section
        ref={ref}
        className={['font-body flex flex-col gap-6', className].join(' ')}
        {...props}
      >
        <h2 className="font-heading text-h3 font-bold">{t('sponsors.title')}</h2>
        {groups.map((group) => (
          <div key={group.tier} className="flex flex-col gap-3">
            <h3 className="font-heading text-h4 font-bold">{t(`sponsors.tier.${group.tier}`)}</h3>
            <ul className="flex flex-wrap items-start gap-6">
              {group.sponsors.map((sponsor, index) => (
                <li key={sponsor._key ?? index} className="flex flex-col items-start gap-2">
                  <SponsorLogo sponsor={sponsor} size={group.tier} />
                  <SponsorOffer sponsor={sponsor} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    );
  },
);

SponsorGrid.displayName = 'SponsorGrid';
