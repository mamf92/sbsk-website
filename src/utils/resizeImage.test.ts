import { describe, expect, it } from 'vitest';
import { checkPhotoFile, fitWithin, PhotoRejectedError, resizeImage } from './resizeImage';

describe('fitWithin', () => {
  it('scales the long edge down to 512 and keeps the ratio', () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 512, height: 384 });
    expect(fitWithin(1000, 2000)).toEqual({ width: 256, height: 512 });
  });

  it('never scales a small image up', () => {
    expect(fitWithin(200, 100)).toEqual({ width: 200, height: 100 });
  });
});

describe('checkPhotoFile', () => {
  it('refuses a file that is not an image', () => {
    const pdf = new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' });
    expect(() => checkPhotoFile(pdf)).toThrow(PhotoRejectedError);
  });

  it('refuses an SVG, which can carry script', () => {
    const svg = new File(['<svg/>'], 'a.svg', { type: 'image/svg+xml' });
    expect(() => checkPhotoFile(svg)).toThrow(PhotoRejectedError);
  });

  it('accepts a phone photo', () => {
    expect(() => checkPhotoFile(new File(['x'], 'a.jpg', { type: 'image/jpeg' }))).not.toThrow();
  });

  it('refuses a non-image before decoding it', async () => {
    await expect(resizeImage(new File(['x'], 'a.txt', { type: 'text/plain' }))).rejects.toThrow(
      PhotoRejectedError,
    );
  });
});
