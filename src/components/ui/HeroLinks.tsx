import { useNavigate } from 'react-router-dom';
import ArrowRight from '../../assets/icons/arrows/arrowright.svg?react';
import { Button } from './Buttons';
import { buttonClasses } from './buttonClasses';
import { isInternalLink, internalLinkPath } from '../../utils/internalLinks';

export interface HeroLink {
  label: string;
  url: string;
}

/**
 * The row of calls-to-action under a hero's title, from the Studio's `links[]` (#255).
 *
 * Shared because the home and Våre spill heroes had drifted: home rendered an editable array
 * and Våre spill a hardcoded button, so an editor could change one and not the other. The
 * fallback stays with the caller, since the two pages sensibly point at different things when
 * nobody has set anything.
 *
 * Internal destinations stay `<button onClick={navigate}>` rather than becoming anchors: that
 * is what both heroes already rendered, and turning a hero CTA into a link is a change to the
 * page's accessibility tree that has nothing to do with making the text editable. External
 * ones do have to be anchors — a button cannot be opened in a new tab, and `navigate()` would
 * feed an off-site URL to the router and land on the 404 page. They wear `buttonClasses` for
 * the same reason `GameCard`'s do.
 */
const MAX_LINKS = 3;

export function HeroLinks({
  links,
  fallback,
  className = '',
}: {
  links?: HeroLink[];
  /** Rendered when the Studio has no links set — an empty field must not empty the hero. */
  fallback: HeroLink[];
  className?: string;
}) {
  const navigate = useNavigate();

  // The schema caps this at three, but the schema is advice: a document saved before the rule
  // existed, or through the API, can still carry more. The row is the last thing standing
  // between that and a hero pushed off its own image.
  const resolved = (links && links.length > 0 ? links : fallback).slice(0, MAX_LINKS);
  if (resolved.length === 0) return null;

  return (
    <div className={['flex flex-row flex-wrap gap-4', className].filter(Boolean).join(' ')}>
      {resolved.map((link, index) =>
        isInternalLink(link.url) ? (
          <Button
            key={index}
            onClick={() => navigate(internalLinkPath(link.url))}
            variant="primary"
            size="lg"
            icon="right"
            className="flex-none"
          >
            {link.label}
          </Button>
        ) : (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses({ variant: 'primary', size: 'lg', className: 'flex-none' })}
          >
            {link.label}
            <ArrowRight aria-hidden="true" className="h-3 min-h-3 w-3 min-w-3 fill-current" />
          </a>
        ),
      )}
    </div>
  );
}

HeroLinks.displayName = 'HeroLinks';
