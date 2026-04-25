import { Button } from '../ui/Buttons';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/ThemeContext';

interface HomeHeroProps {
  title: string;
  subtitle: string;
  imageUrl?: string;
  imageLicense?: string;
  imageSourceUrl?: string;
  links?: { label: string; url: string }[];
  sponsors?: { name: string; logoUrl: string; websiteUrl: string }[];
}

export default function HomeHero({ title, subtitle, imageUrl, links, sponsors }: HomeHeroProps) {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  return (
    <div
      className={
        imageUrl
          ? `relative flex h-screen flex-col items-center justify-center p-4 text-center`
          : 'flex h-screen flex-col items-center justify-center bg-[url(src/assets/images/hero-placeholder.jpg)] bg-cover bg-center p-4 text-center'
      }
    >
      {imageUrl && (
        <div className="absolute inset-0">
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      <div
        className={
          isDarkMode
            ? 'absolute inset-0 flex h-screen flex-col items-center justify-center bg-black/50 p-4 text-center'
            : 'absolute inset-0 flex h-screen flex-col items-center justify-center bg-white/50 p-4 text-center'
        }
      >
        <h1 className="text-4xl font-bold">{title || 'Stavanger Brettspillklubb'}</h1>
        <p className="text-xl">
          {subtitle ||
            'Bli med på ukentlige brettspillkvelder og prøv ut ny og kjente spill sammen med andre spilleglade folk. '}{' '}
        </p>
        {links && (
          <div className="mt-8">
            {links.map((link, index) => (
              <Button
                key={index}
                onClick={() => navigate(link.url)}
                variant={links.length % 2 === 0 ? 'primary' : 'secondary'}
                size="md"
                className="mx-2"
              >
                {link.label}
              </Button>
            ))}
          </div>
        )}
        {!links && (
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button onClick={() => navigate('/kalender')} variant="primary" size="md">
              Se kalender
            </Button>
            <Button onClick={() => navigate('/kalender')} variant="primary" size="md">
              Se kalender
            </Button>
          </div>
        )}
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
