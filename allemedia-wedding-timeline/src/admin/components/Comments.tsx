import React, { useState } from 'react';
import { CommentEntry } from '../types';

interface CommentsProps {
  comments: CommentEntry[];
  onAdd: (author: string, comment: string, pin?: string) => void;
  pin?: string;
  readonly?: boolean;
}

const Comments: React.FC<CommentsProps> = ({ comments, onAdd, pin, readonly }) => {
  const [author, setAuthor] = useState('');
  const [comment, setComment] = useState('');
  const [inputPin, setInputPin] = useState('');

  const submit = () => {
    if (!comment.trim()) return;
    onAdd(author || 'Gość', comment, inputPin || pin);
    setComment('');
  };

  return (
    <div className="alle-card">
      <h2>Komentarze</h2>
      <div className="alle-scroll">
        {comments?.length ? (
          comments.map((item) => (
            <div key={item.id} className="alle-comment">
              <strong>{item.author}</strong>
              <p>{item.comment_text}</p>
              <span>{new Date(item.created_at).toLocaleString('pl-PL')}</span>
            </div>
          ))
        ) : (
          <p>Brak komentarzy.</p>
        )}
      </div>
      {!readonly && (
        <div className="alle-grid" style={{ marginTop: 12 }}>
          <input placeholder="Autor" value={author} onChange={(e) => setAuthor(e.target.value)} />
          <textarea placeholder="Komentarz" value={comment} onChange={(e) => setComment(e.target.value)} />
          <input
            placeholder="PIN"
            value={inputPin || pin || ''}
            onChange={(e) => setInputPin(e.target.value)}
          />
          <button className="alle-btn" type="button" onClick={submit}>
            Dodaj komentarz
          </button>
        </div>
      )}
    </div>
  );
};

export default Comments;
