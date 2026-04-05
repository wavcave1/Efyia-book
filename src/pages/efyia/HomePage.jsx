import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { studiosApi } from '../../lib/api';
import { useAppContext } from '../../context/AppContext';
import { ErrorMessage, SectionHeading, Spinner, StudioCard } from '../../components/efyia/ui';

const CITIES = ['Los Angeles', 'New York', 'Atlanta', 'Nashville', 'Miami'];

export default function HomePage() {
  const navigate = useNavigate();
  const { favoriteStudioIds, toggleFavorite, currentUser } = useAppContext();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ studios: 0, rating: 0 });
  const inputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    studiosApi.list({ featured: true, limit: 6 })
      .then(({ studios, pagination }) => {
        if (cancelled) return;
        setFeatured(studios);
        setStats({ studios: pagination.total });
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const goToSearch = (query) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    navigate(`/discover?${params.toString()}`);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') goToSearch(event.currentTarget.value);
  };

  return (
    <div className="eyf-page eyf-home">
      <section className="eyf-hero">
        <div>
          <span className="eyf-badge eyf-badge--mint">Studio Booking Marketplace</span>
          <h1>Find your perfect recording studio.</h1>
          <p>
            Discover, compare, and book studios for recording, mixing, mastering, and production
            sessions across major music cities.
          </p>
          <div className="eyf-search-bar">
            <input
              ref={inputRef}
              type="text"
              placeholder="City, zip code, or studio name"
              onKeyDown={handleKeyDown}
              aria-label="Search studios"
            />
            <button
              type="button"
              className="eyf-button"
              onClick={() => goToSearch(inputRef.current?.value || '')}
            >
              Search
            </button>
          </div>
          <div className="eyf-city-list">
            {CITIES.map((city) => (
              <button key={city} type="button" className="eyf-chip" onClick={() => goToSearch(city)}>
                {city}
              </button>
            ))}
          </div>
        </div>
        <div className="eyf-hero__panel eyf-card">
          <div className="eyf-stats-grid">
            <div>
              <strong>{stats.studios > 0 ? `${stats.studios}` : '—'}</strong>
              <span>Studios listed</span>
            </div>
            <div><strong>4.7+</strong><span>Average rating</span></div>
            <div><strong>8%</strong><span>Platform fee</span></div>
            <div><strong>24/7</strong><span>Artist support</span></div>
          </div>
          <p className="eyf-muted">
            Compare studios, check amenities and pricing, and move from search to confirmed
            booking in one guided flow.
          </p>
          {!currentUser ? (
            <Link className="eyf-link-button" to="/signup">
              Create your account
            </Link>
          ) : null}
        </div>
      </section>

      <section className="eyf-section">
        <SectionHeading
          eyebrow="Featured studios"
          title="Top-rated spaces across the marketplace"
          action={<Link className="eyf-link-button" to="/discover">View all studios</Link>}
        />
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorMessage
            message={error}
            onRetry={() => {
              setError(null);
              setLoading(true);
              studiosApi.list({ featured: true, limit: 6 })
                .then(({ studios }) => { setFeatured(studios); setLoading(false); })
                .catch((err) => { setError(err.message); setLoading(false); });
            }}
          />
        ) : featured.length > 0 ? (
          <div className="eyf-card-grid">
            {featured.map((studio) => (
              <StudioCard
                key={studio.id}
                studio={studio}
                isFavorite={favoriteStudioIds.includes(studio.id)}
                onFavoriteToggle={currentUser ? toggleFavorite : null}
              />
            ))}
          </div>
        ) : (
          <div className="eyf-card eyf-empty">
            <p className="eyf-muted">No studios are listed yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
