/**
 * Profile photos are re-encoded in the browser before upload (phase 3 decision 12): drawing
 * the decoded image onto a canvas and encoding it again keeps only the pixels, so EXIF —
 * including GPS coordinates from a phone camera — never leaves the device. It also keeps
 * storage small: at most 512 × 512.
 */
export const MAX_PHOTO_EDGE = 512;
/** Larger originals are refused before decoding; the re-encoded file is far smaller. */
export const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
/**
 * What the picker offers and what is accepted, in one list. No HEIC: only Safari can decode it
 * in a canvas, and iPhones already hand a JPEG to the web picker. No SVG: it can carry script.
 */
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

export class PhotoRejectedError extends Error {
  readonly reason: 'type' | 'size' | 'decode';
  constructor(reason: 'type' | 'size' | 'decode') {
    super(`photo_rejected_${reason}`);
    this.reason = reason;
    this.name = 'PhotoRejectedError';
  }
}

/** Scales `width × height` down to fit inside `max × max`, never up. */
export function fitWithin(
  width: number,
  height: number,
  max = MAX_PHOTO_EDGE,
): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** Checks a picked file before any decoding work. */
export function checkPhotoFile(file: File): void {
  if (!PHOTO_TYPES.includes(file.type)) throw new PhotoRejectedError('type');
  if (file.size > MAX_SOURCE_BYTES) throw new PhotoRejectedError('size');
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Re-encodes `file` as WebP (JPEG where the browser cannot write WebP), EXIF-free. */
export async function resizeImage(file: File): Promise<Blob> {
  checkPhotoFile(file);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new PhotoRejectedError('decode');
  }
  const size = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext('2d');
  if (!context) throw new PhotoRejectedError('decode');
  // White under transparent pixels: the JPEG fallback (Safari cannot write WebP) has no alpha
  // channel and would otherwise turn them black.
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, size.width, size.height);
  context.drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close();

  const webp = await toBlob(canvas, 'image/webp', 0.85);
  if (webp && webp.type === 'image/webp') return webp;
  const jpeg = await toBlob(canvas, 'image/jpeg', 0.85);
  if (!jpeg) throw new PhotoRejectedError('decode');
  return jpeg;
}
