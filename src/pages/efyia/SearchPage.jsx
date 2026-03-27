import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { EmptyState, SectionHeading, StudioCard } from '../../components/efyia/ui';

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const [query, setQuery] = useState(q);
  const [priceMax, setPriceMax] = useState(200);
  const [minRating, setMinRating] = useState(0);
  const { studios, favoriteStudioIds, toggleFavorite } = useAppContext();

  const filteredStudios = useMemo(() => {
    const normalized = q.toLowerCase();
    return studios.filter((studio) => {
      const queryMatch =
        !normalized ||
        studio.name.toLowerCase().includes(normalized) ||
        studio.city.toLowerCase().includes(normalized) ||
        studio.zip.includes(normalized);
      return queryMatch && studio.pricePerHour <= priceMax && studio.rating >= minRating;
    });
  }, [minRating, priceMax, q, studios]);

  return (
    <div className="eyf-page">
      <section className="eyf-section">
        <SectionHeading
          eyebrow="Search + filter"
          title="Compare studios by city, price, and vibe"
          description="Use the same MVP filters highlighted in your prototype to narrow down the best rooms for each session."
        />
        <div className="eyf-search-layout">
          <aside className="eyf-card eyf-filter-panel">
            <h3>Filters</h3>
            <label>
              Search
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Los Angeles, zip, or studio"
              />
            </label>
            <button type="button" className="eyf-button" onClick={() => setParams(query ? { q: query } : {})}>
              Update results
            </button>
            <label>
              Max hourly rate: ${priceMax}
              <input type="range" min="40" max="200" value={priceMax} onChange={(event) => setPriceMax(Number(event.target.value))} />
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
          </aside>
          <div className="eyf-results-panel">
            <div className="eyf-row eyf-row--between">
              <p className="eyf-muted">{filteredStudios.length} studio(s) match your filters.</p>
            </div>
            {filteredStudios.length ? (
              <div className="eyf-card-grid">
                {filteredStudios.map((studio) => (
                  <StudioCard
                    key={studio.id}
                    studio={studio}
                    isFavorite={favoriteStudioIds.includes(studio.id)}
                    onFavoriteToggle={toggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="No studios found" description="Try increasing your budget or broadening the city search." />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
