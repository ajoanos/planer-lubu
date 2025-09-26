/**
 * Aproksymacja złotej i niebieskiej godziny na podstawie prostej formuły.
 * TODO: zastąpić dokładnym algorytmem astronomicznym.
 */

export interface GoldenBlue {
  goldenStart?: string;
  goldenEnd?: string;
  blueStart?: string;
  blueEnd?: string;
}

export function getGoldenBlue(date: string, lat?: number, lng?: number): GoldenBlue {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return {};
  }

  const base = new Date(`${date}T18:00:00Z`);
  const offset = Math.round((lng / 180) * 60);
  base.setMinutes(base.getMinutes() + offset);

  const goldenStart = new Date(base);
  goldenStart.setMinutes(goldenStart.getMinutes() - 45);
  const goldenEnd = new Date(base);
  goldenEnd.setMinutes(goldenEnd.getMinutes() + 30);

  const blueStart = new Date(goldenEnd);
  const blueEnd = new Date(blueStart);
  blueEnd.setMinutes(blueEnd.getMinutes() + 40);

  return {
    goldenStart: goldenStart.toISOString(),
    goldenEnd: goldenEnd.toISOString(),
    blueStart: blueStart.toISOString(),
    blueEnd: blueEnd.toISOString()
  };
}
