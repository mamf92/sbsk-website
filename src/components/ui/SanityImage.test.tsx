import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MAX_IMAGE_HEIGHT } from '../../utils/sanityImage';
import { SanityImage, type SanityImageValue } from './SanityImage';

// The mock echoes the requested dimensions back in the URL, so the assertions below can read
// what was actually asked of the image CDN rather than trusting the chain was called at all.
vi.mock('../../sanity/sanityImageUrl', () => {
  type Params = { w?: number; h?: number };
  const chain = (params: Params) => ({
    width: (w: number) => chain({ ...params, w }),
    height: (h: number) => chain({ ...params, h }),
    fit: () => chain(params),
    auto: () => chain(params),
    quality: () => chain(params),
    url: () => `https://cdn.test/img?w=${params.w}&h=${params.h}`,
  });
  return { urlFor: () => chain({}) };
});

function imageValue(width: number, height: number, extra: Partial<SanityImageValue> = {}) {
  return {
    _type: 'image',
    asset: {
      _ref: 'image-abc-1536x2048-png',
      metadata: { dimensions: { width, height, aspectRatio: width / height } },
    },
    ...extra,
  } as SanityImageValue;
}

describe('SanityImage', () => {
  it('caps a 3:4 portrait at the height limit instead of letting it run the full width', () => {
    render(<SanityImage value={imageValue(1536, 2048, { alt: 'Dugnadsgjengen' })} />);

    const image = screen.getByRole('img', { name: 'Dugnadsgjengen' });
    expect(image).toHaveAttribute('height', String(MAX_IMAGE_HEIGHT));
    expect(image).toHaveAttribute('width', '358');
  });

  it('renders a landscape photo at its own ratio, still capped in height', () => {
    render(<SanityImage value={imageValue(2048, 1536, { alt: 'Spillbord' })} />);

    const image = screen.getByRole('img', { name: 'Spillbord' });
    expect(image).toHaveAttribute('height', String(MAX_IMAGE_HEIGHT));
    expect(image).toHaveAttribute('width', '597');
  });

  it('trims a panorama to the widest permitted ratio', () => {
    render(<SanityImage value={imageValue(2500, 1000, { alt: 'Panorama' })} />);

    expect(screen.getByRole('img', { name: 'Panorama' })).toHaveAttribute('width', '796');
  });

  it('asks the CDN for both a width and a height so the hotspot is honoured', () => {
    render(<SanityImage value={imageValue(1536, 2048, { alt: 'Kiosken' })} />);

    expect(screen.getByRole('img', { name: 'Kiosken' })).toHaveAttribute(
      'src',
      'https://cdn.test/img?w=358&h=448',
    );
  });

  it('bounds the figure to the rendered width so the caption sits under the photo', () => {
    const { container } = render(<SanityImage value={imageValue(1536, 2048, { alt: 'Bilde' })} />);

    expect(container.querySelector('figure')).toHaveStyle({ maxWidth: '358px' });
  });

  it('offers denser sources without ever upscaling past the uploaded file', () => {
    render(<SanityImage value={imageValue(1536, 2048, { alt: 'Stor' })} />);
    const wide = screen.getByRole('img', { name: 'Stor' }).getAttribute('srcset') ?? '';
    expect(wide.split(', ')).toHaveLength(3);

    render(<SanityImage value={imageValue(300, 400, { alt: 'Liten' })} />);
    const narrow = screen.getByRole('img', { name: 'Liten' }).getAttribute('srcset') ?? '';
    expect(narrow.split(', ')).toHaveLength(1);
    expect(narrow).toContain('300w');
  });

  it('renders the caption and the credit, prefixed "Foto:", as a link below the image', () => {
    render(
      <SanityImage
        value={imageValue(1536, 2048, {
          alt: 'Dugnadsgjengen i Byhaugkafeen',
          caption: 'Dugnadsgjengen i Byhaugkafeen',
          imageSourceName: 'Ola Nordmann',
          imageSourceUrl: 'https://example.test/ola',
        })}
      />,
    );

    expect(screen.getByText(/Dugnadsgjengen i Byhaugkafeen/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Foto: Ola Nordmann' })).toHaveAttribute(
      'href',
      'https://example.test/ola',
    );
  });

  it('omits the caption element entirely when there is nothing to say', () => {
    const { container } = render(<SanityImage value={imageValue(1536, 2048, { alt: 'Bilde' })} />);
    expect(container.querySelector('figcaption')).toBeNull();
  });

  it('frames the photo as one bordered insert, left-anchored rather than centered', () => {
    const { container } = render(<SanityImage value={imageValue(1536, 2048, { alt: 'Bilde' })} />);

    const figure = container.querySelector('figure');
    expect(figure).toHaveClass('border', 'border-black');
    expect(figure?.className).not.toMatch(/\bmx-auto\b/);
    // The frame belongs to the figure now, not a second border drawn by the image itself.
    expect(container.querySelector('img')).toHaveClass('border-0');
  });

  it('gives the caption strip a hard rule and a tint of its own text colour', () => {
    const { container } = render(
      <SanityImage value={imageValue(1536, 2048, { alt: 'Bilde', caption: 'En bildetekst' })} />,
    );

    expect(container.querySelector('figcaption')).toHaveClass(
      'border-t',
      'border-black',
      'bg-current/10',
    );
  });

  it('treats an image with no alt text as decorative', () => {
    const { container } = render(<SanityImage value={imageValue(1536, 2048)} />);
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('merges a caller className and forwards the ref', () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(
      <SanityImage ref={ref} className="mt-8" value={imageValue(1536, 2048)} />,
    );

    expect(ref.current).toBe(container.querySelector('figure'));
    expect(container.querySelector('figure')).toHaveClass('mt-8');
  });
});
