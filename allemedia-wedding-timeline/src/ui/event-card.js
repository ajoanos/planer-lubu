import { formatHM } from '../utils/time.js';

/**
 * Karta wydarzenia z drag&drop.
 */
export class EventCard {
  /**
   * @param {TimelineEvent} event
   * @param {function(string):void} onDragStart
   * @param {function(string,string):void} onDrop
   * @param {function(TimelineEvent):void} onEdit
   */
  constructor(event, onDragStart, onDrop, onEdit) {
    this.event = event;
    this.onDragStart = onDragStart;
    this.onDrop = onDrop;
    this.onEdit = onEdit;
  }

  render() {
    const card = document.createElement('article');
    card.className = 'event-card';
    card.draggable = true;
    card.dataset.eventId = this.event.id;
    card.innerHTML = `
      <header class="event-card__header">
        <h4>${this.event.title}</h4>
        <span class="event-card__time">${formatHM(this.event.start)} – ${formatHM(this.event.end)}</span>
      </header>
      <div class="event-card__roles">${this.event.role.join(', ')}</div>
      ${this.event.notes ? `<p class="event-card__notes">${this.event.notes}</p>` : ''}
    `;
    card.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/plain', this.event.id);
      this.onDragStart(this.event.id);
    });
    card.addEventListener('dragover', (event) => {
      event.preventDefault();
      card.classList.add('drag-over');
    });
    card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
    card.addEventListener('drop', (event) => {
      event.preventDefault();
      const sourceId = event.dataTransfer.getData('text/plain');
      this.onDrop(sourceId, this.event.id);
      card.classList.remove('drag-over');
    });
    card.addEventListener('click', () => this.onEdit(this.event));
    return card;
  }
}
