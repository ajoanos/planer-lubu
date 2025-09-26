import { estimateDriveMinutes, PRESETS } from '../utils/buffers.js';
import { toISO, addMinutes } from '../utils/time.js';

/**
 * Kreator generujący startowy timeline.
 */
export class Wizard {
  /**
   * @param {HTMLElement} container
   * @param {function(Timeline):void} onComplete
   */
  constructor(container, onComplete) {
    this.container = container;
    this.onComplete = onComplete;
    this.state = {
      ceremonyType: 'kosciol',
      date: new Date().toISOString().slice(0, 10),
      town: 'Leńcze',
      locations: {},
      style: 'standard',
      attendees: [],
    };
    this.step = 1;
    this.render();
  }

  next() {
    if (this.step < 3) {
      this.step++;
      this.render();
    } else {
      this.finish();
    }
  }

  prev() {
    if (this.step > 1) {
      this.step--;
      this.render();
    }
  }

  render() {
    this.container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'wt-card wizard';
    wrapper.innerHTML = `
      <div class="wizard-progress">
        <span class="wizard-step ${this.step === 1 ? 'active' : ''}">1</span>
        <span class="wizard-step ${this.step === 2 ? 'active' : ''}">2</span>
        <span class="wizard-step ${this.step === 3 ? 'active' : ''}">3</span>
      </div>
      <div class="wizard-body"></div>
      <div class="wizard-actions">
        <button type="button" class="wt-btn-secondary" ${this.step === 1 ? 'disabled' : ''} data-action="prev">Wstecz</button>
        <button type="button" class="wt-btn" data-action="next">${this.step === 3 ? 'Generuj timeline' : 'Dalej'}</button>
      </div>
    `;
    const body = wrapper.querySelector('.wizard-body');
    body.appendChild(this.renderStep());
    wrapper.querySelector('[data-action="prev"]').addEventListener('click', () => this.prev());
    wrapper.querySelector('[data-action="next"]').addEventListener('click', () => this.next());
    this.container.appendChild(wrapper);
  }

  renderStep() {
    if (this.step === 1) {
      return this.renderStep1();
    }
    if (this.step === 2) {
      return this.renderStep2();
    }
    return this.renderStep3();
  }

  renderStep1() {
    const div = document.createElement('div');
    div.className = 'wizard-grid';
    div.innerHTML = `
      <label class="wt-label">
        <span>Typ ceremonii</span>
        <select class="wt-input" data-field="ceremonyType">
          <option value="kosciol">Kościelna</option>
          <option value="cywilny">Cywilna</option>
          <option value="plener">Plenerowa</option>
        </select>
      </label>
      <label class="wt-label">
        <span>Data</span>
        <input type="date" class="wt-input" data-field="date" value="${this.state.date}">
      </label>
      <label class="wt-label">
        <span>Miejscowość</span>
        <input type="text" class="wt-input" data-field="town" value="${this.state.town}">
      </label>
    `;
    div.querySelector('[data-field="ceremonyType"]').value = this.state.ceremonyType;
    div.querySelectorAll('.wt-input').forEach((input) => {
      input.addEventListener('input', (event) => {
        const target = event.target;
        this.state[target.dataset.field] = target.value;
      });
    });
    return div;
  }

  renderStep2() {
    const div = document.createElement('div');
    div.className = 'wizard-grid';
    const fields = [
      { key: 'gettingReady', label: 'Przygotowania' },
      { key: 'ceremony', label: 'Ceremonia' },
      { key: 'portrait', label: 'Plener' },
      { key: 'reception', label: 'Sala weselna' },
    ];
    fields.forEach((field) => {
      const value = this.state.locations[field.key] || { label: '', address: '', km: '' };
      const block = document.createElement('div');
      block.className = 'wizard-block';
      block.innerHTML = `
        <h3>${field.label}</h3>
        <input class="wt-input" data-field="label" placeholder="Nazwa" value="${value.label || ''}">
        <input class="wt-input" data-field="address" placeholder="Adres" value="${value.address || ''}">
        <input class="wt-input" data-field="km" type="number" min="0" step="0.5" placeholder="km" value="${value.km || ''}">
      `;
      block.querySelectorAll('.wt-input').forEach((input) => {
        input.addEventListener('input', () => {
          const rawValue = input.type === 'number' ? parseFloat(input.value) : input.value;
          this.state.locations[field.key] = {
            ...this.state.locations[field.key],
            [input.dataset.field]: input.type === 'number' && input.value === '' ? undefined : rawValue,
          };
        });
      });
      div.appendChild(block);
    });
    return div;
  }

  renderStep3() {
    const div = document.createElement('div');
    div.className = 'wizard-grid';
    div.innerHTML = `
      <label class="wt-label">
        <span>Styl dnia</span>
        <select class="wt-input" data-field="style">
          <option value="slow">Slow</option>
          <option value="standard">Standard</option>
          <option value="dynamic">Dynamic</option>
        </select>
      </label>
      <label class="wt-label">
        <span>Dostawcy (Foto/Wideo/MUAH/DJ)</span>
        <textarea class="wt-input" data-field="vendors" placeholder="Imię, rola (po jednej w linii)"></textarea>
      </label>
    `;
    const select = div.querySelector('select');
    select.value = this.state.style;
    select.addEventListener('change', (event) => {
      this.state.style = event.target.value;
    });
    const textarea = div.querySelector('textarea');
    textarea.addEventListener('input', (event) => {
      const lines = event.target.value.split('\n').map((line) => line.trim()).filter(Boolean);
      this.state.attendees = lines.map((line) => {
        const [name, role] = line.split(',').map((part) => part.trim());
        return { name, role: role || 'Inne' };
      });
    });
    return div;
  }

  finish() {
    const timeline = this.generateTimeline();
    this.onComplete(timeline);
  }

  generateTimeline() {
    const date = this.state.date;
    const base = new Date(`${date}T07:00:00+02:00`);
    const events = [];
    const pushEvent = (title, start, end, roles = ['Para'], extras = {}) => {
      events.push({
        id: `evt-${Math.random().toString(36).slice(2, 8)}`,
        title,
        start: toISO(start),
        end: toISO(end),
        role: roles,
        ...extras,
      });
    };

    const makeupEnd = addMinutes(base, 180);
    pushEvent('Makijaż i fryzura', base, makeupEnd, ['Para', 'MUAH']);
    const firstLookStart = addMinutes(makeupEnd, -PRESETS.firstLook);
    pushEvent('First look', firstLookStart, makeupEnd, ['Para', 'Foto', 'Wideo']);

    const driveToChurch = estimateDriveMinutes(this.state.locations.ceremony?.km || 4, this.state.style);
    const ceremonyStart = addMinutes(makeupEnd, 30);
    const ceremonyEnd = addMinutes(ceremonyStart, this.state.ceremonyType === 'cywilny' ? PRESETS.civil : PRESETS.church);
    pushEvent('Ceremonia', ceremonyStart, ceremonyEnd, ['Para', 'Goscie', 'Foto', 'Wideo'], { fixed: true });

    const receptionStart = addMinutes(ceremonyEnd, driveToChurch + 30);
    const receptionEnd = addMinutes(receptionStart, 120);
    pushEvent('Przyjęcie weselne', receptionStart, receptionEnd, ['Para', 'Goscie', 'DJ']);

    return {
      id: `tl-${Date.now()}`,
      title: `Timeline ${this.state.town || 'Ślub'}`,
      date,
      ceremonyType: this.state.ceremonyType,
      style: this.state.style,
      baseLocations: this.state.locations,
      attendees: this.state.attendees,
      events,
    };
  }
}
