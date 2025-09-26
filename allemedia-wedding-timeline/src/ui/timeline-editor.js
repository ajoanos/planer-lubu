import { compareISO, addMinutes, toISO, formatHM } from '../utils/time.js';
import { hasOverlap, applyDelay } from '../utils/collisions.js';
import { CircularClock } from './circular-clock.js';
import { Swimlanes } from './swimlanes.js';
import { DelayControls } from './delay-controls.js';
import { CommentsPanel } from './comments.js';

/**
 * Edytor timeline'u.
 */
export class TimelineEditor {
  constructor(root, options) {
    this.root = root;
    this.options = {
      editable: options.editable !== false,
      allowComments: options.allowComments || false,
      onChange: options.onChange || (() => {}),
      onComment: options.onComment || (() => {}),
      timeline: options.timeline,
    };
    this.clock = new CircularClock(root.querySelector('.wt-clock'));
    this.swimlanes = new Swimlanes(root.querySelector('.wt-swimlanes'), {
      onEdit: (event) => this.editEvent(event),
      onReorder: (source, target, role) => this.reorder(source, target, role),
      editable: this.options.editable,
    });
    this.delayControls = new DelayControls(root.querySelector('.wt-live'), (id, minutes) => this.delay(id, minutes));
    this.comments = new CommentsPanel(root.querySelector('.wt-comments'), (payload) => this.submitComment(payload));
    this.timeline = this.options.timeline;
    this.render();
  }

  setTimeline(timeline) {
    this.timeline = timeline;
    this.render();
  }

  render() {
    if (!this.timeline) {
      this.root.querySelector('.wt-title').textContent = 'Brak danych';
      return;
    }
    this.timeline.events.sort((a, b) => compareISO(a.start, b.start));
    const title = this.timeline.title || 'Timeline';
    this.root.querySelector('.wt-title').textContent = `${title} · ${this.timeline.date} · ${this.timeline.style}`;
    this.renderEventsList();
    this.clock.render(this.timeline);
    this.swimlanes.render(this.timeline.events);
    if (this.options.editable) {
      this.delayControls.render(this.timeline.events);
    } else {
      this.root.querySelector('.wt-live').innerHTML = '';
    }
    this.renderHistory();
    this.comments.render(this.timeline.comments || [], this.options.allowComments);
  }

  renderEventsList() {
    const list = this.root.querySelector('.wt-events');
    list.innerHTML = '';
    this.timeline.events.forEach((event) => {
      const item = document.createElement('div');
      item.className = 'wt-event-row';
      if (!this.options.editable) {
        item.classList.add('wt-event-row--readonly');
      }
      item.dataset.eventId = event.id;
      item.innerHTML = `
        <div class="wt-event-time">${formatHM(event.start)} – ${formatHM(event.end)}</div>
        <div class="wt-event-title">${event.title}</div>
        ${this.options.editable ? `<button class="wt-btn-secondary" data-action="edit" aria-label="Edytuj ${event.title}">✏️</button>` : ''}
      `;
      if (this.hasCollision(event)) {
        item.classList.add('wt-event-row--collision');
      }
      if (this.options.editable) {
        item.querySelector('[data-action="edit"]').addEventListener('click', () => this.editEvent(event));
      }
      list.appendChild(item);
    });
  }

  editEvent(event) {
    if (!this.options.editable) {
      return;
    }
    const modal = document.createElement('dialog');
    modal.className = 'wt-modal';
    modal.innerHTML = `
      <form method="dialog" class="wt-modal__form">
        <h3>Edytuj wydarzenie</h3>
        <label>Title<input class="wt-input" name="title" value="${event.title}"></label>
        <label>Start<input class="wt-input" name="start" type="datetime-local" value="${event.start.slice(0, 16)}"></label>
        <label>End<input class="wt-input" name="end" type="datetime-local" value="${event.end.slice(0, 16)}"></label>
        <label>Notatki<textarea class="wt-input" name="notes">${event.notes || ''}</textarea></label>
        <menu>
          <button value="cancel" class="wt-btn-secondary">Anuluj</button>
          <button value="default" class="wt-btn">Zapisz</button>
        </menu>
      </form>
    `;
    modal.addEventListener('close', () => modal.remove());
    modal.querySelector('form').addEventListener('submit', (evt) => {
      evt.preventDefault();
      const form = evt.target;
      event.title = form.title.value;
      event.start = new Date(form.start.value).toISOString();
      event.end = new Date(form.end.value).toISOString();
      event.notes = form.notes.value;
      this.render();
      this.options.onChange(this.timeline);
      modal.close();
    });
    document.body.appendChild(modal);
    modal.showModal();
  }

  reorder(sourceId, targetId, role) {
    if (!this.options.editable) {
      return;
    }
    const events = this.timeline.events;
    const sourceIndex = events.findIndex((event) => event.id === sourceId);
    const targetIndex = targetId ? events.findIndex((event) => event.id === targetId) : events.length - 1;
    if (sourceIndex === -1) return;
    const [item] = events.splice(sourceIndex, 1);
    if (targetIndex >= 0) {
      events.splice(targetIndex, 0, item);
    } else {
      events.push(item);
    }
    if (role && !item.role.includes(role)) {
      item.role.push(role);
    }
    this.render();
    this.options.onChange(this.timeline);
  }

  delay(eventId, minutes) {
    if (!this.options.editable) {
      return;
    }
    this.timeline.events = applyDelay(this.timeline.events, eventId, minutes);
    this.timeline.lastUpdated = new Date().toISOString();
    this.render();
    this.options.onChange(this.timeline);
  }

  hasCollision(current) {
    return this.timeline.events.some((event) => event.id !== current.id && hasOverlap(event, current));
  }

  renderHistory() {
    const history = this.root.querySelector('.wt-history');
    if (!history) {
      return;
    }
    const updated = this.timeline.lastUpdated ? new Date(this.timeline.lastUpdated) : null;
    history.textContent = updated ? `Zaktualizowano ${Math.round((Date.now() - updated.getTime()) / 60000)} min temu` : 'Brak historii';
  }

  submitComment(payload) {
    this.options.onComment(payload);
  }
}
