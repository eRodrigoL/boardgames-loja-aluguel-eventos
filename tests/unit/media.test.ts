import { describe, expect, it } from 'vitest';
import { detectImageType, isSafeSvg } from '../../src/modules/media/presentation/media-routes';

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

describe('site branding SVG validation', () => {
  it('accepts a simple SVG document', () => {
    const svg = new TextEncoder().encode(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h10v10H0z" /></svg>',
    );
    expect(isSafeSvg(svg)).toBe(true);
  });

  it('rejects files that are not SVG documents or contain active content', () => {
    expect(isSafeSvg(new TextEncoder().encode('<html></html>'))).toBe(false);
    expect(isSafeSvg(new TextEncoder().encode('<svg><script>alert(1)</script></svg>'))).toBe(false);
    expect(isSafeSvg(new TextEncoder().encode('<svg onload="alert(1)"></svg>'))).toBe(false);
  });
});
