import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Timeline } from '../admin/types';
import Comments from '../admin/components/Comments';
import PrintLayout from './PrintLayout';
import { formatTime } from '../utils/time';
import { buildIcs } from '../utils/ics';

declare global {
  interface Window {
    AllemediaWT: {
      root: string;
      nonce: string;
      printCss: string;
    };
  }
}

const PublicView: React.FC = () => {
  const container = document.getElementById('allemedia-wt-root');
  const dataset = container?.parentElement?.dataset || {};
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [mode, setMode] = useState<'guest' | 'crew'>((dataset.print as 'guest' | 'crew') || 'guest');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const publicId = params.get('t');
    const id = dataset.id;
    const endpoint = publicId ? `${window.AllemediaWT.root}public/${publicId}` : `${window.AllemediaWT.root}timelines/${id}`;
    fetch(endpoint, {
      headers: publicId
        ? {}
        : {
            'X-WP-Nonce': window.AllemediaWT.nonce
          }
    })
      .then((res) => res.json())
      .then((data) => setTimeline(data));
  }, [dataset.id]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      setTimeline((prev) => (prev ? { ...prev, comments: detail } : prev));
    };
    window.addEventListener('allemedia-wt-comments', handler as EventListener);
    return () => {
      window.removeEventListener('allemedia-wt-comments', handler as EventListener);
    };
  }, []);

  const qrSvg = useMemo(() => (timeline?.publicId ? buildPseudoQr(`${window.location.origin}?t=${timeline.publicId}`) : ''), [
    timeline?.publicId
  ]);

  const print = (variant: 'guest' | 'crew') => {
    setMode(variant);
    document.body.classList.add('print-allemedia');
    const css = document.querySelector(`link[href="${window.AllemediaWT.printCss}"]`) as HTMLLinkElement;
    if (css) css.media = 'all';
    setTimeout(() => window.print(), 100);
  };

  const exportIcs = () => {
    if (!timeline) return;
    const ics = buildIcs(timeline);
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wedding-timeline-${timeline.id}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!timeline) {
    return <p>Ładowanie planu...</p>;
  }

  return (
    <div className="alle-card">
      <div className="alle-flex" style={{ justifyContent: 'space-between' }}>
        <div>
          <h2>Plan dnia {timeline.date}</h2>
          <p>Publiczny link: {window.location.origin}?t={timeline.publicId}</p>
        </div>
        <div>
          <button className="alle-btn" onClick={exportIcs} type="button">
            Pobierz ICS
          </button>
          <button className="alle-btn secondary" onClick={() => print('guest')} type="button">
            Drukuj (Goście)
          </button>
          <button className="alle-btn secondary" onClick={() => print('crew')} type="button">
            Drukuj (Ekipa)
          </button>
        </div>
      </div>
      {qrSvg && <div dangerouslySetInnerHTML={{ __html: qrSvg }} />}
      <div className="alle-timeline-column">
        {timeline.events.map((event) => (
          <div key={event.id} className="alle-event-card">
            <div className="alle-event-time">
              {formatTime(event.start)} – {formatTime(event.end)}
            </div>
            <h3>{event.title}</h3>
            {event.location?.label && <p>Miejsce: {event.location.label}</p>}
            {event.notes && <p>{event.notes}</p>}
          </div>
        ))}
      </div>
      <Comments comments={timeline.comments ?? []} onAdd={(author, comment, pin) => addComment(timeline, author, comment, pin)} readonly={false} />
      <div style={{ display: 'none' }}>
        <PrintLayout timeline={timeline} mode={mode} />
      </div>
    </div>
  );
};

function addComment(timeline: Timeline, author: string, comment: string, pin?: string) {
  fetch(`${window.AllemediaWT.root}public/${timeline.publicId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author, comment, pin })
  })
    .then((res) => res.json())
    .then((comments) => {
      const event = new CustomEvent('allemedia-wt-comments', { detail: comments });
      window.dispatchEvent(event);
    });
}

function buildPseudoQr(text: string): string {
  const hashBuffer = new TextEncoder().encode(text);
  let hash = '';
  hashBuffer.forEach((byte) => {
    hash += byte.toString(16).padStart(2, '0');
  });
  const grid = 21;
  const module = 6;
  let rects = '';
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const index = (y * grid + x) % hash.length;
      let bit = parseInt(hash[index], 16) % 2 === 0;
      if (isFinder(x, y, grid)) {
        bit = true;
      }
      if (bit) {
        rects += `<rect x="${x * module}" y="${y * module}" width="${module}" height="${module}" />`;
      }
    }
  }
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${grid * module} ${grid * module}' fill='black' shape-rendering='crispEdges'><rect width='100%' height='100%' fill='white'/>${rects}</svg>`;
}

function isFinder(x: number, y: number, grid: number): boolean {
  const patterns: Array<[number, number]> = [
    [0, 0],
    [grid - 7, 0],
    [0, grid - 7]
  ];
  return patterns.some(([px, py]) => {
    if (x >= px && x < px + 7 && y >= py && y < py + 7) {
      if (x === px || x === px + 6 || y === py || y === py + 6) return true;
      if (x >= px + 2 && x <= px + 4 && y >= py + 2 && y <= py + 4) return true;
    }
    return false;
  });
}

const container = document.getElementById('allemedia-wt-root');
if (container) {
  const root = createRoot(container);
  root.render(<PublicView />);
}
