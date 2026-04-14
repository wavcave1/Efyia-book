import { useEffect, useMemo, useRef, useState } from 'react';
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
  const markersRef = useRef([]); // [{ marker, el, id, lat, lng }]

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/standard',
      center: [-98.5795, 39.8283],
      zoom: 3,
    });
    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Rebuild markers whenever the studios list changes
  useEffect(() => {
    if (!mapRef.current || !studios.length) return;

    const addMarkers = async () => {
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];

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
        el.setAttribute('aria-label', `${studio.name} — ${getDisplayLocation(studio)}`);
        el.title = studio.name;
        el.addEventListener('click', () => {
          onSelect((prev) => (prev?.id === studio.id ? null : studio));
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
  }, [studios]);

  // Sync pin highlight + fly to selected studio
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
    <div className="eyf-discover-map-canvas">
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {selected ? (
        <div className="eyf-discover-map-preview">
          <div>
            <strong>{selected.name}</strong>
            <p className="eyf-muted" style={{ margin: '0.2rem 0 0', fontSize: '0.82rem' }}>
              {getDisplayLocation(selected)}
            </p>
            <Stars rating={selected.rating || 0} />
          </div>
          <Link className="eyf-link-button" to={`/studios/${selected.slug}`}>
            View
          </Link>
        </div>
      ) : (
        <p className="eyf-map-label">Select a pin to preview</p>
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

  // Sync query from URL
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
          {/* ── Filter sidebar ──────────────────────────────────────────── */}
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

          {/* ── Results + optional map ──────────────────────────────────── */}
          <div className={`eyf-results-area${showMap ? ' has-map' : ''}`}>
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
                    <div className={`eyf-card-grid${showMap ? ' eyf-card-grid--compact' : ''}`}>
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

            {/* ── Map panel (auto-shows on search) ─────────────────────── */}
            {showMap ? (
              <div className="eyf-discover-map">
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
          </div>
        </div>
      </section>
    </div>
  );
}
