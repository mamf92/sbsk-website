import { Button } from '../ui/Buttons';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/ThemeContext';

interface HomeHeroProps {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  imageSource?: string;
  imageSourceUrl?: string;
  links?: { label: string; url: string }[];
  sponsors?: { name: string; logoUrl: string; websiteUrl: string }[];
}

const FALLBACK_HERO = {
  title: 'Stavanger Brettspillklubb',
  subtitle:
    'Bli med på ukentlige brettspillkvelder og prøv ut ny og kjente spill sammen med andre spilleglade folk.',
  imageUrl: 'src/assets/images/hero-placeholder.jpg',
  imageSource: 'Designed by Freepik',
  imageSourceUrl: 'www.freepik.com',
};

export default function HomeHero({
  title,
  subtitle,
  imageUrl,
  imageSource,
  imageSourceUrl,
  links,
  sponsors,
}: HomeHeroProps = {}) {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const resolvedTitle = title || FALLBACK_HERO.title;
  const resolvedSubtitle = subtitle || FALLBACK_HERO.subtitle;
  const resolvedImage = imageUrl || FALLBACK_HERO.imageUrl;
  const hasCustomLinks = links !== undefined && links.length > 0;
  const resolvedImageSource = imageSource || FALLBACK_HERO.imageSource;
  const resolvedImageSourceUrl = imageSourceUrl || FALLBACK_HERO.imageSourceUrl;

  return (
    <div
      className={
        'relative flex h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 text-center'
      }
    >
      <div className="absolute inset-0">
        <img src={resolvedImage} alt="" className="h-full w-full object-cover" />
      </div>
      <div
        className={
          isDarkMode
            ? 'absolute inset-0 flex h-[calc(100vh-4rem)] flex-col items-center justify-center bg-black/50 p-4 text-center'
            : 'absolute inset-0 flex h-[calc(100vh-4rem)] flex-col items-center justify-center bg-white/50 p-4 text-center'
        }
      >
        {resolvedImageSource && resolvedImageSourceUrl && (
          <div className="absolute right-4 bottom-4 flex flex-col gap-2">
            <span className="text-darkestblue text-sm dark:text-white">{resolvedImageSource}</span>
            <a
              href={resolvedImageSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-darkestblue text-sm underline dark:text-white"
            >
              {resolvedImageSourceUrl}
            </a>
          </div>
        )}
        <div className="flex flex-col items-start gap-12 md:w-[calc(60%)]">
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
        {sponsors && (
          <div className="mt-8">
            {sponsors.map((sponsor, index) => (
              <a
                key={index}
                href={sponsor.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mx-2"
              >
                <img src={sponsor.logoUrl} alt={sponsor.name} className="h-16 w-auto" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
