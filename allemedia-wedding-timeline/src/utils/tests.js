import { estimateDriveMinutes, familyPhotosMinutes } from './buffers.js';
import { hasOverlap, applyDelay } from './collisions.js';

/**
 * Proste testy konsolowe.
 */
export function runTests() {
  console.group('Allemedia WT tests');
  console.assert(estimateDriveMinutes(10, 'standard') >= 15, 'Dojazd minimalny 15+');
  console.assert(familyPhotosMinutes(10) === 15, 'Zdjęcia rodzinne 15 min');

  const events = [
    { id: 'a', start: '2024-01-01T10:00:00+02:00', end: '2024-01-01T11:00:00+02:00', fixed: false },
    { id: 'b', start: '2024-01-01T11:00:00+02:00', end: '2024-01-01T12:00:00+02:00', fixed: false },
  ];
  const delayed = applyDelay(events, 'a', 15);
  console.assert(delayed[0].start !== events[0].start, 'Opóźnienie zmienia start');
  console.assert(!hasOverlap(events[0], events[1]), 'Brak kolizji stycznych');
  console.groupEnd();
}
