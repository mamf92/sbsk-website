import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HeroImage } from './HeroImage';
import { heroPlaceholderSrcSet, heroPlaceholderUrl } from '../../utils/heroImage';

vi.mock('../../sanity/sanityImageUrl', () => {
  const builder = (source: unknown) => ({
    width: (width: number) => builder({ ...(source as object), width }),
    fit: () => builder(source),
    auto: (mode: string) => builder({ ...(source as object), auto: mode }),
    url: () => {
      const { width, auto } = source as { width?: number; auto?: string };
      return `https://cdn.sanity.io/hero?w=${width}${auto ? `&auto=${auto}` : ''}`;
    },
  });
  return { urlFor: (source: unknown) => builder(source ?? {}) };
});

/** `<picture>` has no role, and the `<img>` inside it is decorative, so neither is queryable. */
function heroImg(container: HTMLElement) {
  const img = container.querySelector('img');
  if (!img) throw new Error('no <img> rendered');
  return img;
}

describe('HeroImage — placeholder', () => {
  it('offers AVIF and WebP ahead of the JPEG the <img> falls back to', () => {
    const { container } = render(<HeroImage />);

    const types = [...container.querySelectorAll('source')].map((s) => s.getAttribute('type'));
    expect(types).toEqual(['image/avif', 'image/webp']);
    expect(heroImg(container).getAttribute('src')).toContain('.jpg');
  });

  // Every format ships the same width ladder, so the browser picks a size for the screen no
  // matter which format it lands on — including the JPEG path, where nothing else would stop it
  // fetching the 1500w original.
  it('gives every format the full width ladder', () => {
    const { container } = render(<HeroImage />);

    for (const element of [...container.querySelectorAll('source'), heroImg(container)]) {
      const srcSet = element.getAttribute('srcset') ?? '';
      expect(srcSet).toMatch(/640w/);
      expect(srcSet).toMatch(/960w/);
      expect(srcSet).toMatch(/1280w/);
      expect(srcSet).toMatch(/1500w/);
      expect(element.getAttribute('sizes')).toBe('100vw');
    }
  });

  // The `<link rel="preload">` in index.html hardcodes this exact set. If the ladder or the
  // path shape here changes and that does not, the browser downloads the hero twice.
  it('builds placeholder URLs the index.html preload can be kept in step with', () => {
    expect(heroPlaceholderUrl(640, 'avif')).toBe('/images/hero/hero-640.avif');
    expect(heroPlaceholderSrcSet('avif')).toBe(
      '/images/hero/hero-640.avif 640w, /images/hero/hero-960.avif 960w, ' +
        '/images/hero/hero-1280.avif 1280w, /images/hero/hero-1500.avif 1500w',
    );
  });
});

describe('HeroImage — Sanity image', () => {
  // Without `auto=format` the CDN serves whatever the editor uploaded, which is how a hero
  // stayed a full-size JPEG while every other Sanity image on the site was already negotiating
  // AVIF (#222).
  it('asks the CDN to negotiate a modern format, at every width', () => {
    const { container } = render(<HeroImage image={{ _ref: 'image-abc' }} />);

    const img = heroImg(container);
    expect(container.querySelector('picture')).toBeNull();
    expect(img.getAttribute('src')).toContain('auto=format');
    for (const width of [640, 960, 1280, 1440]) {
      expect(img.getAttribute('srcset')).toContain(`w=${width}&auto=format ${width}w`);
    }
  });
});

describe('HeroImage — priority', () => {
  // This is the LCP element on the routes that pass `priority`, and the whole point of #222 was
  // that it was queued behind everything else.
  it('marks a priority hero as eager and high priority', () => {
    const { container } = render(<HeroImage priority />);

    const img = heroImg(container);
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchpriority', 'high');
  });

  it('leaves a non-priority hero lazy, so it cannot compete with one that is', () => {
    const { container } = render(<HeroImage />);

    const img = heroImg(container);
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('fetchpriority', 'auto');
  });

  it('renders the photo as decorative — the hero heading carries the meaning', () => {
    const { container } = render(<HeroImage priority />);

    expect(heroImg(container)).toHaveAttribute('alt', '');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
