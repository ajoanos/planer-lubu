import { parseISO } from '../utils/time.js';
import { getGoldenBlue } from '../utils/goldenHour.js';

/**
 * Zegar kołowy SVG.
 */
export class CircularClock {
  constructor(container) {
    this.container = container;
  }

  /**
   * @param {Timeline} timeline
   */
  render(timeline) {
    const size = 240;
    const radius = 100;
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 240 240');
    svg.setAttribute('class', 'circular-clock');

    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', '120');
    circle.setAttribute('cy', '120');
    circle.setAttribute('r', radius.toString());
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', '#E2E8F0');
    circle.setAttribute('stroke-width', '2');
    svg.appendChild(circle);

    const golden = getGoldenBlue(timeline.date);
    golden.forEach((slot) => {
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', this.arcForSlot(slot.start, slot.end, radius));
      path.setAttribute('stroke', slot.type === 'golden' ? '#FBBF24' : '#60A5FA');
      path.setAttribute('stroke-width', '8');
      path.setAttribute('fill', 'none');
      svg.appendChild(path);
    });

    (timeline.events || []).forEach((event) => {
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', this.arcForSlot(event.start, event.end, radius - 12));
      path.setAttribute('stroke', '#0F172A');
      path.setAttribute('stroke-width', '6');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('class', 'clock-event');
      path.setAttribute('data-title', event.title);
      svg.appendChild(path);
    });

    this.container.innerHTML = '';
    this.container.appendChild(svg);
  }

  arcForSlot(startISO, endISO, radius) {
    let startAngle = this.angleForTime(startISO);
    let endAngle = this.angleForTime(endISO);
    if (endAngle <= startAngle) {
      endAngle += Math.PI * 2;
    }
    const largeArc = endAngle - startAngle <= Math.PI ? 0 : 1;
    const startPoint = this.pointOnCircle(startAngle, radius);
    const endPoint = this.pointOnCircle(endAngle, radius);
    return `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArc} 1 ${endPoint.x} ${endPoint.y}`;
  }

  angleForTime(iso) {
    const date = parseISO(iso);
    const minutes = date.getHours() * 60 + date.getMinutes();
    const ratio = minutes / (24 * 60);
    return ratio * Math.PI * 2 - Math.PI / 2;
  }

  pointOnCircle(angle, radius) {
    const cx = 120;
    const cy = 120;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  }
}
