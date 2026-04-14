import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { studiosApi } from '../../lib/api';
import { ErrorMessage, SectionHeading, Spinner, Stars } from '../../components/efyia/ui';
import { getCoordinates, getDisplayLocation } from '../../lib/location';


mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapPage() {
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

  // Initialize map once loading is done and container is ready
  useEffect(() => {
    if (loading || error || !mapContainerRef.current) return;
    if (mapRef.current) return; // already initialized

    mapRef.current = new mapboxgl.Map({
  container: mapContainerRef.current,
  style: 'mapbox://styles/mapbox/standard',
  center: [-98.5795, 39.8283],
  zoom: 3,
});

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [loading, error]);

  // Add markers whenever studios or map changes
  useEffect(() => {
    if (!mapRef.current || !studios.length) return;

    const addMarkers = () => {
      // Clear existing markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const bounds = new mapboxgl.LngLatBounds();
      let hasValidCoords = false;

      studios.forEach((studio) => {
        const { lat, lng } = getCoordinates(studio);
        if (lat == null || lng == null) return;

        hasValidCoords = true;
        bounds.extend([lng, lat]);

        // Custom marker element
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

        markersRef.current.push(marker);
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

  return (
    <div className="eyf-page">
      <section className="eyf-section">
        <SectionHeading
          eyebrow="Map view"
          title="Studio locations across key music markets"
          description="Select a pin to explore studios near you."
        />
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchStudios} />
        ) : (
          <div className="eyf-map-layout">
            {/* Sidebar */}
            <div className="eyf-map-sidebar">
              {studios.map((studio) => (
                <article
                  key={studio.id}
                  className="eyf-card eyf-map-card"
                  style={{ borderColor: selected?.id === studio.id ? 'var(--mint)' : undefined, cursor: 'pointer' }}
                  onClick={() => {
                    const { lat, lng } = getCoordinates(studio);
                    setSelected((prev) => (prev?.id === studio.id ? null : studio));
                    if (lat != null && lng != null && mapRef.current) {
                      mapRef.current.flyTo({ center: [lng, lat], zoom: 12, duration: 800 });
                    }
                  }}
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
                  <Link
                    className="eyf-link-button"
                    to={`/studios/${studio.slug}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    View profile
                  </Link>
                </article>
              ))}
            </div>

            {/* Mapbox map */}
            <div className="eyf-card eyf-map-canvas" style={{ position: 'relative', overflow: 'hidden' }}>
              <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

              {/* Selected studio overlay */}
              {selected && (
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
                    zIndex: 10,
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
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
