import { Link } from 'react-router-dom';

function Stars({ rating }) {
  return (
    <span className="sp-stars" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ color: n <= Math.round(rating) ? 'var(--studio-accent)' : '#555' }}>
          ★
        </span>
      ))}
    </span>
  );
}

function ServicesList({ services }) {
  if (!services?.length) return null;
  return (
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
  );
}

function SocialRow({ links }) {
  if (!links) return null;
  const items = Object.entries(links).filter(([, v]) => v);
  if (!items.length) return null;
  return (
    <div className="sp-social-row">
      {items.map(([platform, url]) => (
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
  );
}

export default function LayoutMinimal({ studio }) {
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
    address,
    rating,
    reviewCount,
    services,
    socialLinks,
    contactInfo,
    reviews,
    id,
  } = studio;

  return (
    <div className="sp-minimal">
      {coverUrl ? (
        <div
          className="sp-minimal-cover"
          style={{ backgroundImage: `url(${coverUrl})` }}
          aria-hidden="true"
        />
      ) : (
        <div className="sp-minimal-cover sp-minimal-cover--color" style={{ background: accentColor }} />
      )}

      <div className="sp-minimal-body">
        <header className="sp-minimal-header">
          {logoUrl ? (
            <img src={logoUrl} alt={`${name} logo`} className="sp-logo" />
          ) : null}
          <div>
            <h1 className="sp-heading-xl">{name}</h1>
            <p className="sp-muted">
              {city}, {state} · ${pricePerHour}/hr
            </p>
            {rating > 0 ? (
              <p className="sp-rating-row">
                <Stars rating={rating} />
                <span className="sp-muted">{rating.toFixed(1)} ({reviewCount} reviews)</span>
              </p>
            ) : null}
          </div>
        </header>

        <p className="sp-body-text">{richDescription || description}</p>

        {sessionTypes?.length ? (
          <div className="sp-tags">
            {sessionTypes.map((t) => (
              <span key={t} className="sp-tag" style={{ borderColor: accentColor }}>
                {t}
              </span>
            ))}
          </div>
        ) : null}

        {services?.length ? (
          <section className="sp-section">
            <h2 className="sp-heading-md">Services</h2>
            <ServicesList services={services} />
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

        {contactInfo || socialLinks ? (
          <section className="sp-section">
            <h2 className="sp-heading-md">Connect</h2>
            {contactInfo?.phone ? <p>📞 {contactInfo.phone}</p> : null}
            {contactInfo?.email ? (
              <p>
                ✉ <a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a>
              </p>
            ) : null}
            <SocialRow links={socialLinks} />
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
                    <Stars rating={r.rating} />
                  </div>
                  <p>{r.content}</p>
                  {r.ownerReply ? (
                    <p className="sp-owner-reply">
                      <strong>Studio reply:</strong> {r.ownerReply}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="sp-cta-row">
          <Link
            to={`/booking/${id}`}
            className="sp-button-primary"
            style={{ background: accentColor }}
          >
            Book a session
          </Link>
          {contactInfo?.bookingUrl ? (
            <a
              href={contactInfo.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="sp-button-ghost"
            >
              External booking
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
