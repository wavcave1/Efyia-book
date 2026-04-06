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
  multiple = false,
  accept,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const resolvedAccept = accept || ACCEPT_MAP[type] || 'image/*';

  const singleValue = typeof value === 'string' ? value : '';
  const multiValues = Array.isArray(value) ? value : [];

  const handleFiles = useCallback(
    async (files) => {
      if (!files.length) return;
      setError(null);
      setUploading(true);
      try {
        const uploads = await Promise.all(files.map((file) => uploadToServer(file)));
        if (multiple) {
          const merged = [...multiValues, ...uploads];
          const unique = Array.from(new Set(merged));
          onChange(unique);
        } else {
          onChange(uploads[0]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setUploading(false);
      }
    },
    [multiple, multiValues, onChange],
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files || []);
      if (!files.length) return;
      handleFiles(multiple ? files : [files[0]]);
    },
    [handleFiles, multiple],
  );

  const hasValue = multiple ? multiValues.length > 0 : singleValue && singleValue.trim();

  const removeAt = (idx) => {
    if (!multiple) return;
    const next = multiValues.filter((_, i) => i !== idx);
    onChange(next);
  };

  return (
    <div className="eyf-upload">
      {label ? <p className="eyf-upload__label">{label}</p> : null}

      {multiple ? (
        <>
          {hasValue ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '0.75rem',
                marginBottom: '0.75rem',
              }}
            >
              {multiValues.map((url, idx) => (
                <div
                  key={`${url}-${idx}`}
                  style={{
                    position: 'relative',
                    border: '1px solid var(--border-color, #e5e7eb)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    background: 'var(--card, #f9fafb)',
                  }}
                >
                  {type === 'audio' ? (
                    <audio
                      src={url}
                      controls
                      style={{ width: '100%', display: 'block' }}
                      aria-label={`Audio file ${idx + 1}`}
                    />
                  ) : (
                    <img
                      src={url}
                      alt={`Upload ${idx + 1}`}
                      style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }}
                      onError={(e) => {
                        e.target.style.visibility = 'hidden';
                      }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeAt(idx)}
                    className="eyf-upload__remove"
                    style={{ position: 'absolute', top: 6, right: 6 }}
                    aria-label={`Remove ${type} ${idx + 1}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}

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
            aria-label={uploading ? 'Uploading…' : `Upload ${type} files`}
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
                  Drop {type === 'audio' ? 'audio' : 'images'} here or{' '}
                  <span className="eyf-dropzone__browse">browse</span>
                </span>
                <span className="eyf-dropzone__hint">
                  {hint || 'Select multiple files at once. Drag & drop supported.'}
                </span>
              </>
            )}
          </div>

          {hasValue ? (
            <div className="eyf-upload__preview-actions" style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                className="eyf-upload__change"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                Add more
              </button>
              <button
                type="button"
                className="eyf-upload__remove"
                onClick={() => onChange([])}
                aria-label="Remove all files"
                disabled={uploading}
              >
                Remove all
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <>
          {hasValue ? (
            <div className="eyf-upload__preview">
              {type === 'audio' ? (
                <audio
                  src={singleValue}
                  controls
                  className="eyf-upload__audio"
                  aria-label="Audio preview"
                />
              ) : (
                <img
                  src={singleValue}
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
                  disabled={uploading}
                >
                  Change
                </button>
                <button
                  type="button"
                  className="eyf-upload__remove"
                  onClick={() => onChange('')}
                  aria-label="Remove file"
                  disabled={uploading}
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
        </>
      )}

      {error ? (
        <p className="eyf-upload__error" role="alert">
          {error}
        </p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={resolvedAccept}
        style={{ display: 'none' }}
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          handleFiles(multiple ? files : files.slice(0, 1));
          e.target.value = '';
        }}
      />
    </div>
  );
}
