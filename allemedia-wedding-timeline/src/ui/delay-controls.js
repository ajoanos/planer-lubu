/**
 * Kontrolki trybu LIVE.
 */
export class DelayControls {
  constructor(container, onDelay) {
    this.container = container;
    this.onDelay = onDelay;
  }

  render(events) {
    this.container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'delay-controls';
    const select = document.createElement('select');
    select.className = 'wt-input';
    events.forEach((event) => {
      const option = document.createElement('option');
      option.value = event.id;
      option.textContent = event.title;
      select.appendChild(option);
    });
    const buttons = [5, 15, 30].map((minutes) => {
      const btn = document.createElement('button');
      btn.textContent = `+${minutes} min`;
      btn.className = 'wt-btn-secondary';
      btn.addEventListener('click', () => {
        this.onDelay(select.value, minutes);
      });
      return btn;
    });

    wrapper.appendChild(select);
    buttons.forEach((btn) => wrapper.appendChild(btn));
    this.container.appendChild(wrapper);
  }
}
