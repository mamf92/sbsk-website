import { urlFor } from '../sanityImageUrl';
import { type SanityImageSource } from '@sanity/asset-utils';

type ImageComponentProps = {
  value: SanityImageSource & { alt?: string; imageSourceName?: string; imageSourceUrl?: string };
};

export const PostImageComponent = ({ value }: ImageComponentProps) => {
  return (
    <div className="relative w-full">
      <img
        src={urlFor(value).width(800).height(400).fit('crop').url()}
        srcSet={[
          `${urlFor(value).width(400).height(200).fit('crop').url()} 400w`,
          `${urlFor(value).width(800).height(400).fit('crop').url()} 800w`,
          `${urlFor(value).width(1024).height(512).fit('crop').url()} 1024w`,
        ].join(', ')}
        sizes="(max-width: 400px) 360px, (max-width: 800px) 690px, 915px"
        alt={value.alt || ' '}
        loading="lazy"
        className="h-full w-full object-cover"
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
