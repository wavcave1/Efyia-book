import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { studiosApi } from '../../lib/api';
import { useAppContext } from '../../context/AppContext';
import { Badge, EmptyState, ErrorMessage, Spinner, Stars } from '../../components/efyia/ui';
import ProfileCustomizer from '../../components/studio/ProfileCustomizer';

// Converts a YouTube watch/share URL to an embed URL
function toEmbedUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') && u.pathname === '/watch') {
      return `https://www.youtube.com/embed/${u.searchParams.get('v')}`;
    }
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
  } catch {
    // already an embed URL or unknown format — return as-is
  }
  return url;
}

export default function StudioProfilePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { favoriteStudioIds, toggleFavorite, currentUser } = useAppContext();

  const [studio, setStudio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('overview');

  // Owner edit drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState('content');

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

  // Escape key closes drawer
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const openDrawer = (tabId) => {
    setDrawerTab(tabId);
    setDrawerOpen(true);
  };

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
  const isOwner = currentUser?.role?.toLowerCase() === 'owner'
    && (studio.ownerId === currentUser?.id || studio.owner?.id === currentUser?.id);

  const gallery = studio.gallery || [];
  const credits = studio.credits || [];
  const achievements = studio.achievements || [];
  const portfolio = studio.portfolio || [];
  const team = studio.team || [];
  const genres = studio.genres || [];
  const testimonials = studio.testimonials || [];
  const bookingInfo = studio.bookingInfo || {};

  const hasPortfolio = portfolio.length > 0 || achievements.length > 0;
  const tabList = ['overview', 'portfolio', 'equipment', 'reviews'];

  return (
    <div className="eyf-page">
      {/* Owner banner */}
      {isOwner ? (
        <div className="eyf-owner-banner">
          <span className="eyf-owner-banner__text">You are viewing your public profile</span>
          <div className="eyf-row">
            <button
              type="button"
              className="eyf-button eyf-button--ghost"
              style={{ minHeight: 'unset', padding: '0.35rem 0.85rem', fontSize: '0.82rem' }}
              onClick={() => openDrawer('content')}
            >
              Edit profile
            </button>
            {studio.slug ? (
              <Link
                to={`/s/${studio.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="eyf-button eyf-button--ghost"
                style={{ minHeight: 'unset', padding: '0.35rem 0.85rem', fontSize: '0.82rem' }}
              >
                Custom page ↗
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <section className="eyf-section eyf-profile-layout">
        <div className="eyf-profile-main">
          <Link className="eyf-link-button eyf-link-button--ghost" to="/discover">← Back to results</Link>

          {/* Hero */}
          <div className="eyf-profile-hero eyf-editable-section" style={{ '--studio-color': studio.color || '#62f3d4' }}>
            <div>
              <div className="eyf-row">
                {studio.featured ? <Badge tone="mint">Featured</Badge> : null}
                {studio.verified ? <Badge tone="sage">Verified</Badge> : null}
              </div>
              <h1>{studio.name}</h1>
              <p className="eyf-muted">{studio.address || `${studio.city}${studio.state ? `, ${studio.state}` : ''}`}</p>
              {genres.length > 0 ? (
                <div className="eyf-genre-chips" style={{ marginTop: '0.5rem' }}>
                  {genres.map((g) => <span key={g} className="eyf-genre-chip">{g}</span>)}
                </div>
              ) : null}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
              {currentUser && !isOwner ? (
                <button
                  type="button"
                  className="eyf-button eyf-button--ghost"
                  onClick={() => toggleFavorite(studio.id)}
                  aria-label={isFavorite ? 'Remove from saved studios' : 'Save studio'}
                >
                  {isFavorite ? 'Saved ♥' : 'Save ♡'}
                </button>
              ) : null}
              {isOwner ? (
                <button type="button" className="eyf-edit-trigger" onClick={() => openDrawer('content')}>
                  Edit
                </button>
              ) : null}
            </div>
          </div>

          {/* Gallery strip */}
          {gallery.length > 0 ? (
            <div className="eyf-editable-section">
              <div className="eyf-gallery-strip">
                {gallery.map((item, i) => (
                  <div key={i} className="eyf-gallery-item">
                    <img src={item.url} alt={item.caption || `Studio photo ${i + 1}`} loading="lazy" />
                  </div>
                ))}
              </div>
              {isOwner ? (
                <button type="button" className="eyf-edit-trigger" style={{ position: 'absolute', top: '0.5rem', right: 0 }} onClick={() => openDrawer('gallery')}>
                  Edit gallery
                </button>
              ) : null}
            </div>
          ) : isOwner ? (
            <button
              type="button"
              className="eyf-add-prompt"
              onClick={() => openDrawer('gallery')}
              style={{ marginBottom: '1rem' }}
            >
              <span className="eyf-add-prompt__label">+ Add studio photos</span>
              <span className="eyf-add-prompt__sub">Control room, live room, equipment — give clients a feel for the space</span>
            </button>
          ) : null}

          {/* Tabs */}
          <div className="eyf-tabs">
            {tabList.map((item) => (
              <button
                key={item}
                type="button"
                className={tab === item ? 'is-active' : ''}
                onClick={() => setTab(item)}
              >
                {item === 'portfolio' ? 'Portfolio' : item.charAt(0).toUpperCase() + item.slice(1)}
                {item === 'reviews' ? ` (${reviews.length})` : ''}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {tab === 'overview' ? (
            <div className="eyf-stack">
              {/* Rating */}
              <div className="eyf-card eyf-row">
                <Stars rating={studio.rating || 0} />
                <span className="eyf-muted">{studio.rating} average · {studio.reviewCount} review{studio.reviewCount !== 1 ? 's' : ''}</span>
              </div>

              {/* Description */}
              <div className="eyf-card eyf-editable-section">
                {studio.description || studio.richDescription ? (
                  <div>
                    {studio.richDescription ? (
                      <p style={{ whiteSpace: 'pre-line', lineHeight: 1.75 }}>{studio.richDescription}</p>
                    ) : (
                      <p>{studio.description}</p>
                    )}
                  </div>
                ) : isOwner ? (
                  <button type="button" className="eyf-add-prompt" onClick={() => openDrawer('content')} style={{ border: 'none', padding: '1rem 0', background: 'none', width: '100%', textAlign: 'left' }}>
                    <span className="eyf-add-prompt__label">+ Add your studio story</span>
                    <span className="eyf-add-prompt__sub">Tell clients what makes your studio special</span>
                  </button>
                ) : (
                  <p className="eyf-muted">No description yet.</p>
                )}
                {isOwner ? (
                  <button type="button" className="eyf-edit-trigger" onClick={() => openDrawer('content')}>Edit</button>
                ) : null}
              </div>

              {/* Amenities */}
              {(studio.amenities || []).length > 0 ? (
                <div className="eyf-card eyf-editable-section">
                  <h3>Amenities</h3>
                  <div className="eyf-tags">
                    {studio.amenities.map((item) => (
                      <span key={item} className="eyf-tag">{item}</span>
                    ))}
                  </div>
                  {isOwner ? (
                    <button type="button" className="eyf-edit-trigger" onClick={() => openDrawer('discovery')}>Edit</button>
                  ) : null}
                </div>
              ) : isOwner ? (
                <button type="button" className="eyf-add-prompt" onClick={() => openDrawer('discovery')}>
                  <span className="eyf-add-prompt__label">+ Add amenities</span>
                  <span className="eyf-add-prompt__sub">Parking, lounge, Wi-Fi, isolated booth…</span>
                </button>
              ) : null}

              {/* Session types */}
              {(studio.sessionTypes || []).length > 0 ? (
                <div className="eyf-card">
                  <h3>Session types</h3>
                  <div className="eyf-tags">
                    {studio.sessionTypes.map((item) => (
                      <Badge key={item} tone="sage">{item}</Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Services */}
              {(studio.services || []).length > 0 ? (
                <div className="eyf-card eyf-editable-section">
                  <h3>Services</h3>
                  <div className="eyf-stack" style={{ gap: '0.75rem' }}>
                    {studio.services.map((svc, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', padding: '0.75rem 0', borderBottom: i < studio.services.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                        <div>
                          <strong>{svc.name}</strong>
                          {svc.description ? <p className="eyf-muted" style={{ margin: '0.2rem 0 0', fontSize: '0.875rem' }}>{svc.description}</p> : null}
                        </div>
                        {svc.price ? (
                          <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                            ${svc.price}/{svc.unit || 'hr'}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  {isOwner ? (
                    <button type="button" className="eyf-edit-trigger" onClick={() => openDrawer('services')}>Edit</button>
                  ) : null}
                </div>
              ) : isOwner ? (
                <button type="button" className="eyf-add-prompt" onClick={() => openDrawer('services')}>
                  <span className="eyf-add-prompt__label">+ Add services</span>
                  <span className="eyf-add-prompt__sub">Recording, mixing, mastering, podcast recording…</span>
                </button>
              ) : null}

              {/* Credits */}
              {credits.length > 0 ? (
                <div className="eyf-card eyf-editable-section">
                  <h3>Credits</h3>
                  <div className="eyf-credits-list">
                    {credits.map((c, i) => (
                      <div key={i} className="eyf-credit-row">
                        <strong className="eyf-credit-artist">{c.artistName}</strong>
                        <span className="eyf-credit-meta">
                          {c.projectName ? `${c.projectName}` : ''}
                          {c.projectName && c.role ? ' · ' : ''}
                          {c.role}
                          {c.link ? (
                            <a href={c.link} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '0.5rem', color: 'var(--mint)' }}>↗</a>
                          ) : null}
                        </span>
                        <span className="eyf-credit-year">{c.year}</span>
                      </div>
                    ))}
                  </div>
                  {isOwner ? (
                    <button type="button" className="eyf-edit-trigger" onClick={() => openDrawer('credits')}>Edit</button>
                  ) : null}
                </div>
              ) : isOwner ? (
                <button type="button" className="eyf-add-prompt" onClick={() => openDrawer('credits')}>
                  <span className="eyf-add-prompt__label">+ Add credits</span>
                  <span className="eyf-add-prompt__sub">Artists, albums, and projects you've worked on</span>
                </button>
              ) : null}

              {/* Team */}
              {team.length > 0 ? (
                <div className="eyf-card eyf-editable-section">
                  <h3>Team</h3>
                  <div className="eyf-team-grid">
                    {team.map((m, i) => (
                      <div key={i} className="eyf-card eyf-team-card">
                        {m.photoUrl ? (
                          <img src={m.photoUrl} alt={m.name} className="eyf-team-photo" onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : (
                          <div className="eyf-team-avatar">{(m.name || '?').charAt(0).toUpperCase()}</div>
                        )}
                        <strong style={{ display: 'block', fontSize: '0.95rem' }}>{m.name}</strong>
                        {m.role ? <span className="eyf-muted" style={{ fontSize: '0.82rem' }}>{m.role}</span> : null}
                        {m.bio ? <p className="eyf-muted" style={{ fontSize: '0.82rem', margin: '0.4rem 0 0', lineHeight: 1.5 }}>{m.bio}</p> : null}
                      </div>
                    ))}
                  </div>
                  {isOwner ? (
                    <button type="button" className="eyf-edit-trigger" onClick={() => openDrawer('team')}>Edit</button>
                  ) : null}
                </div>
              ) : isOwner ? (
                <button type="button" className="eyf-add-prompt" onClick={() => openDrawer('team')}>
                  <span className="eyf-add-prompt__label">+ Add team members</span>
                  <span className="eyf-add-prompt__sub">Engineers, producers, vocal coaches</span>
                </button>
              ) : null}

              {/* Booking info */}
              {(bookingInfo.notes || bookingInfo.minHours) ? (
                <div className="eyf-card eyf-editable-section">
                  <h3>Booking info</h3>
                  {bookingInfo.minHours || bookingInfo.maxHours ? (
                    <p className="eyf-muted">
                      Sessions: {bookingInfo.minHours ? `${bookingInfo.minHours}hr min` : ''}
                      {bookingInfo.minHours && bookingInfo.maxHours ? ' · ' : ''}
                      {bookingInfo.maxHours ? `${bookingInfo.maxHours}hr max` : ''}
                      {bookingInfo.advanceNoticeDays ? ` · ${bookingInfo.advanceNoticeDays} day notice required` : ''}
                    </p>
                  ) : null}
                  {bookingInfo.notes ? <p style={{ lineHeight: 1.65 }}>{bookingInfo.notes}</p> : null}
                  {isOwner ? (
                    <button type="button" className="eyf-edit-trigger" onClick={() => openDrawer('team')}>Edit</button>
                  ) : null}
                </div>
              ) : null}

              {/* Testimonials */}
              {testimonials.length > 0 ? (
                <div className="eyf-card eyf-editable-section">
                  <h3>What clients say</h3>
                  <div className="eyf-stack">
                    {testimonials.map((t, i) => (
                      <div key={i} className="eyf-reply">
                        <p style={{ margin: '0 0 0.5rem', fontStyle: 'italic', lineHeight: 1.65 }}>"{t.quote}"</p>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t.authorName}</span>
                        {t.authorRole ? <span className="eyf-muted" style={{ fontSize: '0.82rem' }}> · {t.authorRole}</span> : null}
                      </div>
                    ))}
                  </div>
                  {isOwner ? (
                    <button type="button" className="eyf-edit-trigger" onClick={() => openDrawer('discovery')}>Edit</button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Portfolio tab */}
          {tab === 'portfolio' ? (
            <div className="eyf-stack">
              {portfolio.length > 0 ? (
                <div className="eyf-card eyf-editable-section">
                  <h3>Audio &amp; Video</h3>
                  <div className="eyf-portfolio-grid" style={{ marginTop: '1rem' }}>
                    {portfolio.map((item, i) => {
                      const embedUrl = toEmbedUrl(item.embedUrl);
                      return (
                        <div key={i} className="eyf-card eyf-portfolio-card">
                          {embedUrl ? (
                            <div className="eyf-portfolio-card__embed">
                              <iframe
                                src={embedUrl}
                                title={item.title || `Portfolio ${i + 1}`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          ) : null}
                          <div className="eyf-portfolio-card__body">
                            {item.title ? <strong style={{ display: 'block' }}>{item.title}</strong> : null}
                            {item.artistName || item.trackName ? (
                              <p className="eyf-muted" style={{ margin: '0.2rem 0 0', fontSize: '0.875rem' }}>
                                {item.artistName}{item.artistName && item.trackName ? ' · ' : ''}{item.trackName}
                              </p>
                            ) : null}
                            {item.serviceType ? <Badge tone="sage">{item.serviceType}</Badge> : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {isOwner ? (
                    <button type="button" className="eyf-edit-trigger" onClick={() => openDrawer('portfolio')}>Edit</button>
                  ) : null}
                </div>
              ) : isOwner ? (
                <button type="button" className="eyf-add-prompt" onClick={() => openDrawer('portfolio')}>
                  <span className="eyf-add-prompt__label">+ Add portfolio samples</span>
                  <span className="eyf-add-prompt__sub">YouTube, SoundCloud, before/after demos</span>
                </button>
              ) : (
                <EmptyState title="No portfolio yet" description="The studio owner hasn't added any portfolio samples." />
              )}

              {achievements.length > 0 ? (
                <div className="eyf-card eyf-editable-section">
                  <h3>Achievements &amp; Recognition</h3>
                  <div className="eyf-achievements-list" style={{ marginTop: '0.5rem' }}>
                    {achievements.map((a, i) => (
                      <div key={i} className="eyf-achievement-row">
                        <strong>{a.title}</strong>
                        <span className="eyf-achievement-meta">
                          {a.org}{a.org && a.year ? ' · ' : ''}{a.year}
                        </span>
                      </div>
                    ))}
                  </div>
                  {isOwner ? (
                    <button type="button" className="eyf-edit-trigger" onClick={() => openDrawer('portfolio')}>Edit</button>
                  ) : null}
                </div>
              ) : isOwner && portfolio.length > 0 ? (
                <button type="button" className="eyf-add-prompt" onClick={() => openDrawer('portfolio')}>
                  <span className="eyf-add-prompt__label">+ Add achievements</span>
                  <span className="eyf-add-prompt__sub">Awards, press features, certifications</span>
                </button>
              ) : null}
            </div>
          ) : null}

          {/* Equipment tab */}
          {tab === 'equipment' ? (
            <div className="eyf-stack">
              {(studio.equipment || []).length > 0 ? (
                <div className="eyf-card-grid">
                  {studio.equipment.map((item) => (
                    <div key={item} className="eyf-card"><strong>{item}</strong></div>
                  ))}
                </div>
              ) : null}

              {/* Studio specs */}
              {studio.studioSpecs ? (
                <div className="eyf-card eyf-editable-section">
                  <h3>Studio specs</h3>
                  <div className="eyf-stack" style={{ gap: '0.75rem', marginTop: '0.5rem' }}>
                    {studio.studioSpecs.consoleType ? (
                      <div>
                        <strong style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>Console</strong>
                        <p style={{ margin: '0.2rem 0 0' }}>{studio.studioSpecs.consoleType}</p>
                      </div>
                    ) : null}
                    {studio.studioSpecs.daws?.length ? (
                      <div>
                        <strong style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>DAWs</strong>
                        <div className="eyf-tags" style={{ marginTop: '0.3rem' }}>
                          {(Array.isArray(studio.studioSpecs.daws) ? studio.studioSpecs.daws : [studio.studioSpecs.daws]).map((d) => (
                            <span key={d} className="eyf-tag">{d}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {studio.studioSpecs.mics?.length ? (
                      <div>
                        <strong style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>Microphones</strong>
                        <div className="eyf-tags" style={{ marginTop: '0.3rem' }}>
                          {(Array.isArray(studio.studioSpecs.mics) ? studio.studioSpecs.mics : [studio.studioSpecs.mics]).map((m) => (
                            <span key={m} className="eyf-tag">{m}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {studio.studioSpecs.outboardGear?.length ? (
                      <div>
                        <strong style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>Outboard gear</strong>
                        <div className="eyf-tags" style={{ marginTop: '0.3rem' }}>
                          {(Array.isArray(studio.studioSpecs.outboardGear) ? studio.studioSpecs.outboardGear : [studio.studioSpecs.outboardGear]).map((g) => (
                            <span key={g} className="eyf-tag">{g}</span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {studio.studioSpecs.rooms ? (
                      <div>
                        <strong style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>Rooms</strong>
                        <p style={{ margin: '0.2rem 0 0', lineHeight: 1.6 }}>{studio.studioSpecs.rooms}</p>
                      </div>
                    ) : null}
                  </div>
                  {isOwner ? (
                    <button type="button" className="eyf-edit-trigger" onClick={() => openDrawer('team')}>Edit</button>
                  ) : null}
                </div>
              ) : null}

              {!studio.equipment?.length && !studio.studioSpecs ? (
                isOwner ? (
                  <button type="button" className="eyf-add-prompt" onClick={() => openDrawer('team')}>
                    <span className="eyf-add-prompt__label">+ Add studio specs & equipment</span>
                    <span className="eyf-add-prompt__sub">Console, DAWs, mics, outboard gear, room dimensions</span>
                  </button>
                ) : (
                  <EmptyState title="No equipment listed" description="The studio owner has not added equipment details yet." />
                )
              ) : null}
            </div>
          ) : null}

          {/* Reviews tab */}
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

        {/* Booking sidebar */}
        <aside className="eyf-card eyf-booking-sidebar">
          {studio.logoUrl ? (
            <img
              src={studio.logoUrl}
              alt={`${studio.name} logo`}
              style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8, marginBottom: '0.25rem' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : null}
          <div className="eyf-row eyf-row--between">
            <h2>${studio.pricePerHour}/hr</h2>
            <span className="eyf-muted">{studio.rating} ★ · {studio.reviewCount} reviews</span>
          </div>
          <p className="eyf-muted">{studio.city}, {studio.state}</p>

          {/* Social links */}
          {studio.socialLinks && Object.entries(studio.socialLinks).some(([, v]) => v) ? (
            <div className="eyf-tags">
              {Object.entries(studio.socialLinks)
                .filter(([, url]) => url)
                .map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="eyf-tag"
                    style={{ textDecoration: 'none', transition: 'border-color 0.15s, color 0.15s' }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--mint)'; e.currentTarget.style.color = 'var(--mint)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.color = ''; }}
                  >
                    {platform === 'website' ? '🌐' : platform === 'instagram' ? '📷' : platform === 'youtube' ? '▶' : platform === 'soundcloud' ? '☁' : '↗'} {platform}
                  </a>
                ))}
            </div>
          ) : isOwner ? (
            <button type="button" className="eyf-add-prompt" onClick={() => openDrawer('contact')} style={{ padding: '0.6rem 0.75rem', fontSize: '0.82rem' }}>
              <span className="eyf-add-prompt__label" style={{ fontSize: '0.82rem' }}>+ Add social links</span>
            </button>
          ) : null}

          {currentUser && !isOwner ? (
            <Link className="eyf-button" to={`/booking/${studio.id}`}>
              Book now
            </Link>
          ) : isOwner ? null : (
            <Link className="eyf-button" to="/login" state={{ from: { pathname: `/booking/${studio.id}` } }}>
              Sign in to book
            </Link>
          )}
          <Link className="eyf-button eyf-button--secondary" to="/map">View on map</Link>

          {isOwner ? (
            <button type="button" className="eyf-button eyf-button--ghost" onClick={() => openDrawer('branding')}>
              Customize branding & layout
            </button>
          ) : null}
        </aside>
      </section>

      {/* Edit drawer */}
      {drawerOpen ? (
        <>
          <div className="eyf-drawer-overlay" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div className="eyf-drawer" role="dialog" aria-label="Edit studio profile" aria-modal="true">
            <div className="eyf-drawer-header">
              <strong style={{ fontSize: '1.05rem' }}>Edit profile</strong>
              <button
                type="button"
                className="eyf-button eyf-button--ghost"
                style={{ minHeight: 'unset', padding: '0.35rem 0.75rem' }}
                onClick={() => setDrawerOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <ProfileCustomizer
              studio={studio}
              initialTab={drawerTab}
              onSaved={(updated) => {
                setStudio(updated);
                setDrawerOpen(false);
              }}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
