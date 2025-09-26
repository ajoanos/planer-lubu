import React from 'react';
import { Timeline } from '../admin/types';
import { formatTime } from '../utils/time';

interface PrintLayoutProps {
  timeline: Timeline;
  mode: 'guest' | 'crew';
}

const PrintLayout: React.FC<PrintLayoutProps> = ({ timeline, mode }) => {
  return (
    <div className={`print-layout print-${mode}`}>
      <div className="print-header">
        <h1>Plan dnia {timeline.date}</h1>
        <div className="print-meta">
          <span>Para: {timeline.attendees.filter((a) => a.role === 'Para').map((a) => a.name).join(' & ')}</span>
          <span>Styl: {timeline.style}</span>
        </div>
      </div>
      <div className="print-grid">
        {timeline.events.map((event) => (
          <div key={event.id} className="print-card print-event">
            <div className="time">
              {formatTime(event.start)} – {formatTime(event.end)}
            </div>
            <div className="title">{event.title}</div>
            {mode === 'crew' && <div className="roles">{event.role.join(', ')}</div>}
            {event.notes && <div className="notes">{event.notes}</div>}
            {event.location?.label && <div className="location">{event.location.label}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrintLayout;
