import React from 'react';

interface DelayControlsProps {
  onDelay: (minutes: number) => void;
}

const DelayControls: React.FC<DelayControlsProps> = ({ onDelay }) => {
  return (
    <div className="alle-live-bar" role="group" aria-label="Sterowanie trybem LIVE">
      <span>Opóźnij przyszłe wydarzenia:</span>
      <div>
        {[5, 15, 30].map((minutes) => (
          <button key={minutes} className="alle-btn" type="button" onClick={() => onDelay(minutes)}>
            +{minutes} min
          </button>
        ))}
      </div>
    </div>
  );
};

export default DelayControls;
