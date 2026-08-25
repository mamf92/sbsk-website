import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Carousel } from './Carousel';
import type { SanityImageValue } from './SanityImage';

// Distinguishes images by baking an id (the `_key`) into the mock URL, unlike a naive mock that
// only echoes width/height — otherwise every request at the same size would be indistinguishable
// and a test could not tell whether the main display actually swapped to a different photo.
vi.mock('../../sanity/sanityImageUrl', () => {
  type Params = { id?: string; w?: number; h?: number };
  const chain = (params: Params) => ({
    width: (w: number) => chain({ ...params, w }),
    height: (h: number) => chain({ ...params, h }),
    fit: () => chain(params),
    auto: () => chain(params),
    quality: () => chain(params),
    url: () => `https://cdn.test/${params.id}?w=${params.w}&h=${params.h}`,
  });
  return { urlFor: (value: { _key?: string }) => chain({ id: value?._key }) };
});

function photos(count: number): SanityImageValue[] {
  return Array.from({ length: count }, (_, i) => ({
    _type: 'image',
    _key: `img${i + 1}`,
    alt: `Bilde ${i + 1}`,
  })) as SanityImageValue[];
}

describe('Carousel', () => {
  it('renders nothing for an empty image list', () => {
    const { container } = render(<Carousel images={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a single image with no arrows, ticks or live region, but an open-lightbox button', () => {
    render(<Carousel images={photos(1)} />);

    expect(screen.getByRole('img', { name: 'Bilde 1' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(
      screen.queryByRole('button', { name: /Forrige|Neste|Bilde 1 av/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('steps forward and wraps from the last image back to the first', async () => {
    const user = userEvent.setup();
    render(<Carousel images={photos(3)} />);

    expect(screen.getByRole('img', { name: 'Bilde 1' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Neste bilde' }));
    await user.click(screen.getByRole('button', { name: 'Neste bilde' }));
    expect(screen.getByRole('img', { name: 'Bilde 3' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Neste bilde' }));
    expect(screen.getByRole('img', { name: 'Bilde 1' })).toBeInTheDocument();
  });

  it('steps backward and wraps from the first image to the last', async () => {
    const user = userEvent.setup();
    render(<Carousel images={photos(3)} />);

    await user.click(screen.getByRole('button', { name: 'Forrige bilde' }));
    expect(screen.getByRole('img', { name: 'Bilde 3' })).toBeInTheDocument();
  });

  it('swaps the main photo when a tick is clicked, and marks it pressed', async () => {
    const user = userEvent.setup();
    render(<Carousel images={photos(3)} />);

    const tick2 = screen.getByRole('button', { name: 'Bilde 2 av 3' });
    await user.click(tick2);

    expect(tick2).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('img', { name: 'Bilde 2' })).toHaveAttribute(
      'src',
      'https://cdn.test/img2?w=960&h=640',
    );
    // The other two ticks must not also claim to be pressed.
    const ticks = screen.getAllByRole('button', { name: /^Bilde \d av 3$/ });
    expect(ticks.filter((el) => el.getAttribute('aria-pressed') === 'true')).toHaveLength(1);
  });

  it('gives the active tick a filled mark with a hard offset shadow, not an inset one', async () => {
    const user = userEvent.setup();
    render(<Carousel images={photos(3)} />);

    const tick2 = screen.getByRole('button', { name: 'Bilde 2 av 3' });
    await user.click(tick2);

    const mark = tick2.querySelector('span');
    expect(mark).toHaveClass('shadow-1');
    expect(mark).toHaveClass('bg-current');
    expect(mark).not.toHaveClass('shadow-inset-1');
  });

  it('labels every tick with its position and total', () => {
    render(<Carousel images={photos(9)} initialIndex={2} />);

    const tick = screen.getByRole('button', { name: 'Bilde 3 av 9' });
    expect(tick).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('button', { name: /^Bilde \d av 9$/ })).toHaveLength(9);
  });

  it('advances on ArrowRight from a focused control', async () => {
    const user = userEvent.setup();
    render(<Carousel images={photos(3)} />);

    screen.getByRole('button', { name: 'Neste bilde' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('img', { name: 'Bilde 2' })).toBeInTheDocument();
  });

  it('announces the current image through a polite status region', async () => {
    const user = userEvent.setup();
    render(<Carousel images={photos(3)} />);

    await user.click(screen.getByRole('button', { name: 'Neste bilde' }));
    expect(within(screen.getByRole('status')).getByText(/Bilde 2 av 3/)).toBeInTheDocument();
  });

  it('carries the literal viewport height budget on the root', () => {
    const { container } = render(<Carousel images={photos(2)} />);
    const root = container.querySelector('section');
    expect(root?.className).toContain('max-h-[80vh]');
    expect(root?.className).toContain('lg:max-h-[60vh]');
  });

  it('merges a caller className and forwards the ref', () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(
      <Carousel ref={ref} images={photos(2)} className="lg:float-left" />,
    );
    expect(ref.current).toBe(container.querySelector('section'));
    expect(container.querySelector('section')).toHaveClass('lg:float-left');
  });

  it('names the region for assistive tech', () => {
    render(<Carousel images={photos(2)} label="Bilder fra «Testinnlegg»" />);
    expect(screen.getByRole('region', { name: 'Bilder fra «Testinnlegg»' })).toBeInTheDocument();
  });

  describe('lightbox', () => {
    it('opens on a click, preserving the current image, and closes on "Lukk"', async () => {
      const user = userEvent.setup();
      render(<Carousel images={photos(3)} />);

      await user.click(screen.getByRole('button', { name: 'Bilde 2 av 3' }));
      await user.click(screen.getByRole('button', { name: 'Vis «Bilde 2» i full størrelse' }));

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByRole('img', { name: 'Bilde 2' })).toBeInTheDocument();

      await user.click(within(dialog).getByRole('button', { name: 'Lukk' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('pages through images from inside the lightbox with its own arrows and ticks', async () => {
      const user = userEvent.setup();
      render(<Carousel images={photos(3)} />);

      await user.click(screen.getByRole('button', { name: 'Vis «Bilde 1» i full størrelse' }));
      const dialog = screen.getByRole('dialog');

      await user.click(within(dialog).getByRole('button', { name: 'Neste bilde' }));
      expect(within(dialog).getByRole('img', { name: 'Bilde 2' })).toBeInTheDocument();
    });

    it('does not open on a mouse drag across the image', () => {
      render(<Carousel images={photos(3)} />);
      const image = screen.getByRole('button', { name: 'Vis «Bilde 1» i full størrelse' });

      fireEvent.pointerDown(image, { clientX: 200, clientY: 0, pointerType: 'mouse' });
      fireEvent.pointerUp(image, { clientX: 100, clientY: 0, pointerType: 'mouse' });
      fireEvent.click(image);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      // A mouse drag is not read as a swipe at all, so the image did not also page.
      expect(
        within(screen.getByRole('dialog')).getByRole('img', { name: 'Bilde 1' }),
      ).toBeInTheDocument();
    });
  });

  describe('touch swipe', () => {
    it('pages to the next image on a leftward touch drag, without opening the lightbox', () => {
      render(<Carousel images={photos(3)} />);
      const image = screen.getByRole('button', { name: 'Vis «Bilde 1» i full størrelse' });

      fireEvent.pointerDown(image, { clientX: 200, clientY: 0, pointerType: 'touch' });
      fireEvent.pointerUp(image, { clientX: 100, clientY: 0, pointerType: 'touch' });
      fireEvent.click(image);

      expect(screen.getByRole('img', { name: 'Bilde 2' })).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('pages to the previous image on a rightward touch drag', () => {
      render(<Carousel images={photos(3)} />);
      const image = screen.getByRole('button', { name: 'Vis «Bilde 1» i full størrelse' });

      fireEvent.pointerDown(image, { clientX: 100, clientY: 0, pointerType: 'touch' });
      fireEvent.pointerUp(image, { clientX: 200, clientY: 0, pointerType: 'touch' });
      fireEvent.click(image);

      expect(screen.getByRole('img', { name: 'Bilde 3' })).toBeInTheDocument();
    });

    it('ignores a short or mostly-vertical drag, treating it as a tap that opens the lightbox', () => {
      render(<Carousel images={photos(3)} />);
      const image = screen.getByRole('button', { name: 'Vis «Bilde 1» i full størrelse' });

      fireEvent.pointerDown(image, { clientX: 100, clientY: 100, pointerType: 'touch' });
      fireEvent.pointerUp(image, { clientX: 110, clientY: 180, pointerType: 'touch' });
      fireEvent.click(image);

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByRole('img', { name: 'Bilde 1' })).toBeInTheDocument();
    });
  });
});
