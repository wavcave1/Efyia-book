import { Link } from 'react-router-dom';

function Stars({ rating, accent }) {
  return (
    <span className="sp-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ color: n <= Math.round(rating) ? accent : '#aaa' }}>★</span>
      ))}
    </span>
  );
}

export default function LayoutGrid({ studio }) {
  const {
    name,
    richDescription,
    description,
    logoUrl,
    coverUrl,
    accentColor,
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
    <div className="sp-grid-layout">
      {/* Masthead */}
      <header className="sp-grid-masthead">
        <div
          className="sp-grid-masthead-bg"
          style={{
            backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
            backgroundColor: coverUrl ? undefined : accentColor,
          }}
        />
        <div className="sp-grid-masthead-inner">
          {logoUrl ? <img src={logoUrl} alt={`${name} logo`} className="sp-logo" /> : null}
          <h1 className="sp-heading-xl">{name}</h1>
          <p className="sp-muted">{city}, {state} · ${pricePerHour}/hr</p>
          {rating > 0 ? (
            <p className="sp-rating-row">
              <Stars rating={rating} accent={accentColor} />
              <span className="sp-muted">{rating.toFixed(1)} ({reviewCount})</span>
            </p>
          ) : null}
        </div>
      </header>

      <div className="sp-grid-body">
        {/* About */}
        <section className="sp-grid-about">
          <p className="sp-body-text">{richDescription || description}</p>
          {sessionTypes?.length ? (
            <div className="sp-tags" style={{ marginTop: '1rem' }}>
              {sessionTypes.map((t) => (
                <span key={t} className="sp-tag" style={{ borderColor: accentColor }}>
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        {/* Services grid */}
        {services?.length ? (
          <section className="sp-section">
            <h2 className="sp-heading-md">Services & Pricing</h2>
            <div className="sp-services-grid">
              {services.map((svc, i) => (
                <div
                  key={i}
                  className="sp-service-card"
                  style={{ borderTop: `3px solid ${accentColor}` }}
                >
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

        {/* Equipment + Amenities */}
        <div className="sp-grid-cols-3">
          {equipment?.length ? (
            <section className="sp-section">
              <h2 className="sp-heading-sm" style={{ color: accentColor }}>Equipment</h2>
              <ul className="sp-list">
                {equipment.map((e) => <li key={e}>{e}</li>)}
              </ul>
            </section>
          ) : null}

          {amenities?.length ? (
            <section className="sp-section">
              <h2 className="sp-heading-sm" style={{ color: accentColor }}>Amenities</h2>
              <ul className="sp-list">
                {amenities.map((a) => <li key={a}>{a}</li>)}
              </ul>
            </section>
          ) : null}

          <section className="sp-section sp-cta-card" style={{ borderColor: accentColor }}>
            <h2 className="sp-heading-sm">Ready to book?</h2>
            <p className="sp-muted">Starting at ${pricePerHour}/hr</p>
            <Link
              to={`/booking/${id}`}
              className="sp-button-primary"
              style={{ background: accentColor, display: 'block', textAlign: 'center' }}
            >
              Book now
            </Link>
            {contactInfo?.bookingUrl ? (
              <a
                href={contactInfo.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="sp-button-ghost"
                style={{ display: 'block', textAlign: 'center', marginTop: '0.5rem' }}
              >
                External booking
              </a>
            ) : null}
            {contactInfo?.phone ? <p style={{ marginTop: '0.75rem' }}>📞 {contactInfo.phone}</p> : null}
            {contactInfo?.email ? (
              <p>✉ <a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a></p>
            ) : null}
            {socialLinks ? (
              <div className="sp-social-row" style={{ marginTop: '0.75rem' }}>
                {Object.entries(socialLinks)
                  .filter(([, v]) => v)
                  .map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sp-social-link"
                    >
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </a>
                  ))}
              </div>
            ) : null}
          </section>
        </div>

        {/* Reviews */}
        {reviews?.length ? (
          <section className="sp-section">
            <h2 className="sp-heading-md">Reviews</h2>
            <div className="sp-reviews-grid">
              {reviews.slice(0, 6).map((r) => (
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
      </div>
    </div>
  );
}
