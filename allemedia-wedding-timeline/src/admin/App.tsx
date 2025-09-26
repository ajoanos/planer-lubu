import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Wizard from './components/Wizard';
import TimelineEditor from './components/TimelineEditor';
import Comments from './components/Comments';
import { Timeline, TimelineEvent } from './types';
import { getGoldenBlue } from '../utils/goldenHour';
import { buildIcs } from '../utils/ics';

declare global {
  interface Window {
    AllemediaWT: {
      root: string;
      nonce: string;
      assetsUrl: string;
      printCss: string;
    };
  }
}

const App: React.FC = () => {
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const golden = useMemo(() => {
    if (!timeline) return undefined;
    const location = timeline.baseLocations?.portrait || timeline.baseLocations?.reception;
    return getGoldenBlue(timeline.date, location?.lat, location?.lng);
  }, [timeline]);

  const createTimeline = async (payload: Partial<Timeline>, demo = false) => {
    setLoading(true);
    try {
      const response = await fetch(`${window.AllemediaWT.root}timelines`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': window.AllemediaWT.nonce
        },
        body: JSON.stringify({ title: `Harmonogram ${payload.date ?? ''}`, date: payload.date, demo })
      });
      const data: Timeline = await response.json();
      const merged = { ...data, ...payload, events: payload.events ?? data.events } as Timeline;
      await saveTimeline(merged, true);
      setStatus('Utworzono nowy harmonogram.');
    } catch (error) {
      console.error(error);
      setStatus('Błąd tworzenia harmonogramu.');
    } finally {
      setLoading(false);
    }
  };

  const saveTimeline = async (payload: Timeline, updateState = true) => {
    setLoading(true);
    try {
      const response = await fetch(`${window.AllemediaWT.root}timelines/${payload.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': window.AllemediaWT.nonce
        },
        body: JSON.stringify(payload)
      });
      const data: Timeline = await response.json();
      if (updateState) {
        setTimeline(data);
      }
      setStatus('Zapisano zmiany.');
    } catch (error) {
      console.error(error);
      setStatus('Błąd zapisu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelayGlobal = (minutes: number) => {
    if (!timeline) return;
    const updatedEvents = timeline.events.map((event) => ({
      ...event,
      start: new Date(new Date(event.start).getTime() + minutes * 60000).toISOString(),
      end: new Date(new Date(event.end).getTime() + minutes * 60000).toISOString()
    }));
    const updated: Timeline = { ...timeline, events: updatedEvents, lastUpdated: new Date().toISOString() };
    setTimeline(updated);
    saveTimeline(updated);
  };

  const handleComments = async (author: string, comment: string) => {
    if (!timeline?.publicId) return;
    try {
      const response = await fetch(`${window.AllemediaWT.root}public/${timeline.publicId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ author, comment, pin: timeline.pin })
      });
      const comments = await response.json();
      setTimeline({ ...timeline, comments });
    } catch (error) {
      console.error(error);
    }
  };

  const exportIcs = async () => {
    if (!timeline) return;
    try {
      const response = await fetch(`${window.AllemediaWT.root}timelines/${timeline.id}/export/ics`, {
        method: 'POST',
        headers: { 'X-WP-Nonce': window.AllemediaWT.nonce }
      });
      const { ics } = await response.json();
      const blob = new Blob([Uint8Array.from(atob(ics), (c) => c.charCodeAt(0))], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      download(url, `wedding-timeline-${timeline.id}.ics`);
    } catch (error) {
      console.error('Błąd eksportu ICS, generuję po stronie klienta.', error);
      const fallback = buildIcs(timeline);
      const blob = new Blob([fallback], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      download(url, `wedding-timeline-${timeline?.id}.ics`);
    }
  };

  const handleWizardGenerate = (partial: Partial<Timeline>) => {
    if (!timeline) {
      createTimeline(partial, false);
    } else {
      const merged = { ...timeline, ...partial, events: mergeEvents(timeline.events, partial.events ?? []) };
      saveTimeline(merged, true);
    }
  };

  const mergeEvents = (current: TimelineEvent[], incoming: TimelineEvent[]): TimelineEvent[] => {
    const mapped: Record<string, TimelineEvent> = {};
    current.forEach((event) => {
      mapped[event.id] = event;
    });
    incoming.forEach((event) => {
      mapped[event.id] = event;
    });
    return Object.values(mapped);
  };

  const qrSvg = useMemo(() => (timeline?.publicId ? buildPseudoQr(`${window.location.origin}?t=${timeline.publicId}`) : ''), [
    timeline?.publicId
  ]);

  return (
    <div>
      {status && <div className="alle-card alle-warning">{status}</div>}
      <Wizard timeline={timeline} onGenerate={handleWizardGenerate} onLoadDemo={() => createTimeline({}, true)} />
      {timeline && (
        <div className="alle-grid">
          <div className="alle-card">
            <div className="alle-flex" style={{ justifyContent: 'space-between' }}>
              <div>
                <h2>Harmonogram dnia</h2>
                <p>Publiczny link: {window.location.origin}?t={timeline.publicId}</p>
                <p>PIN do komentarzy: {timeline.pin}</p>
              </div>
              <div>
                <button className="alle-btn" type="button" onClick={exportIcs} disabled={loading}>
                  Eksportuj ICS
                </button>
              </div>
            </div>
            {qrSvg && <div dangerouslySetInnerHTML={{ __html: qrSvg }} />}
            <TimelineEditor
              timeline={timeline}
              onChange={(events) => {
                const updated = { ...timeline, events };
                setTimeline(updated);
                saveTimeline(updated, true);
              }}
              onDelayGlobal={handleDelayGlobal}
              golden={golden}
            />
            <div style={{ textAlign: 'right', fontSize: 12 }}>Zaktualizowano: {timeline.lastUpdated}</div>
          </div>
          <Comments comments={timeline.comments ?? []} onAdd={handleComments} pin={timeline.pin} />
        </div>
      )}
    </div>
  );
};

function download(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
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
  root.render(<App />);
}
