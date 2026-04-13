import { Link } from 'react-router-dom';
import { getDisplayLocation } from '../../lib/location';

function Stars({ rating, accent }) {
  return (
    <span className="sp-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ color: n <= Math.round(rating) ? accent : '#aaa' }}>★</span>
      ))}
    </span>
  );
}

export default function LayoutSplit({ studio }) {
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
    reviews,
    id,
  } = studio;

  return (
    <div className="sp-split">
      {/* Sticky left panel */}
      <aside
        className="sp-split-aside"
        style={{
          backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
          backgroundColor: coverUrl ? undefined : accentColor,
        }}
      >
        <div className="sp-split-aside-inner">
          {logoUrl ? <img src={logoUrl} alt={`${name} logo`} className="sp-logo sp-logo--light" /> : null}
          <h1 className="sp-heading-split">{name}</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem' }}>
            {locationLabel || [city, state].filter(Boolean).join(', ')}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem' }}>
            ${pricePerHour}/hr
          </p>
          {rating > 0 ? (
            <p className="sp-rating-row">
              <Stars rating={rating} accent="white" />
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                {rating.toFixed(1)} ({reviewCount})
              </span>
            </p>
          ) : null}
          {sessionTypes?.length ? (
            <div className="sp-tags sp-tags--hero" style={{ marginTop: '1rem' }}>
              {sessionTypes.map((t) => (
                <span key={t} className="sp-tag sp-tag--hero">{t}</span>
              ))}
            </div>
          ) : null}
          <Link
            to={`/booking/${id}`}
            className="sp-button-primary"
            style={{ marginTop: 'auto', background: 'white', color: '#111' }}
          >
            Book a session
          </Link>
          {socialLinks ? (
            <div className="sp-social-row" style={{ marginTop: '1rem' }}>
              {Object.entries(socialLinks)
                .filter(([, v]) => v)
                .map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sp-social-link sp-social-link--light"
                  >
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </a>
                ))}
            </div>
          ) : null}
        </div>
      </aside>

      {/* Scrollable right content */}
      <main className="sp-split-main">
        <p className="sp-body-text">{richDescription || description}</p>

        {services?.length ? (
          <section className="sp-section">
            <h2 className="sp-heading-md" style={{ color: accentColor }}>Services</h2>
            <div className="sp-services-list">
              {services.map((svc, i) => (
                <div key={i} className="sp-service-row">
                  <div>
                    <strong>{svc.name}</strong>
                    {svc.description ? <p>{svc.description}</p> : null}
                  </div>
                  {svc.price != null ? (
                    <span className="sp-service-price">
                      ${svc.price}
                      {svc.unit ? <span className="sp-muted">/{svc.unit}</span> : null}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="sp-two-col">
          {amenities?.length ? (
            <section className="sp-section">
              <h2 className="sp-heading-md" style={{ color: accentColor }}>Amenities</h2>
              <ul className="sp-list">
                {amenities.map((a) => <li key={a}>{a}</li>)}
              </ul>
            </section>
          ) : null}
          {equipment?.length ? (
            <section className="sp-section">
              <h2 className="sp-heading-md" style={{ color: accentColor }}>Equipment</h2>
              <ul className="sp-list">
                {equipment.map((e) => <li key={e}>{e}</li>)}
              </ul>
            </section>
          ) : null}
        </div>

        {contactInfo?.phone || contactInfo?.email ? (
          <section className="sp-section">
            <h2 className="sp-heading-md" style={{ color: accentColor }}>Contact</h2>
            {contactInfo.phone ? <p>📞 {contactInfo.phone}</p> : null}
            {contactInfo.email ? (
              <p>✉ <a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a></p>
            ) : null}
          </section>
        ) : null}

        {reviews?.length ? (
          <section className="sp-section">
            <h2 className="sp-heading-md" style={{ color: accentColor }}>Reviews</h2>
            <div className="sp-reviews">
              {reviews.slice(0, 4).map((r) => (
                <div key={r.id} className="sp-review-card">
                  <div className="sp-review-header">
                    <strong>{r.user?.name}</strong>
                    <span style={{ color: accentColor }}>{'★'.repeat(r.rating)}</span>
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
      </main>
    </div>
  );
}
