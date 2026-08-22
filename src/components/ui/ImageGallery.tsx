import * as React from 'react';

export type GalleryImage = { src: string; alt: string };

type ImageGalleryProps = {
  images: GalleryImage[];
  className?: string;
};

// A big display image with a thumbnail strip beneath it. Clicking a thumbnail swaps the
// display rather than navigating anywhere, so it's a selection control, not a pressable
// surface — no `lift`/`lift-card` here, just the flat border-and-fill language.
export function ImageGallery({ images, className = '' }: ImageGalleryProps) {
  const [selected, setSelected] = React.useState(0);

  if (images.length === 0) return null;

  const active = images[Math.min(selected, images.length - 1)];

  return (
    <div className={['flex flex-col gap-2', className].join(' ')}>
      <img
        src={active.src}
        alt={active.alt}
        className="block h-auto w-full border border-black object-cover"
      />
      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.src + index}
              type="button"
              aria-current={index === selected}
              aria-label={image.alt || `Bilde ${index + 1}`}
              onClick={() => setSelected(index)}
              className={[
                'focus-visible:outline-focus-ring size-16 flex-none border object-cover focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2',
                index === selected ? 'border-orange border-2' : 'border-black',
              ].join(' ')}
            >
              <img src={image.src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
