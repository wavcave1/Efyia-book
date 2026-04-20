import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { studiosApi } from '../../lib/api';
import { useAppContext } from '../../context/AppContext';
import { EmptyState, ErrorMessage, SectionHeading, Spinner, Stars, StudioCard } from '../../components/efyia/ui';
import { getDisplayLocation } from '../../lib/location';
import { resolveStudioCoords } from '../../lib/geocode';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function MapboxPanel({ studios, selected, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/standard',
      center: [-98.5795, 39.8283],
      zoom: 3,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    mapRef.current.on('click', (e) => {
      if (!e.originalEvent.target.closest('.eyf-map-pin')) {
        onSelect(null);
      }
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [onSelect]);

  useEffect(() => {
    if (!mapRef.current) return;

    const addMarkers = async () => {
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];

      if (!studios.length) return;

      const token = mapboxgl.accessToken;
      const resolved = await Promise.all(
        studios.map(async (studio) => ({
          studio,
          ...(await resolveStudioCoords(studio, token)),
        })),
      );

      const bounds = new mapboxgl.LngLatBounds();
      let hasCoords = false;

      resolved.forEach(({ studio, lat, lng }) => {
        if (lat == null || lng == null) return;

        hasCoords = true;
        bounds.extend([lng, lat]);

        const el = document.createElement('button');
        el.className = 'eyf-map-pin';
        el.style.background = studio.color || '#62f3d4';
        el.setAttribute('aria-label', `View ${studio.name} — ${getDisplayLocation(studio)}`);
        el.title = studio.name;

        el.addEventListener('click', () => {
          onSelect((prev) => (prev?.id === studio.id ? null : studio));
          mapRef.current.flyTo({ center: [lng, lat], zoom: 12, duration: 800 });
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(mapRef.current);

        markersRef.current.push({ marker, el, id: studio.id, lat, lng });
      });

      if (hasCoords) {
        mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 800 });
      }
    };

    if (mapRef.current.isStyleLoaded()) addMarkers();
    else mapRef.current.once('load', addMarkers);
  }, [studios, onSelect]);

  useEffect(() => {
    markersRef.current.forEach(({ el, id }) => {
      el.classList.toggle('is-selected', selected?.id === id);
    });

    if (selected && mapRef.current) {
      const entry = markersRef.current.find((m) => m.id === selected.id);
      if (entry) {
        mapRef.current.flyTo({ center: [entry.lng, entry.lat], zoom: 12, duration: 800 });
      }
    }
  }, [selected]);

  return (
    <div
      className="eyf-card eyf-map-canvas"
      style={{ position: 'relative', overflow: 'hidden', minHeight: '420px' }}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {selected ? (
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
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '0.5rem',
            }}
          >
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem' }}>{selected.name}</strong>
              <p className="eyf-muted" style={{ margin: '0.2rem 0 0', fontSize: '0.82rem' }}>
                {getDisplayLocation(selected)} · ${selected.pricePerHour}/hr
              </p>
              <Stars rating={selected.rating || 0} />
            </div>

            <button
              type="button"
              onClick={() => onSelect(null)}
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
      ) : (
        <p
          className="eyf-map-label"
          style={{
            position: 'absolute',
            left: '1rem',
            bottom: '1rem',
            zIndex: 5,
            margin: 0,
          }}
        >
          Select a pin to preview
        </p>
      )}
    </div>
  );
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const { favoriteStudioIds, toggleFavorite, currentUser } = useAppContext();

  const [query, setQuery] = useState(params.get('q') || '');
  const [priceMax, setPriceMax] = useState(200);
  const [minRating, setMinRating] = useState(0);
  const [studios, setStudios] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(!!params.get('q'));
  const [selectedStudio, setSelectedStudio] = useState(null);

  useEffect(() => {
    setQuery(params.get('q') || '');
    setHasSearched(!!params.get('q'));
  }, [params]);

  const fetchStudios = (overrides = {}) => {
    setLoading(true);
    setError(null);

    const q = overrides.q !== undefined ? overrides.q : params.get('q') || '';
    const max = overrides.priceMax !== undefined ? overrides.priceMax : priceMax;
    const rating = overrides.minRating !== undefined ? overrides.minRating : minRating;

    studiosApi.list({
      q: q || undefined,
      maxPrice: max < 200 ? max : undefined,
      minRating: rating > 0 ? rating : undefined,
      limit: 50,
    })
      .then(({ studios: list, pagination }) => {
        setStudios(list);
        setTotal(pagination.total);
        setLoading(false);
        setSelectedStudio(null);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStudios();
  }, [params.get('q')]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyFilters = () => {
    if (query) setParams({ q: query });
    else setParams({});
    setHasSearched(true);
    fetchStudios({ q: query });
  };

  const showMap = hasSearched && studios.length > 0 && !loading && !error;

  return (
    <div className="eyf-page">
      <section className="eyf-section">
        <SectionHeading
          eyebrow="Find Studios"
          title="Discover your perfect recording space"
        />

        <div className="eyf-search-layout">
          <aside className="eyf-card eyf-filter-panel">
            <h3>Filters</h3>

            <label>
              Search
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                placeholder="City, zip code, or studio name"
              />
            </label>

            <label>
              Max hourly rate: ${priceMax}{priceMax === 200 ? '+' : ''}
              <input
                type="range"
                min="40"
                max="200"
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
              />
            </label>

            <div>
              <span className="eyf-filter-label">Minimum rating</span>
              <div className="eyf-city-list">
                {[0, 4, 4.5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    className={`eyf-chip ${minRating === rating ? 'is-active' : ''}`}
                    onClick={() => setMinRating(rating)}
                  >
                    {rating === 0 ? 'Any' : `${rating}+`}
                  </button>
                ))}
              </div>
            </div>

            <button type="button" className="eyf-button" onClick={applyFilters}>
              Apply filters
            </button>
          </aside>

          <div className="eyf-results-area">
            {showMap ? (
              <div className="eyf-discover-map" style={{ marginBottom: '1rem' }}>
                <p className="eyf-muted" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                  {studios.length} result{studios.length !== 1 ? 's' : ''} on map
                </p>
                <MapboxPanel
                  studios={studios}
                  selected={selectedStudio}
                  onSelect={setSelectedStudio}
                />
              </div>
            ) : null}

            <div className="eyf-results-panel">
              {loading ? (
                <Spinner />
              ) : error ? (
                <ErrorMessage message={error} onRetry={() => fetchStudios()} />
              ) : (
                <>
                  <div className="eyf-results-count">
                    <strong>{total}</strong> studio{total !== 1 ? 's' : ''} found
                  </div>

                  {studios.length > 0 ? (
                    <div className="eyf-card-grid">
                      {studios.map((studio) => (
                        <StudioCard
                          key={studio.id}
                          studio={studio}
                          isFavorite={favoriteStudioIds.includes(studio.id)}
                          onFavoriteToggle={currentUser ? toggleFavorite : null}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="No studios found"
                      description="Try adjusting your location, rating, or price filters."
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}