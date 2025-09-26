import React from 'react';
import { TimelineEvent, Role } from '../types';
import { formatTime } from '../../utils/time';

interface EventCardProps {
  event: TimelineEvent;
  onChange: (event: TimelineEvent) => void;
  onDelay: (minutes: number) => void;
  onDelete?: () => void;
  roles: Role[];
  highlight?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ event, onChange, onDelay, onDelete, roles, highlight }) => {
  const handleInput = (key: keyof TimelineEvent, value: any) => {
    onChange({ ...event, [key]: value });
  };

  const toggleRole = (role: Role) => {
    const includes = event.role.includes(role);
    const updated = includes ? event.role.filter((r) => r !== role) : [...event.role, role];
    handleInput('role', updated);
  };

  return (
    <div className={`alle-event-card ${highlight ? 'alle-event-highlight' : ''}`}>
      <div className="alle-flex" style={{ justifyContent: 'space-between' }}>
        <input
          className="alle-event-title"
          value={event.title}
          onChange={(e) => handleInput('title', e.target.value)}
          aria-label="Tytuł wydarzenia"
        />
        {onDelete && (
          <button className="alle-btn secondary" type="button" onClick={onDelete}>
            Usuń
          </button>
        )}
      </div>
      <div className="alle-flex" style={{ marginTop: 12 }}>
        <label>
          <span>Start</span>
          <input type="datetime-local" value={toLocal(event.start)} onChange={(e) => handleInput('start', toIso(e.target.value))} />
        </label>
        <label>
          <span>Koniec</span>
          <input type="datetime-local" value={toLocal(event.end)} onChange={(e) => handleInput('end', toIso(e.target.value))} />
        </label>
      </div>
      <div className="alle-flex" style={{ marginTop: 12, flexWrap: 'wrap' }}>
        {roles.map((role) => (
          <button
            key={role}
            type="button"
            className={`alle-badge ${event.role.includes(role) ? 'active' : ''}`}
            onClick={() => toggleRole(role)}
            aria-pressed={event.role.includes(role)}
          >
            {role}
          </button>
        ))}
      </div>
      <label style={{ display: 'block', marginTop: 12 }}>
        <span>Miejsce</span>
        <input
          value={event.location?.label ?? ''}
          onChange={(e) => handleInput('location', { ...event.location, label: e.target.value })}
        />
      </label>
      <label style={{ display: 'block', marginTop: 12 }}>
        <span>Notatki</span>
        <textarea value={event.notes ?? ''} onChange={(e) => handleInput('notes', e.target.value)} />
      </label>
      <div className="alle-live-bar" style={{ marginTop: 16 }}>
        <div>
          {formatTime(event.start)} – {formatTime(event.end)}
        </div>
        <div>
          {[5, 15, 30].map((m) => (
            <button key={m} className="alle-btn secondary" type="button" onClick={() => onDelay(m)}>
              +{m} min
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

function toLocal(iso: string): string {
  const date = new Date(iso);
  const tzOffset = date.getTimezoneOffset();
  date.setMinutes(date.getMinutes() - tzOffset);
  return date.toISOString().slice(0, 16);
}

function toIso(local: string): string {
  const date = new Date(local);
  return date.toISOString();
}

export default EventCard;
