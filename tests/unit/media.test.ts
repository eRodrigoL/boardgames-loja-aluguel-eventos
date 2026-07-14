import { describe, expect, it } from 'vitest';
import { detectImageType } from '../../src/modules/media/presentation/media-routes';

describe('image signature detection', () => {
  it('detects the three accepted formats', () => {
    expect(detectImageType(new Uint8Array([0xff, 0xd8, 0xff]))).toBe('image/jpeg');
    expect(detectImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10]))).toBe(
      'image/png',
    );
    expect(detectImageType(new TextEncoder().encode('RIFFxxxxWEBP'))).toBe('image/webp');
  });
  it('rejects unknown file bytes', () =>
    expect(detectImageType(new Uint8Array([1, 2, 3]))).toBeUndefined());
});
