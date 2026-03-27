import { Link, useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Badge, EmptyState, Stars } from '../../components/efyia/ui';

export default function StudioProfilePage() {
  const { slug } = useParams();
  const { studios, reviews, favoriteStudioIds, toggleFavorite } = useAppContext();
  const studio = studios.find((item) => item.slug === slug) || studios[0];
  const studioReviews = useMemo(() => reviews.filter((item) => item.studioId === studio.id), [reviews, studio.id]);
  const [tab, setTab] = useState('overview');

  return (
    <div className="eyf-page">
      <section className="eyf-section eyf-profile-layout">
        <div className="eyf-profile-main">
          <Link className="eyf-link-button eyf-link-button--ghost" to="/discover">← Back to results</Link>
          <div className="eyf-profile-hero" style={{ '--studio-color': studio.color }}>
            <div>
              <div className="eyf-row">
                {studio.featured ? <Badge tone="mint">Featured</Badge> : null}
                {studio.verified ? <Badge tone="sage">Verified</Badge> : null}
              </div>
              <h1>{studio.name}</h1>
              <p className="eyf-muted">{studio.address}</p>
            </div>
            <button type="button" className="eyf-button eyf-button--ghost" onClick={() => toggleFavorite(studio.id)}>
              {favoriteStudioIds.includes(studio.id) ? 'Saved ♥' : 'Save ♡'}
            </button>
          </div>
          <div className="eyf-tabs">
            {['overview', 'equipment', 'reviews'].map((item) => (
              <button key={item} type="button" className={tab === item ? 'is-active' : ''} onClick={() => setTab(item)}>
                {item}
              </button>
            ))}
          </div>
          {tab === 'overview' ? (
            <div className="eyf-card eyf-stack">
              <div>
                <Stars rating={studio.rating} /> <span className="eyf-muted">{studio.rating} average rating</span>
              </div>
              <p>{studio.description}</p>
              <div>
                <h3>Amenities</h3>
                <div className="eyf-tags">
                  {studio.amenities.map((item) => <span key={item} className="eyf-tag">{item}</span>)}
                </div>
              </div>
              <div>
                <h3>Session types</h3>
                <div className="eyf-tags">
                  {studio.sessionTypes.map((item) => <Badge key={item} tone="sage">{item}</Badge>)}
                </div>
              </div>
            </div>
          ) : null}
          {tab === 'equipment' ? (
            <div className="eyf-card-grid">
              {studio.equipment.map((item) => <div key={item} className="eyf-card"><strong>{item}</strong></div>)}
            </div>
          ) : null}
          {tab === 'reviews' ? (
            studioReviews.length ? (
              <div className="eyf-stack">
                {studioReviews.map((review) => (
                  <article key={review.id} className="eyf-card eyf-stack">
                    <div className="eyf-row eyf-row--between eyf-row--start">
                      <div>
                        <strong>{review.userName}</strong>
                        {review.verified ? <Badge tone="sage">Verified</Badge> : null}
                      </div>
                      <span className="eyf-muted">{review.date}</span>
                    </div>
                    <Stars rating={review.rating} />
                    <p>{review.text}</p>
                    {review.ownerReply ? <div className="eyf-reply">Owner reply: {review.ownerReply}</div> : null}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="No reviews yet" description="Reviews will appear here after verified bookings are completed." />
            )
          ) : null}
        </div>
        <aside className="eyf-card eyf-booking-sidebar">
          <div className="eyf-row eyf-row--between">
            <h2>${studio.pricePerHour}/hr</h2>
            <span className="eyf-muted">{studio.rating} ★</span>
          </div>
          <p className="eyf-muted">Book a session, confirm the details, and move into the dashboard experience.</p>
          <Link className="eyf-button" to={`/booking/${studio.id}`}>Book now</Link>
          <Link className="eyf-button eyf-button--secondary" to="/map">View on map</Link>
        </aside>
      </section>
    </div>
  );
}
