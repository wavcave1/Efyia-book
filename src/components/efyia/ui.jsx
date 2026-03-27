import { Link } from 'react-router-dom';
import { BRAND } from '../../data/efyiaData';

export function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="eyf-section-heading">
      {eyebrow ? <p className="eyf-eyebrow">{eyebrow}</p> : null}
      <div className="eyf-section-heading__row">
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action}
      </div>
    </div>
  );
}

export function Stars({ rating }) {
  return (
    <span className="eyf-stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <span key={value} style={{ color: value <= Math.round(rating) ? '#f59e0b' : BRAND.border }}>
          ★
        </span>
      ))}
    </span>
  );
}

export function Badge({ children, tone = 'default' }) {
  return <span className={`eyf-badge eyf-badge--${tone}`}>{children}</span>;
}

export function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="eyf-toast" role="status">
      <span>{message}</span>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="eyf-card eyf-empty">
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function StudioCard({ studio, onFavoriteToggle, isFavorite = false }) {
  return (
    <article className="eyf-card eyf-studio-card">
      <div className="eyf-studio-card__media" style={{ '--studio-color': studio.color }}>
        <div className="eyf-studio-card__badges">
          {studio.featured ? <Badge tone="mint">Featured</Badge> : null}
          {studio.verified ? <Badge tone="sage">Verified</Badge> : null}
        </div>
        <button type="button" className="eyf-favorite" onClick={() => onFavoriteToggle?.(studio.id)}>
          {isFavorite ? '♥' : '♡'}
        </button>
        <span className="eyf-price">${studio.pricePerHour}/hr</span>
      </div>
      <div className="eyf-studio-card__body">
        <div className="eyf-row eyf-row--between eyf-row--start">
          <div>
            <h3>{studio.name}</h3>
            <p className="eyf-muted">{studio.city}, {studio.state}</p>
          </div>
          <div className="eyf-rating-wrap">
            <Stars rating={studio.rating} />
            <span className="eyf-muted">{studio.rating} ({studio.reviewCount})</span>
          </div>
        </div>
        <div className="eyf-tags">
          {studio.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="eyf-tag">{tag}</span>
          ))}
        </div>
        <p className="eyf-muted">{studio.description}</p>
        <div className="eyf-row eyf-row--between">
          <Link className="eyf-link-button" to={`/studios/${studio.slug}`}>
            View profile
          </Link>
          <Link className="eyf-link-button eyf-link-button--ghost" to={`/booking/${studio.id}`}>
            Book now
          </Link>
        </div>
      </div>
    </article>
  );
}
