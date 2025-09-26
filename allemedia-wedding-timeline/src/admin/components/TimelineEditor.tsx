import React from 'react';
import { Timeline, TimelineEvent, Role } from '../types';
import EventCard from './EventCard';
import Swimlanes from './Swimlanes';
import CircularClock from './CircularClock';
import DelayControls from './DelayControls';
import { applyDelay, suggestShift } from '../../utils/collisions';
import { GoldenBlue } from '../../utils/goldenHour';

interface TimelineEditorProps {
  timeline: Timeline;
  onChange: (events: TimelineEvent[]) => void;
  onDelayGlobal: (minutes: number) => void;
  golden?: GoldenBlue;
}

const ALL_ROLES: Role[] = ['Para', 'Foto', 'Wideo', 'MUAH', 'DJ', 'Goscie', 'Inne'];

const TimelineEditor: React.FC<TimelineEditorProps> = ({ timeline, onChange, onDelayGlobal, golden }) => {
  const updateEvent = (updated: TimelineEvent) => {
    const events = timeline.events.map((event) => (event.id === updated.id ? updated : event));
    onChange(suggestShift(events, updated.id));
  };

  const deleteEvent = (id: string) => {
    onChange(timeline.events.filter((event) => event.id !== id));
  };

  const delayEvent = (id: string, minutes: number) => {
    const delayed = applyDelay(timeline.events, id, minutes);
    onChange(delayed);
  };

  return (
    <div className="alle-flex" style={{ alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        {timeline.events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onChange={updateEvent}
            onDelay={(minutes) => delayEvent(event.id, minutes)}
            onDelete={() => deleteEvent(event.id)}
            roles={ALL_ROLES}
          />
        ))}
        <DelayControls onDelay={onDelayGlobal} />
      </div>
      <div style={{ flex: '0 0 320px' }}>
        <div className="alle-card">
          <h2>Zegar dnia</h2>
          <CircularClock events={timeline.events} golden={golden} />
        </div>
        <div className="alle-card">
          <h2>Swimlane'y ról</h2>
          <Swimlanes events={timeline.events} roles={ALL_ROLES} />
        </div>
      </div>
    </div>
  );
};

export default TimelineEditor;
