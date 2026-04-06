import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { studiosApi } from '../../lib/api';
import { useAppContext } from '../../context/AppContext';
import { EmptyState, ErrorMessage, SectionHeading, Spinner, Stars, StudioCard } from '../../components/efyia/ui';

// ─── Inline map helpers (canvas-based, no Mapbox required) ───────────────────
function getCanvasPosition(studio, allStudios) {
  const lats = allStudios.map((s) => s.lat).filter(Boolean);
  const lngs = allStudios.map((s) => s.lng).filter(Boolean);
  if (!lats.length || !studio.lat || !studio.lng) {
    return { left: `${20 + Math.random() * 60}%`, top: `${20 + Math.random() * 60}%` };
  }

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  return {
    left: `${(10 + ((studio.lng - minLng) / lngRange) * 80).toFixed(1)}%`,
    top: `${(10 + ((maxLat - studio.lat) / latRange) * 70).toFixed(1)}%`,
  };
}

function MapPanel({ studios, selected, onSelect }) {
  return (
    <div className="eyf-discover-map-canvas">
      {studios.map((studio) => {
        const pos = getCanvasPosition(studio, studios);
        const isSelected = selected?.id === studio.id;
        return (
          <button
            key={studio.id}
            type="button"
            className={`eyf-map-pin${isSelected ? ' is-selected' : ''}`}
            style={{ ...pos, background: studio.color || '#62f3d4' }}
            title={studio.name}
            onClick={() => onSelect(isSelected ? null : studio)}
            aria-label={`${studio.name} — ${studio.city}, ${studio.state}`}
          />
        );
      })}

      {selected ? (
        <div className="eyf-discover-map-preview">
          <div>
            <strong>{selected.name}</strong>
            <p className="eyf-muted" style={{ margin: '0.2rem 0 0', fontSize: '0.82rem' }}>
              {selected.city}, {selected.state}
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
          description="Filter by city, rating, and price to find the right fit for your session."
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
                  <p className="eyf-muted">
                    {total} studio{total !== 1 ? 's' : ''} found
                  </p>
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
                <MapPanel
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
