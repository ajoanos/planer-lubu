import React, { useState } from 'react';
import { Timeline } from '../types';
import { parseISO } from '../../utils/time';

interface WizardProps {
  timeline: Timeline | null;
  onGenerate: (data: Partial<Timeline>) => void;
  onLoadDemo: () => void;
}

interface StepState {
  ceremonyType: Timeline['ceremonyType'];
  date: string;
  city: string;
  style: Timeline['style'];
  rigidTimes: { ceremony: string; dinner: string };
  buffers: { familyGroups: number; portraitKm: number };
}

const initialState: StepState = {
  ceremonyType: 'kosciol',
  date: new Date().toISOString().slice(0, 10),
  city: 'Kraków',
  style: 'standard',
  rigidTimes: { ceremony: '15:00', dinner: '18:00' },
  buffers: { familyGroups: 12, portraitKm: 6 }
};

const Wizard: React.FC<WizardProps> = ({ onGenerate, onLoadDemo }) => {
  const [step, setStep] = useState(1);
  const [state, setState] = useState(initialState);

  const next = () => setStep((s) => Math.min(3, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = () => {
    const ceremonyStart = parseISO(state.date, state.rigidTimes.ceremony);
    const dinnerStart = parseISO(state.date, state.rigidTimes.dinner);

    onGenerate({
      ceremonyType: state.ceremonyType,
      style: state.style,
      date: state.date,
      baseLocations: {
        ceremony: { label: 'Kościół św. Anny', address: state.city },
        reception: { label: 'Oaza Leńcze – sala', address: 'Leńcze' }
      },
      events: [
        {
          id: 'ceremony',
          title: 'Ceremonia',
          role: ['Para', 'Goście', 'Foto', 'Wideo'],
          start: ceremonyStart,
          end: parseISO(state.date, addMinutesString(state.rigidTimes.ceremony, 1.5)),
          fixed: true,
          location: { label: 'Kościół św. Anny', address: state.city }
        },
        {
          id: 'family',
          title: 'Zdjęcia rodzinne',
          role: ['Para', 'Foto', 'Wideo'],
          start: parseISO(state.date, addMinutesString(state.rigidTimes.ceremony, 1.8)),
          end: parseISO(state.date, addMinutesString(state.rigidTimes.ceremony, 2.5)),
          notes: `Grupy: ${state.buffers.familyGroups}`
        },
        {
          id: 'dinner',
          title: 'Obiad',
          role: ['Goście', 'DJ'],
          start: dinnerStart,
          end: parseISO(state.date, addMinutesString(state.rigidTimes.dinner, 1.0)),
          fixed: true,
          location: { label: 'Oaza Leńcze – sala' }
        }
      ]
    });
  };

  return (
    <div className="alle-card">
      <div className="alle-flex" style={{ justifyContent: 'space-between' }}>
        <div className="alle-badge">Krok {step} / 3</div>
        <div>
          <button className="alle-btn secondary" onClick={onLoadDemo} type="button">
            Załaduj demo
          </button>
        </div>
      </div>

      {step === 1 && (
        <div className="alle-grid">
          <label>
            <span>Data ślubu</span>
            <input
              type="date"
              value={state.date}
              onChange={(e) => setState((s) => ({ ...s, date: e.target.value }))}
            />
          </label>
          <label>
            <span>Miejscowość</span>
            <input value={state.city} onChange={(e) => setState((s) => ({ ...s, city: e.target.value }))} />
          </label>
          <label>
            <span>Typ ceremonii</span>
            <select
              value={state.ceremonyType}
              onChange={(e) => setState((s) => ({ ...s, ceremonyType: e.target.value as StepState['ceremonyType'] }))}
            >
              <option value="kosciol">Kościelna</option>
              <option value="cywilny">Cywilna</option>
              <option value="plener">Plener</option>
            </select>
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="alle-grid">
          <label>
            <span>Godzina ceremonii</span>
            <input
              type="time"
              value={state.rigidTimes.ceremony}
              onChange={(e) => setState((s) => ({ ...s, rigidTimes: { ...s.rigidTimes, ceremony: e.target.value } }))}
            />
          </label>
          <label>
            <span>Godzina obiadu</span>
            <input
              type="time"
              value={state.rigidTimes.dinner}
              onChange={(e) => setState((s) => ({ ...s, rigidTimes: { ...s.rigidTimes, dinner: e.target.value } }))}
            />
          </label>
          <label>
            <span>Liczba grup do zdjęć rodzinnych</span>
            <input
              type="number"
              value={state.buffers.familyGroups}
              onChange={(e) =>
                setState((s) => ({ ...s, buffers: { ...s.buffers, familyGroups: Number(e.target.value) } }))
              }
            />
          </label>
        </div>
      )}

      {step === 3 && (
        <div className="alle-grid">
          <label>
            <span>Styl dnia</span>
            <select
              value={state.style}
              onChange={(e) => setState((s) => ({ ...s, style: e.target.value as StepState['style'] }))}
            >
              <option value="slow">Slow</option>
              <option value="standard">Standard</option>
              <option value="dynamic">Dynamic</option>
            </select>
          </label>
          <div className="alle-warning">
            <strong>Podsumowanie:</strong>
            <p>Typ ceremonii: {state.ceremonyType}</p>
            <p>Data: {state.date}</p>
            <p>Styl: {state.style}</p>
          </div>
        </div>
      )}

      <div className="alle-flex" style={{ justifyContent: 'space-between', marginTop: 24 }}>
        <button className="alle-btn secondary" onClick={prev} type="button" disabled={step === 1}>
          Wstecz
        </button>
        {step < 3 ? (
          <button className="alle-btn" onClick={next} type="button">
            Dalej
          </button>
        ) : (
          <button className="alle-btn" onClick={handleSubmit} type="button">
            Generuj timeline
          </button>
        )}
      </div>
    </div>
  );
};

function addMinutesString(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = Math.round(hours * 60);
  const date = new Date();
  date.setHours(h, m + totalMinutes, 0, 0);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default Wizard;
