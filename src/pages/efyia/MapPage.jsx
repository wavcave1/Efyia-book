import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studiosApi } from '../../lib/api';
import { ErrorMessage, SectionHeading, Spinner, Stars } from '../../components/efyia/ui';
import { getCoordinates, getDisplayLocation } from '../../lib/location';

// Map positions are decorative until a Mapbox integration is added.
// They are derived from normalized lat/lng values within the visible canvas.
function getCanvasPosition(studio, allStudios) {
  const points = allStudios
    .map((s) => getCoordinates(s))
    .filter((point) => point.lat != null && point.lng != null);
  const current = getCoordinates(studio);
  if (!points.length || current.lat == null || current.lng == null) return { left: '50%', top: '50%' };

  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  const left = 10 + ((current.lng - minLng) / lngRange) * 80;
  const top = 10 + ((maxLat - current.lat) / latRange) * 70;

  return { left: `${left.toFixed(1)}%`, top: `${top.toFixed(1)}%` };
}

export default function MapPage() {
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const fetchStudios = () => {
    setLoading(true);
    setError(null);
    studiosApi.list({ limit: 50 })
      .then(({ studios: list }) => {
        setStudios(list);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => { fetchStudios(); }, []);

  return (
    <div className="eyf-page">
      <section className="eyf-section">
        <SectionHeading
          eyebrow="Map view"
          title="Studio locations across key music markets"
          description="Select a pin to preview a studio's profile. Full geospatial map integration requires a Mapbox API key."
        />
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchStudios} />
        ) : (
          <div className="eyf-map-layout">
            <div className="eyf-card eyf-map-canvas">
              {studios.map((studio) => {
                const pos = getCanvasPosition(studio, studios);
                return (
                  <button
                    key={studio.id}
                    type="button"
                    className="eyf-map-pin"
                    style={{ ...pos, background: studio.color || '#62f3d4' }}
                    title={studio.name}
                    onClick={() => setSelected(selected?.id === studio.id ? null : studio)}
                    aria-label={`View ${studio.name} — ${getDisplayLocation(studio)}`}
                  />
                );
              })}
              {selected ? (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '1rem',
                    left: '1rem',
                    right: '1rem',
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '14px',
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <strong>{selected.name}</strong>
                    <p className="eyf-muted" style={{ margin: '0.25rem 0 0' }}>
                      {getDisplayLocation(selected)} · ${selected.pricePerHour}/hr
                    </p>
                  </div>
                  <Link className="eyf-link-button" to={`/studios/${selected.slug}`}>
                    View profile
                  </Link>
                </div>
              ) : (
                <p className="eyf-map-label" style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem', textAlign: 'center' }}>
                  Select a pin to preview a studio
                </p>
              )}
            </div>
            <div className="eyf-map-sidebar">
              {studios.map((studio) => (
                <article
                  key={studio.id}
                  className="eyf-card eyf-map-card"
                  style={{ borderColor: selected?.id === studio.id ? 'var(--mint)' : undefined }}
                >
                  <div className="eyf-row eyf-row--between eyf-row--start">
                    <div>
                      <h3>{studio.name}</h3>
                      <p className="eyf-muted">{getDisplayLocation(studio)}</p>
                    </div>
                    <span className="eyf-price">${studio.pricePerHour}/hr</span>
                  </div>
                  <Stars rating={studio.rating || 0} />
                  <p className="eyf-muted">{studio.description}</p>
                  <Link className="eyf-link-button" to={`/studios/${studio.slug}`}>
                    View profile
                  </Link>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
