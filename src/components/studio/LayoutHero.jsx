import { Link } from 'react-router-dom';
import { getDisplayLocation } from '../../lib/location';

function Stars({ rating }) {
  return (
    <span className="sp-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ color: n <= Math.round(rating) ? 'var(--studio-accent)' : 'rgba(255,255,255,0.4)' }}>
          ★
        </span>
      ))}
    </span>
  );
}

function SocialRow({ links }) {
  if (!links) return null;
  const items = Object.entries(links).filter(([, v]) => v);
  if (!items.length) return null;
  return (
    <div className="sp-social-row">
      {items.map(([platform, url]) => (
        <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="sp-social-link sp-social-link--light">
          {platform.charAt(0).toUpperCase() + platform.slice(1)}
        </a>
      ))}
    </div>
  );
}

export default function LayoutHero({ studio }) {
  const locationLabel = getDisplayLocation(studio);
  const {
    name,
    richDescription,
    description,
    logoUrl,
    coverUrl,
    accentColor,
    tags,
    amenities,
    equipment,
    sessionTypes,
    pricePerHour,
    city,
    state,
    rating,
    reviewCount,
    services,
    socialLinks,
    contactInfo,
    gallery,
    reviews,
    id,
  } = studio;

  return (
    <div className="sp-hero">
      {/* Hero section */}
      <div
        className="sp-hero-banner"
        style={{
          backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
          backgroundColor: coverUrl ? undefined : accentColor,
        }}
      >
        <div className="sp-hero-overlay">
          <div className="sp-hero-inner">
            {logoUrl ? <img src={logoUrl} alt={`${name} logo`} className="sp-logo sp-logo--light" /> : null}
            <h1 className="sp-heading-hero">{name}</h1>
            <p className="sp-hero-sub">
              {locationLabel || [city, state].filter(Boolean).join(', ')} · ${pricePerHour}/hr
            </p>
            {rating > 0 ? (
              <p className="sp-rating-row">
                <Stars rating={rating} />
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                  {rating.toFixed(1)} ({reviewCount})
                </span>
              </p>
            ) : null}
            {sessionTypes?.length ? (
              <div className="sp-tags sp-tags--hero">
                {sessionTypes.map((t) => (
                  <span key={t} className="sp-tag sp-tag--hero">
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="sp-hero-actions">
              <Link
                to={`/booking/${id}`}
                className="sp-button-primary"
                style={{ background: accentColor, color: '#111' }}
              >
                Book a session
              </Link>
            </div>
            <SocialRow links={socialLinks} />
          </div>
        </div>
      </div>

      {/* Content below hero */}
      <div className="sp-hero-content">
        <p className="sp-body-text">{richDescription || description}</p>

        {gallery?.length ? (
          <section className="sp-section">
            <h2 className="sp-heading-md">Gallery</h2>
            <div className="sp-gallery">
              {gallery.map((img, i) => (
                <div key={i} className="sp-gallery-item">
                  <img
                    src={img.url}
                    alt={img.caption || `Studio photo ${i + 1}`}
                    loading="lazy"
                  />
                  {img.caption ? (
                    <span className="sp-gallery-item__caption">{img.caption}</span>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {services?.length ? (
          <section className="sp-section">
            <h2 className="sp-heading-md">Services</h2>
            <div className="sp-services-grid">
              {services.map((svc, i) => (
                <div key={i} className="sp-service-card">
                  <strong>{svc.name}</strong>
                  {svc.description ? <p>{svc.description}</p> : null}
                  {svc.price != null ? (
                    <p className="sp-service-price-hero">
                      ${svc.price}
                      {svc.unit ? `/${svc.unit}` : ''}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="sp-two-col">
          {amenities?.length ? (
            <section className="sp-section">
              <h2 className="sp-heading-md">Amenities</h2>
              <ul className="sp-list">
                {amenities.map((a) => <li key={a}>{a}</li>)}
              </ul>
            </section>
          ) : null}
          {equipment?.length ? (
            <section className="sp-section">
              <h2 className="sp-heading-md">Equipment</h2>
              <ul className="sp-list">
                {equipment.map((e) => <li key={e}>{e}</li>)}
              </ul>
            </section>
          ) : null}
        </div>

        {contactInfo?.phone || contactInfo?.email ? (
          <section className="sp-section">
            <h2 className="sp-heading-md">Contact</h2>
            {contactInfo.phone ? <p>📞 {contactInfo.phone}</p> : null}
            {contactInfo.email ? (
              <p>✉ <a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a></p>
            ) : null}
          </section>
        ) : null}

        {reviews?.length ? (
          <section className="sp-section">
            <h2 className="sp-heading-md">Reviews</h2>
            <div className="sp-reviews">
              {reviews.slice(0, 4).map((r) => (
                <div key={r.id} className="sp-review-card">
                  <div className="sp-review-header">
                    <strong>{r.user?.name}</strong>
                    <span style={{ color: 'var(--studio-accent)' }}>{'★'.repeat(r.rating)}</span>
                  </div>
                  <p>{r.content}</p>
                  {r.ownerReply ? (
                    <p className="sp-owner-reply"><strong>Studio reply:</strong> {r.ownerReply}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
