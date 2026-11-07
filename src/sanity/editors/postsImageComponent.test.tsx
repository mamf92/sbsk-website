import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SanityImageValue } from '../../components/ui/SanityImage';
import { PostImageComponent } from './postsImageComponent';

vi.mock('../../sanity/sanityImageUrl', () => {
  const chain = () => ({
    width: chain,
    height: chain,
    fit: chain,
    auto: chain,
    quality: chain,
    url: () => 'https://cdn.test/img',
  });
  return { urlFor: chain };
});

describe('PostImageComponent', () => {
  // Posts saved while the Studio still offered "Høyre"/"Venstre" keep that value in the
  // dataset; it must no longer float the image beside the text.
  it('fills the text column even when an old alignment value is still stored', () => {
    const value = {
      _type: 'image',
      alt: 'Spillkveld på Sølvberget',
      alignment: 'venstre',
      asset: {
        _ref: 'image-abc-1200x800-png',
        metadata: { dimensions: { width: 1200, height: 800, aspectRatio: 1.5 } },
      },
    } as SanityImageValue;

    render(<PostImageComponent value={value} />);

    const figure = screen.getByRole('img', { name: 'Spillkveld på Sølvberget' }).closest('figure');
    expect(figure).not.toBeNull();
    expect(figure!.className).toContain('w-full');
    expect(figure!.className).not.toMatch(/float|w-1\/2/);
    // Starts below the carousel's left float rather than sliding behind it.
    expect(figure!.className).toContain('clear-both');
  });
});
