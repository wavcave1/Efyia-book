import { useCallback, useRef, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function uploadToServer(file) {
  const token = localStorage.getItem('efyia_token');
  if (!token) throw new Error('You must be logged in to upload files.');

  const fd = new FormData();
  fd.append('file', file);

  const res = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed.');
  return data.url;
}

const ACCEPT_MAP = {
  image: 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml',
  audio: 'audio/mpeg,audio/wav,audio/aac,audio/ogg,audio/flac,audio/mp4',
};

export default function FileUpload({
  value = '',
  onChange,
  type = 'image',
  label,
  hint,
  accept,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const resolvedAccept = accept || ACCEPT_MAP[type] || 'image/*';

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;
      setError(null);
      setUploading(true);
      try {
        const url = await uploadToServer(file);
        onChange(url);
      } catch (err) {
        setError(err.message);
      } finally {
        setUploading(false);
      }
    },
    [onChange],
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const hasValue = value && value.trim();

  return (
    <div className="eyf-upload">
      {label ? <p className="eyf-upload__label">{label}</p> : null}

      {hasValue ? (
        <div className="eyf-upload__preview">
          {type === 'audio' ? (
            <audio
              src={value}
              controls
              className="eyf-upload__audio"
              aria-label="Audio preview"
            />
          ) : (
            <img
              src={value}
              alt="Upload preview"
              className="eyf-upload__img"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          <div className="eyf-upload__preview-actions">
            <button
              type="button"
              className="eyf-upload__change"
              onClick={() => inputRef.current?.click()}
            >
              Change
            </button>
            <button
              type="button"
              className="eyf-upload__remove"
              onClick={() => onChange('')}
              aria-label="Remove file"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`eyf-dropzone${dragging ? ' is-dragging' : ''}${uploading ? ' is-uploading' : ''}`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onClick={() => !uploading && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!uploading) inputRef.current?.click();
            }
          }}
          aria-label={uploading ? 'Uploading…' : `Upload ${type} file`}
        >
          {uploading ? (
            <div className="eyf-dropzone__uploading">
              <span className="eyf-spinner" />
              <span>Uploading…</span>
            </div>
          ) : (
            <>
              <span className="eyf-dropzone__icon" aria-hidden="true">
                {type === 'audio' ? '🎵' : '🖼'}
              </span>
              <span className="eyf-dropzone__text">
                Drop {type === 'audio' ? 'audio' : 'image'} here or{' '}
                <span className="eyf-dropzone__browse">browse</span>
              </span>
              {hint ? <span className="eyf-dropzone__hint">{hint}</span> : null}
            </>
          )}
        </div>
      )}

      {error ? (
        <p className="eyf-upload__error" role="alert">
          {error}
        </p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={resolvedAccept}
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files[0]) handleFile(e.target.files[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
