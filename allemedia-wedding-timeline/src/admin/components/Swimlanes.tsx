import React from 'react';
import { TimelineEvent, Role } from '../types';
import { formatTime } from '../../utils/time';

interface SwimlanesProps {
  events: TimelineEvent[];
  roles: Role[];
}

const Swimlanes: React.FC<SwimlanesProps> = ({ events, roles }) => {
  const roleEvents = roles.map((role) => ({
    role,
    events: events.filter((event) => event.role.includes(role))
  }));

  return (
    <div className="alle-swimlanes">
      {roleEvents.map((lane) => (
        <div key={lane.role} className="alle-swimlane">
          <div className="alle-swimlane-header">{lane.role}</div>
          <div className="alle-swimlane-body">
            {lane.events.map((event) => (
              <div key={event.id} className="alle-swimlane-event">
                <span className="time">{formatTime(event.start)}</span>
                <strong>{event.title}</strong>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Swimlanes;
