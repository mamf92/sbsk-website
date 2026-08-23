import { SanityImage, type SanityImageValue } from '../../components/ui/SanityImage';

type PostImageValue = SanityImageValue & { alignment?: 'høyre' | 'venstre' | 'full' };

// Sizing, cropping and captioning all live in `SanityImage`; only placement is decided here,
// from the editor's own `alignment` choice — Sanity's documented pattern for a photo the text
// wraps around: https://www.sanity.io/answers/how-to-model-an-image-with-alignment-in-sanity-cms.
// `md:` (not `sm:`) is where a wrapped column stops being a five-word ribbon; below it every
// value is full-width and stacked, same as `full`.
const alignmentClasses = {
  høyre: 'md:float-right md:ml-4 md:mb-2 md:w-1/2',
  venstre: 'md:float-left md:mr-4 md:mb-2 md:w-1/2',
  full: '',
} as const;

export const PostImageComponent = ({ value }: { value: PostImageValue }) => (
  <SanityImage value={value} className={alignmentClasses[value.alignment ?? 'høyre']} />
);
