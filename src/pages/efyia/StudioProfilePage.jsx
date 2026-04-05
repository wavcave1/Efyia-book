import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { studiosApi } from '../../lib/api';
import { useAppContext } from '../../context/AppContext';
import { Badge, EmptyState, ErrorMessage, Spinner, Stars } from '../../components/efyia/ui';

export default function StudioProfilePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { favoriteStudioIds, toggleFavorite, currentUser } = useAppContext();

  const [studio, setStudio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('overview');

  const fetchStudio = () => {
    setLoading(true);
    setError(null);
    studiosApi.getBySlug(slug)
      .then((data) => {
        setStudio(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.status === 404) {
          navigate('/discover', { replace: true });
        } else {
          setError(err.message);
          setLoading(false);
        }
      });
  };

  useEffect(() => { fetchStudio(); }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="eyf-page">
        <section className="eyf-section"><Spinner /></section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="eyf-page">
        <section className="eyf-section">
          <ErrorMessage message={error} onRetry={fetchStudio} />
        </section>
      </div>
    );
  }

  if (!studio) return null;

  const isFavorite = favoriteStudioIds.includes(studio.id);
  const reviews = studio.reviews || [];

  return (
    <div className="eyf-page">
      <section className="eyf-section eyf-profile-layout">
        <div className="eyf-profile-main">
          <Link className="eyf-link-button eyf-link-button--ghost" to="/discover">← Back to results</Link>
          <div className="eyf-profile-hero" style={{ '--studio-color': studio.color || '#62f3d4' }}>
            <div>
              <div className="eyf-row">
                {studio.featured ? <Badge tone="mint">Featured</Badge> : null}
                {studio.verified ? <Badge tone="sage">Verified</Badge> : null}
              </div>
              <h1>{studio.name}</h1>
              <p className="eyf-muted">{studio.address}</p>
            </div>
            {currentUser ? (
              <button
                type="button"
                className="eyf-button eyf-button--ghost"
                onClick={() => toggleFavorite(studio.id)}
                aria-label={isFavorite ? 'Remove from saved studios' : 'Save studio'}
              >
                {isFavorite ? 'Saved ♥' : 'Save ♡'}
              </button>
            ) : null}
          </div>

          <div className="eyf-tabs">
            {['overview', 'equipment', 'reviews'].map((item) => (
              <button
                key={item}
                type="button"
                className={tab === item ? 'is-active' : ''}
                onClick={() => setTab(item)}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
                {item === 'reviews' ? ` (${reviews.length})` : ''}
              </button>
            ))}
          </div>

          {tab === 'overview' ? (
            <div className="eyf-card eyf-stack">
              <div className="eyf-row">
                <Stars rating={studio.rating || 0} />
                <span className="eyf-muted">{studio.rating} average · {studio.reviewCount} review{studio.reviewCount !== 1 ? 's' : ''}</span>
              </div>
              <p>{studio.description}</p>
              {(studio.amenities || []).length > 0 ? (
                <div>
                  <h3>Amenities</h3>
                  <div className="eyf-tags">
                    {studio.amenities.map((item) => (
                      <span key={item} className="eyf-tag">{item}</span>
                    ))}
                  </div>
                </div>
              ) : null}
              {(studio.sessionTypes || []).length > 0 ? (
                <div>
                  <h3>Session types</h3>
                  <div className="eyf-tags">
                    {studio.sessionTypes.map((item) => (
                      <Badge key={item} tone="sage">{item}</Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === 'equipment' ? (
            (studio.equipment || []).length > 0 ? (
              <div className="eyf-card-grid">
                {studio.equipment.map((item) => (
                  <div key={item} className="eyf-card"><strong>{item}</strong></div>
                ))}
              </div>
            ) : (
              <EmptyState title="No equipment listed" description="The studio owner has not added equipment details yet." />
            )
          ) : null}

          {tab === 'reviews' ? (
            reviews.length > 0 ? (
              <div className="eyf-stack">
                {reviews.map((review) => (
                  <article key={review.id} className="eyf-card eyf-stack">
                    <div className="eyf-row eyf-row--between eyf-row--start">
                      <div className="eyf-row">
                        <strong>{review.user?.name || 'Client'}</strong>
                        <Badge tone="sage">Verified</Badge>
                      </div>
                      <span className="eyf-muted">
                        {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <Stars rating={review.rating} />
                    <p>{review.content}</p>
                    {review.ownerReply ? (
                      <div className="eyf-reply">
                        <strong>Studio reply: </strong>{review.ownerReply}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No reviews yet"
                description="Reviews appear here after verified bookings are completed."
              />
            )
          ) : null}
        </div>

        <aside className="eyf-card eyf-booking-sidebar">
          <div className="eyf-row eyf-row--between">
            <h2>${studio.pricePerHour}/hr</h2>
            <span className="eyf-muted">{studio.rating} ★ · {studio.reviewCount} reviews</span>
          </div>
          <p className="eyf-muted">{studio.city}, {studio.state}</p>
          {currentUser ? (
            <Link className="eyf-button" to={`/booking/${studio.id}`}>
              Book now
            </Link>
          ) : (
            <Link className="eyf-button" to="/login" state={{ from: { pathname: `/booking/${studio.id}` } }}>
              Sign in to book
            </Link>
          )}
          <Link className="eyf-button eyf-button--secondary" to="/map">View on map</Link>
        </aside>
      </section>
    </div>
  );
}
