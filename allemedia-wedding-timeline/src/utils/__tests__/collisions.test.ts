import { describe, expect, it } from 'vitest';
import { applyDelay, hasOverlap, suggestShift } from '../collisions';
import { TimelineEvent } from '../../admin/types';

const base = (id: string, start: string, end: string): TimelineEvent => ({
  id,
  title: id,
  role: ['Para'],
  start,
  end
});

describe('collisions', () => {
  it('detects overlaps', () => {
    const a = base('a', '2024-01-01T10:00:00.000Z', '2024-01-01T11:00:00.000Z');
    const b = base('b', '2024-01-01T10:30:00.000Z', '2024-01-01T11:30:00.000Z');
    expect(hasOverlap(a, b)).toBe(true);
  });

  it('suggests shift to remove overlap', () => {
    const a = base('a', '2024-01-01T10:00:00.000Z', '2024-01-01T11:00:00.000Z');
    const b = base('b', '2024-01-01T10:30:00.000Z', '2024-01-01T11:30:00.000Z');
    const shifted = suggestShift([a, b], 'a');
    expect(new Date(shifted[1].start).getTime()).toBeGreaterThan(new Date(a.end).getTime());
  });

  it('apply delay cascades', () => {
    const a = base('a', '2024-01-01T10:00:00.000Z', '2024-01-01T10:30:00.000Z');
    const b = base('b', '2024-01-01T10:30:00.000Z', '2024-01-01T11:00:00.000Z');
    const delayed = applyDelay([a, b], 'a', 15);
    expect(delayed[1].start).not.toEqual(b.start);
  });
});
