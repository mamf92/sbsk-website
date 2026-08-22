import { urlFor } from '../sanityImageUrl';
import { type SanityImageSource } from '@sanity/asset-utils';

type ImageComponentProps = {
  value: SanityImageSource & {
    alt?: string;
    alignment?: 'venstre' | 'høyre';
    imageSourceName?: string;
    imageSourceUrl?: string;
  };
};

// Full width would let one inline image push the surrounding paragraph out of the reader's
// view entirely, so from `sm` up it sits beside the text instead — editor-chosen side, text
// flowing past it. Mobile stays full-width and stacked: a floated image in a column that
// narrow leaves no room for the text to wrap around it.
const alignmentClasses = {
  høyre: 'sm:float-right sm:ml-4 sm:w-1/2',
  venstre: 'sm:float-left sm:mr-4 sm:w-1/2',
} as const;

export const PostImageComponent = ({ value }: ImageComponentProps) => {
  const alignment = alignmentClasses[value.alignment ?? 'høyre'];

  return (
    <div className={`relative mb-4 w-full ${alignment}`}>
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
