import { urlFor } from '../../sanity/sanityImageUrl';
import { getImageDimensions, type SanityImageSource } from '@sanity/asset-utils';

type ImageComponentProps = {
  value: SanityImageSource & { alt?: string; imageSourceName?: string; imageSourceUrl?: string };
  isInline?: boolean;
};

export const ImageComponents = ({ value, isInline }: ImageComponentProps) => {
  const { width, height } = getImageDimensions(value);
  return (
    <div className="relative">
      <img
        src={urlFor(value)
          .width(isInline ? 100 : 800)
          .fit('max')
          .auto('format')
          .url()}
        alt={value.alt || ' '}
        loading="lazy"
        style={{
          display: isInline ? 'inline-block' : 'block',
          aspectRatio: width / height,
        }}
      />
      <div>
        {value.imageSourceName && value.imageSourceUrl && (
          <div className="absolute right-4 bottom-2 flex flex-col">
            <a
              href={value.imageSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-darkestblue/50 text-xs text-white underline sm:text-sm"
            >
              {value.imageSourceName}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
