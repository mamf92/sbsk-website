import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ImageGallery } from './ImageGallery';

const images = [
  { src: '/hoved.jpg', alt: 'Hovedbilde' },
  { src: '/ekstra-1.jpg', alt: 'Ekstra bilde 1' },
  { src: '/ekstra-2.jpg', alt: 'Ekstra bilde 2' },
];

describe('ImageGallery', () => {
  it('renders nothing for an empty image list', () => {
    const { container } = render(<ImageGallery images={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('displays the first image by default with no thumbnail strip for a single image', () => {
    render(<ImageGallery images={[images[0]]} />);
    expect(screen.getByAltText('Hovedbilde')).toHaveAttribute('src', '/hoved.jpg');
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('swaps the display image when a thumbnail is clicked', async () => {
    render(<ImageGallery images={images} />);

    expect(screen.getByAltText('Hovedbilde')).toHaveAttribute('src', '/hoved.jpg');

    await userEvent.click(screen.getByRole('button', { name: 'Ekstra bilde 2' }));

    expect(screen.getByAltText('Ekstra bilde 2')).toHaveAttribute('src', '/ekstra-2.jpg');
    expect(screen.getByRole('button', { name: 'Ekstra bilde 2' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Hovedbilde' })).toHaveAttribute(
      'aria-current',
      'false',
    );
  });
});
