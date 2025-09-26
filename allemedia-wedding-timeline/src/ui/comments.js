/**
 * Panel komentarzy.
 */
export class CommentsPanel {
  constructor(container, onSubmit) {
    this.container = container;
    this.onSubmit = onSubmit;
  }

  render(comments = [], allowInput = false) {
    this.container.innerHTML = '';
    const list = document.createElement('ul');
    list.className = 'comments-list';
    comments.forEach((comment) => {
      const item = document.createElement('li');
      item.innerHTML = `
        <strong>${comment.author}</strong>
        <time>${comment.createdAt || ''}</time>
        <p>${comment.text}</p>
      `;
      list.appendChild(item);
    });
    this.container.appendChild(list);

    if (allowInput) {
      const form = document.createElement('form');
      form.className = 'comments-form';
      form.innerHTML = `
        <input class="wt-input" name="author" placeholder="Imię" aria-label="Autor komentarza">
        <textarea class="wt-input" name="text" placeholder="Komentarz" required></textarea>
        <input class="wt-input" name="pin" placeholder="PIN" required aria-label="PIN">
        <button class="wt-btn" type="submit">Dodaj komentarz</button>
      `;
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = new FormData(form);
        this.onSubmit({
          author: data.get('author'),
          text: data.get('text'),
          pin: data.get('pin'),
        });
        form.reset();
      });
      this.container.appendChild(form);
    }
  }
}
