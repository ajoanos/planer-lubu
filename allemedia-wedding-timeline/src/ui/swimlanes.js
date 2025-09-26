import { EventCard } from './event-card.js';

const ROLES = ['Para', 'Foto', 'Wideo', 'MUAH', 'DJ', 'Goscie', 'Inne'];

/**
 * Swimlane'y ról.
 */
export class Swimlanes {
  constructor(container, { onEdit, onReorder, editable }) {
    this.container = container;
    this.onEdit = onEdit;
    this.onReorder = onReorder;
    this.editable = editable;
  }

  /**
   * @param {TimelineEvent[]} events
   */
  render(events) {
    this.container.innerHTML = '';
    const lanes = document.createElement('div');
    lanes.className = 'swimlanes';

    ROLES.forEach((role) => {
      const lane = document.createElement('section');
      lane.className = 'swimlane';
      lane.innerHTML = `<header class="swimlane__header">${role}</header>`;
      const body = document.createElement('div');
      body.className = 'swimlane__body';
      body.dataset.role = role;
      if (this.editable) {
        body.addEventListener('dragover', (event) => {
          event.preventDefault();
          body.classList.add('drag-over');
        });
        body.addEventListener('dragleave', () => body.classList.remove('drag-over'));
        body.addEventListener('drop', (event) => {
          event.preventDefault();
          const sourceId = event.dataTransfer.getData('text/plain');
          this.onReorder(sourceId, null, role);
          body.classList.remove('drag-over');
        });
      }

      const roleEvents = events.filter((event) => event.role.includes(role));
      roleEvents.forEach((event) => {
        const card = new EventCard(
          event,
          () => {},
          (sourceId, targetId) => this.onReorder(sourceId, targetId, role),
          this.onEdit
        );
        const element = card.render();
        if (!this.editable) {
          element.draggable = false;
        }
        body.appendChild(element);
      });

      lane.appendChild(body);
      lanes.appendChild(lane);
    });

    this.container.appendChild(lanes);
  }
}
