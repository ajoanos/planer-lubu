import { TimelineEditor } from '../src/ui/timeline-editor.js';
import { timelineToICS } from '../src/utils/ics.js';

const container = document.getElementById('allemedia-wt-public');
if (container) {
  const main = container.querySelector('.wt-main');
  const layout = document.createElement('div');
  layout.className = 'wt-public';
  layout.innerHTML = `
    <header class="wt-section__header">
      <h2 class="wt-title">Harmonogram</h2>
      <div class="wt-actions">
        <button class="wt-btn" id="wt-public-ics">Pobierz ICS</button>
        <button class="wt-btn-secondary" id="wt-public-print-guest">Drukuj (Goście)</button>
        <button class="wt-btn-secondary" id="wt-public-print-crew">Drukuj (Ekipa)</button>
      </div>
    </header>
    <div class="wt-history"></div>
    <div class="wt-editor-grid">
      <div>
        <div class="wt-events"></div>
        <div class="wt-comments"></div>
      </div>
      <div>
        <div class="wt-clock"></div>
        <div class="wt-swimlanes"></div>
        <div class="wt-live"></div>
      </div>
    </div>
  `;
  main.appendChild(layout);

  const viewMode = container.dataset.view;
  const timelineId = container.dataset.timelineId;
  const params = new URLSearchParams(window.location.search);
  const publicId = params.get('t');

  let editor = null;
  let timelineData = null;

  async function loadTimeline() {
    try {
      let response;
      if (viewMode === 'public' && publicId) {
        response = await fetch(`${AllemediaWT.restUrl}public/${publicId}`);
        if (!response.ok) throw new Error('Brak publicznego harmonogramu');
        const payload = await response.json();
        timelineData = { ...payload.timeline, publicId: payload.meta.publicId, lastUpdated: payload.meta.lastUpdated, comments: payload.comments };
      } else if (timelineId) {
        response = await fetch(`${AllemediaWT.restUrl}timelines/${timelineId}`, {
          headers: { 'X-WP-Nonce': AllemediaWT.nonce },
          credentials: 'same-origin',
        });
        if (!response.ok) throw new Error('Nie udało się pobrać danych');
        timelineData = await response.json();
      } else {
        throw new Error('Brak ID harmonogramu');
      }
      renderTimeline();
    } catch (error) {
      main.innerHTML = `<p class="allemedia-wt-error">${error.message}</p>`;
    }
  }

  function renderTimeline() {
    if (!editor) {
      editor = new TimelineEditor(layout, {
        timeline: timelineData,
        editable: false,
        allowComments: !!publicId,
        onComment: submitComment,
        onChange: () => {},
      });
    } else {
      editor.setTimeline(timelineData);
    }
  }

  async function submitComment(comment) {
    if (!publicId) {
      alert('Komentowanie wymaga publicznego linku');
      return;
    }
    const response = await fetch(`${AllemediaWT.restUrl}public/${publicId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment),
    });
    if (!response.ok) {
      alert('Nie udało się dodać komentarza (PIN?)');
      return;
    }
    const payload = await response.json();
    timelineData.comments = payload.comments;
    editor.setTimeline(timelineData);
  }

  layout.querySelector('#wt-public-ics').addEventListener('click', () => {
    if (!timelineData) return;
    const blob = new Blob([timelineToICS(timelineData)], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timeline.ics';
    a.click();
    URL.revokeObjectURL(url);
  });

  layout.querySelector('#wt-public-print-guest').addEventListener('click', () => {
    document.body.classList.remove('print-crew');
    document.body.classList.add('print-guest');
    window.print();
  });
  layout.querySelector('#wt-public-print-crew').addEventListener('click', () => {
    document.body.classList.remove('print-guest');
    document.body.classList.add('print-crew');
    window.print();
  });

  loadTimeline();
}
