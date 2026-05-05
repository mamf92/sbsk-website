import { Button } from '../ui/Buttons';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/ThemeContext';
import type { HomeHeroType } from '../../sanity/queryHelpers/home-hero';
import { urlFor } from '../../sanity/sanityImageUrl';

const FALLBACK_HERO = {
  title: 'Stavanger Brettspillklubb',
  subtitle:
    'Bli med på ukentlige brettspillkvelder og prøv ut ny og kjente spill sammen med andre spilleglade folk.',
  imageUrl: 'src/assets/images/hero-placeholder.jpg',
  imageSourceName: 'Designed by Freepik',
  imageSourceUrl: 'www.freepik.com',
};

export default function HomeHero({
  title,
  subtitle,
  image,
  imageSource,
  links,
  sponsors,
}: HomeHeroType = {}) {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const resolvedTitle = title || FALLBACK_HERO.title;
  const resolvedSubtitle = subtitle || FALLBACK_HERO.subtitle;
  const hasCustomLinks = links && links.length > 0;
  const resolvedImageSource = imageSource?.imageSourceName || FALLBACK_HERO.imageSourceName;
  const resolvedImageSourceUrl = imageSource?.imageSourceUrl || FALLBACK_HERO.imageSourceUrl;
  const sponsorsExist = sponsors && sponsors.length > 0;

  return (
    <div
      className={
        'relative flex h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 text-center'
      }
    >
      <div className="absolute inset-0">
        {image && (
          <img
            src={urlFor(image).width(1440).fit('crop').url()}
            srcSet={[
              `${urlFor(image).width(400).fit('crop').url()} 400w`,
              `${urlFor(image).width(800).fit('crop').url()} 800w`,
              `${urlFor(image).width(1200).fit('crop').url()} 1200w`,
              `${urlFor(image).width(1440).fit('crop').url()} 1440w`,
            ].join(', ')}
            sizes="(max-width: 400px) 400px, (max-width: 800px) 800px, (max-width: 1200px) 1200px, 1440px"
            alt=""
            className="h-full w-full object-cover"
          />
        )}
        {!image && (
          <img src={FALLBACK_HERO.imageUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div
        className={
          isDarkMode
            ? 'absolute inset-0 flex h-[calc(100vh-4rem)] flex-col items-center justify-center bg-black/50 p-4 text-center'
            : 'absolute inset-0 flex h-[calc(100vh-4rem)] flex-col items-center justify-center bg-white/50 p-4 text-center'
        }
      >
        <div className="flex flex-1 flex-col justify-center gap-12 md:w-[calc(60%)]">
          <div className="flex max-w-150 flex-col items-start gap-4">
            <h1 className="text-darkestblue text-left text-4xl font-bold dark:text-white">
              {resolvedTitle}
            </h1>
            <p className="text-darkestblue text-regular text-left text-lg dark:text-white">
              {resolvedSubtitle}
            </p>
          </div>
          {hasCustomLinks && (
            <div className="mt-8 flex flex-row flex-wrap gap-4">
              {links.map((link, index) => (
                <Button
                  key={index}
                  onClick={() => navigate(link.url)}
                  variant={index % 2 === 0 ? 'primary' : 'secondary'}
                  size="lg"
                  icon="right"
                >
                  {link.label}
                </Button>
              ))}
            </div>
          )}
          {!hasCustomLinks && (
            <div className="mt-8 flex flex-row flex-wrap gap-4">
              <Button
                onClick={() => navigate('/kalender')}
                variant="primary"
                size="lg"
                icon="right"
              >
                Se kalender
              </Button>
              <Button
                onClick={() => navigate('/bli-medlem')}
                variant="secondary"
                size="lg"
                icon="right"
              >
                Bli medlem
              </Button>
            </div>
          )}
        </div>
        <div className="flex w-full flex-col pb-2 lg:w-[calc(80%)]">
          {sponsorsExist && (
            <div className="flex flex-col items-start gap-4">
              <h2 className="text-darkestblue text-left text-xl font-bold dark:text-white">
                Vi samarbeider med:
              </h2>
              <div className="flex w-full flex-col items-start justify-between gap-2 self-baseline rounded p-4 sm:flex-row md:gap-0 dark:bg-white/50">
                {sponsors.map((sponsor, index) => (
                  <a
                    key={index}
                    href={sponsor.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={urlFor(sponsor.logoImage).url()}
                      alt={sponsor.name}
                      className="h-14 w-auto lg:h-20"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
          {resolvedImageSource && resolvedImageSourceUrl && (
            <div className="absolute right-4 bottom-2 flex flex-col gap-2 lg:bottom-6">
              <a
                href={resolvedImageSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-darkestblue text-sm underline dark:text-white"
              >
                {resolvedImageSource}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
