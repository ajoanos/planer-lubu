import { describe, expect, it } from 'vitest';
import { estimateDriveMinutes, familyPhotosMinutes } from '../buffers';

describe('buffers', () => {
  it('estimate drive minutes respects style', () => {
    expect(estimateDriveMinutes(10, 'slow')).toBeGreaterThan(estimateDriveMinutes(10, 'dynamic'));
  });

  it('family photo rounding', () => {
    expect(familyPhotosMinutes(3)).toBe(5);
    expect(familyPhotosMinutes(10)).toBe(15);
  });
});
