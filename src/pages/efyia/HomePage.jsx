import { Link, useNavigate } from 'react-router-dom';
import { heroCities } from '../../data/efyiaData';
import { useAppContext } from '../../context/AppContext';
import { SectionHeading, StudioCard } from '../../components/efyia/ui';

export default function HomePage() {
  const navigate = useNavigate();
  const { studios, favoriteStudioIds, toggleFavorite } = useAppContext();
  const featured = studios.filter((studio) => studio.featured);

  const goToSearch = (query) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    navigate(`/discover?${params.toString()}`);
  };

  return (
    <div className="eyf-page eyf-home">
      <section className="eyf-hero">
        <div>
          <span className="eyf-badge eyf-badge--mint">The Studio Booking Marketplace</span>
          <h1>Find your perfect recording studio.</h1>
          <p>
            Discover, compare, and book studios for recording, mixing, podcasts, and production sessions across major music cities.
          </p>
          <div className="eyf-search-bar">
            <input
              type="text"
              placeholder="City, zip code, or studio name"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  goToSearch(event.currentTarget.value);
                }
              }}
            />
            <button type="button" className="eyf-button" onClick={() => goToSearch('')}>
              Search
            </button>
          </div>
          <div className="eyf-city-list">
            {heroCities.map((city) => (
              <button key={city} type="button" className="eyf-chip" onClick={() => goToSearch(city)}>
                {city}
              </button>
            ))}
          </div>
        </div>
        <div className="eyf-hero__panel eyf-card">
          <div className="eyf-stats-grid">
            <div><strong>500+</strong><span>Studios listed</span></div>
            <div><strong>12k+</strong><span>Sessions booked</span></div>
            <div><strong>4.8</strong><span>Average rating</span></div>
            <div><strong>24/7</strong><span>Artist support</span></div>
          </div>
          <p className="eyf-muted">
            Explore featured spaces, compare amenities, and move from discovery to checkout in one guided flow.
          </p>
        </div>
      </section>

      <section className="eyf-section">
        <SectionHeading
          eyebrow="Featured studios"
          title="Browse the spaces leading the marketplace"
          description="Each listing includes real pricing, studio amenities, verified reviews, and clear paths into booking or dashboards."
          action={<Link className="eyf-link-button" to="/discover">View all studios</Link>}
        />
        <div className="eyf-card-grid">
          {featured.map((studio) => (
            <StudioCard
              key={studio.id}
              studio={studio}
              isFavorite={favoriteStudioIds.includes(studio.id)}
              onFavoriteToggle={toggleFavorite}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
