import React from 'react';
import { TimelineEvent } from '../types';
import { GoldenBlue } from '../../utils/goldenHour';
import { diffInMinutes } from '../../utils/time';

interface CircularClockProps {
  events: TimelineEvent[];
  golden?: GoldenBlue;
}

const TOTAL_MINUTES = 12 * 60;

const CircularClock: React.FC<CircularClockProps> = ({ events, golden }) => {
  const arcs = events.map((event) => {
    const start = minutesFromNoon(event.start);
    const duration = diffInMinutes(event.start, event.end);
    return { start, duration, title: event.title };
  });

  return (
    <svg viewBox="0 0 200 200" className="alle-clock" aria-label="Zegar kołowy dnia">
      <circle cx="100" cy="100" r="95" fill="#fff" stroke="#e5e7eb" strokeWidth="2" />
      {arcs.map((arc, index) => (
        <path key={index} d={describeArc(100, 100, 80, arc.start, arc.start + arc.duration)} fill="none" stroke="#4f46e5" strokeWidth="14" strokeLinecap="round" />
      ))}
      {golden?.goldenStart && golden?.goldenEnd && (
        <path
          d={describeArc(100, 100, 70, minutesFromNoon(golden.goldenStart), minutesFromNoon(golden.goldenEnd))}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="10"
          strokeLinecap="round"
        />
      )}
      {golden?.blueStart && golden?.blueEnd && (
        <path
          d={describeArc(100, 100, 60, minutesFromNoon(golden.blueStart), minutesFromNoon(golden.blueEnd))}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="10"
          strokeLinecap="round"
        />
      )}
      <text x="100" y="100" textAnchor="middle" fontSize="18" fill="#1f2937">
        12 – 24
      </text>
    </svg>
  );
};

function minutesFromNoon(iso: string): number {
  const date = new Date(iso);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return ((hours - 12) * 60 + minutes + TOTAL_MINUTES) % TOTAL_MINUTES;
}

function polarToCartesian(centerX: number, centerY: number, radius: number, minutes: number) {
  const angleInRadians = ((minutes / TOTAL_MINUTES) * 360 - 90) * (Math.PI / 180);
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}

function describeArc(x: number, y: number, radius: number, start: number, end: number): string {
  const startCoord = polarToCartesian(x, y, radius, end);
  const endCoord = polarToCartesian(x, y, radius, start);
  const largeArcFlag = end - start <= TOTAL_MINUTES / 2 ? '0' : '1';
  return ['M', startCoord.x, startCoord.y, 'A', radius, radius, 0, largeArcFlag, 0, endCoord.x, endCoord.y].join(' ');
}

export default CircularClock;
