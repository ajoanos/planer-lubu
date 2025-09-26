import { Wizard } from '../src/ui/wizard.js';
import { TimelineEditor } from '../src/ui/timeline-editor.js';
import { runTests } from '../src/utils/tests.js';

const root = document.getElementById('allemedia-wt-admin');
if (root) {
  runTests();
  const main = root.querySelector('.wt-main');
  const layout = document.createElement('div');
  layout.className = 'wt-layout';
  layout.innerHTML = `
    <section class="wt-section" id="wt-wizard"></section>
    <section class="wt-section" id="wt-editor" hidden>
      <header class="wt-section__header">
        <h2 class="wt-title">Timeline</h2>
        <div class="wt-actions">
          <button class="wt-btn" id="wt-save">Zapisz</button>
          <button class="wt-btn-secondary" id="wt-export">Eksport ICS</button>
          <button class="wt-btn-secondary" id="wt-print-guest">Drukuj (Goście)</button>
          <button class="wt-btn-secondary" id="wt-print-crew">Drukuj (Ekipa)</button>
        </div>
      </header>
      <div class="wt-history"></div>
      <div class="wt-editor-grid">
        <div>
          <div class="wt-events" aria-live="polite"></div>
          <div class="wt-live"></div>
          <div class="wt-comments" aria-live="polite"></div>
        </div>
        <div>
          <div class="wt-clock" aria-hidden="true"></div>
          <div class="wt-swimlanes"></div>
        </div>
      </div>
    </section>
  `;
  main.appendChild(layout);

  const wizardContainer = layout.querySelector('#wt-wizard');
  const editorSection = layout.querySelector('#wt-editor');
  let editorInstance = null;
  let currentTimeline = null;

  const wizard = new Wizard(wizardContainer, (timeline) => {
    currentTimeline = timeline;
    showEditor();
  });

  document.getElementById('wt-load-demo').addEventListener('click', () => {
    currentTimeline = JSON.parse(JSON.stringify(AllemediaWT.demoTimeline));
    showEditor();
  });

  function showEditor() {
    editorSection.hidden = false;
    if (!editorInstance) {
      editorInstance = new TimelineEditor(editorSection, {
        timeline: currentTimeline,
        onChange: (timeline) => {
          currentTimeline = timeline;
        },
        onComment: () => {},
        allowComments: false,
      });
    } else {
      editorInstance.setTimeline(currentTimeline);
    }
  }

  layout.querySelector('#wt-save').addEventListener('click', async () => {
    if (!currentTimeline) return;
    const method = currentTimeline.postId ? 'PUT' : 'POST';
    const endpoint = currentTimeline.postId
      ? `${AllemediaWT.restUrl}timelines/${currentTimeline.postId}`
      : `${AllemediaWT.restUrl}timelines`;

    const response = await fetch(endpoint, {
      method,
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': AllemediaWT.nonce,
      },
      body: JSON.stringify(currentTimeline),
    });

    if (!response.ok) {
      alert('Błąd zapisu');
      return;
    }
    const data = await response.json();
    if (data.postId) {
      currentTimeline.postId = data.postId;
    }
    if (data.timelineId) {
      currentTimeline.timelineId = data.timelineId;
    }
    currentTimeline.lastUpdated = new Date().toISOString();
    alert('Zapisano harmonogram');
  });

  layout.querySelector('#wt-export').addEventListener('click', async () => {
    if (!currentTimeline?.postId) {
      alert('Zapisz timeline przed eksportem');
      return;
    }
    const response = await fetch(`${AllemediaWT.restUrl}timelines/${currentTimeline.postId}/export/ics`, {
      method: 'POST',
      headers: { 'X-WP-Nonce': AllemediaWT.nonce },
      credentials: 'same-origin',
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wedding-timeline.ics';
    a.click();
    URL.revokeObjectURL(url);
  });

  layout.querySelector('#wt-print-guest').addEventListener('click', () => {
    document.body.classList.remove('print-crew');
    document.body.classList.add('print-guest');
    window.print();
  });
  layout.querySelector('#wt-print-crew').addEventListener('click', () => {
    document.body.classList.remove('print-guest');
    document.body.classList.add('print-crew');
    window.print();
  });
}
