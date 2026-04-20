import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { studiosApi } from '../../lib/api';
import { ErrorMessage, Spinner, Stars } from './ui';
import { getDisplayLocation } from '../../lib/location';
import { resolveStudioCoords } from '../../lib/geocode';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapView() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

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

  useEffect(() => {
    if (loading || error || !mapContainerRef.current) return;
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/standard',
      center: [-98.5795, 39.8283],
      zoom: 3,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    mapRef.current.on('click', (e) => {
      if (!e.originalEvent.target.closest('.eyf-map-pin')) {
        setSelected(null);
      }
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [loading, error]);

  useEffect(() => {
    if (!mapRef.current || !studios.length) return;

    const addMarkers = async () => {
      markersRef.current.forEach((m) => m.marker.remove());
      markersRef.current = [];

      const token = mapboxgl.accessToken;
      const resolved = await Promise.all(
        studios.map(async (studio) => ({
          studio,
          ...(await resolveStudioCoords(studio, token)),
        })),
      );

      const bounds = new mapboxgl.LngLatBounds();
      let hasValidCoords = false;

      resolved.forEach(({ studio, lat, lng }) => {
        if (lat == null || lng == null) return;

        hasValidCoords = true;
        bounds.extend([lng, lat]);

        const el = document.createElement('button');
        el.className = 'eyf-map-pin';
        el.style.background = studio.color || '#62f3d4';
        el.setAttribute('aria-label', `View ${studio.name} — ${getDisplayLocation(studio)}`);
        el.title = studio.name;

        el.addEventListener('click', () => {
          setSelected((prev) => (prev?.id === studio.id ? null : studio));
          mapRef.current.flyTo({ center: [lng, lat], zoom: 12, duration: 800 });
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(mapRef.current);

        markersRef.current.push({ marker, el, id: studio.id, lat, lng });
      });

      if (hasValidCoords) {
        mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 12, duration: 1000 });
      }
    };

    if (mapRef.current.isStyleLoaded()) {
      addMarkers();
    } else {
      mapRef.current.once('load', addMarkers);
    }
  }, [studios]);

  useEffect(() => {
    markersRef.current.forEach(({ el, id }) => {
      el.classList.toggle('is-selected', selected?.id === id);
    });
  }, [selected]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchStudios} />;

  return (
    <div className="eyf-map-layout">
      <div className="eyf-map-sidebar">
        {studios.map((studio) => (
          <div
            key={studio.id}
            className="eyf-card eyf-map-card"
            style={{
              borderColor: selected?.id === studio.id ? 'var(--mint)' : undefined,
              cursor: 'pointer',
            }}
            onClick={() => {
              setSelected((prev) => (prev?.id === studio.id ? null : studio));
              const entry = markersRef.current.find((m) => m.id === studio.id);
              if (entry && mapRef.current) {
                mapRef.current.flyTo({ center: [entry.lng, entry.lat], zoom: 12, duration: 800 });
              }
            }}
          >
            <strong>{studio.name}</strong>
            <p className="eyf-muted" style={{ margin: '0.2rem 0', fontSize: '0.875rem' }}>
              {getDisplayLocation(studio)}
            </p>
            {studio.pricePerHour && (
              <p className="eyf-muted" style={{ fontSize: '0.875rem' }}>${studio.pricePerHour}/hr</p>
            )}
            <Stars rating={studio.rating || 0} />
          </div>
        ))}
      </div>

      <div className="eyf-card eyf-map-canvas" style={{ position: 'relative', overflow: 'hidden' }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

        {selected && (
          <div
            style={{
              position: 'absolute',
              bottom: '1rem',
              left: '1rem',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '1rem',
              maxWidth: '320px',
              width: 'calc(100% - 2rem)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              zIndex: 10,
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>{selected.name}</strong>
                <p className="eyf-muted" style={{ margin: '0.2rem 0 0', fontSize: '0.82rem' }}>
                  {getDisplayLocation(selected)} · ${selected.pricePerHour}/hr
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close studio preview"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  fontSize: '1.1rem',
                  lineHeight: 1,
                  padding: '0',
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
            <Link className="eyf-link-button" to={`/studios/${selected.slug}`}>
              View profile
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
