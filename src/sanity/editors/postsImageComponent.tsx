import { SanityImage, type SanityImageValue } from '../../components/ui/SanityImage';

// Sizing, cropping and captioning all live in the primitive. The float-beside-the-text layout
// this replaced needed an editor to pick a side, and produced a ragged column of text squeezed
// past a half-width photo — a body image now simply sits in the flow at a bounded size.
export const PostImageComponent = ({ value }: { value: SanityImageValue }) => (
  <SanityImage value={value} />
);
