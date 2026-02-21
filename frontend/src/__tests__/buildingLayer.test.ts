import { describe, it, expect } from 'vitest';
import { heightToColor } from '../layers/buildingLayer';
import { HEIGHT_COLOR_SCALE } from '../utils/constants';

describe('heightToColor', () => {
  it('returns first colour for height 0', () => {
    const color = heightToColor(0, HEIGHT_COLOR_SCALE);
    expect(color).toEqual(HEIGHT_COLOR_SCALE[0][1]);
  });

  it('returns last colour for very tall buildings', () => {
    const color = heightToColor(999, HEIGHT_COLOR_SCALE);
    expect(color).toEqual(HEIGHT_COLOR_SCALE[HEIGHT_COLOR_SCALE.length - 1][1]);
  });

  it('interpolates between scale breakpoints', () => {
    const color = heightToColor(5, HEIGHT_COLOR_SCALE);
    // Should be between [0] and [10] breakpoints
    expect(color).toHaveLength(4);
    expect(color[3]).toBeGreaterThan(0); // alpha > 0
  });

  it('returns RGBA tuple with 4 elements', () => {
    const color = heightToColor(50, HEIGHT_COLOR_SCALE);
    expect(color).toHaveLength(4);
    color.forEach((c) => {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(255);
    });
  });
});
