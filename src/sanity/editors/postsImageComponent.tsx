import { SanityImage, type SanityImageValue } from '../../components/ui/SanityImage';

// An inline image always fills the text column. Sanity's documented pattern for images in
// Portable Text is a plain `image` block between paragraphs and leaves layout to the frontend
// (https://www.sanity.io/docs/studio/portable-text-editor-configuration#example-images), so
// there is no per-image placement choice: sizing, cropping and captioning live in `SanityImage`.
// `clear-both`: the carousel floats left beside the text from `lg` up (`PostsSection.tsx`); an
// inline image near the top of the body must start below it, not slide its border behind it.
export const PostImageComponent = ({ value }: { value: SanityImageValue }) => (
  <SanityImage value={value} className="clear-both" />
);
