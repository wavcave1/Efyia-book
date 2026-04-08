import { useCallback, useEffect, useState } from 'react';
import { bookingsApi, studioProfileApi, studiosApi, usersApi } from '../../lib/api';
import { useAppContext } from '../../context/AppContext';
import { EmptyState, ErrorMessage, SectionHeading, Spinner, StudioCard } from '../../components/efyia/ui';
import ProfileSetupWizard from '../../components/studio/ProfileSetupWizard';

// ─── Booking status badge ─────────────────────────────────────────────────────
function BookingStatusBadge({ status }) {
  const map = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  };
  return (
    <span className={`eyf-badge eyf-badge--${map[status] || 'default'}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ─── Booking rows ─────────────────────────────────────────────────────────────
function BookingRows({ bookings, onStatusChange }) {
  if (!bookings.length) {
    return <EmptyState title="No bookings yet" description="Confirmed bookings will appear here." />;
  }

  return (
    <div className="eyf-stack">
      {bookings.map((booking) => (
        <article key={booking.id} className="eyf-card eyf-row eyf-row--between eyf-row--start">
          <div>
            <h3>{booking.studio?.name || 'Studio'}</h3>
            <p className="eyf-muted">
              {booking.user?.name} · {booking.date} · {booking.time} · {booking.sessionType} · {booking.hours}hr
            </p>
          </div>
          <div className="eyf-booking-meta">
            <BookingStatusBadge status={booking.status} />
            <strong>${booking.total?.toFixed(2)}</strong>
            {onStatusChange && booking.status === 'PENDING' ? (
              <button
                type="button"
                className="eyf-button eyf-button--secondary"
                style={{ padding: '0.4rem 0.75rem', minHeight: 'unset', fontSize: '0.85rem' }}
                onClick={() => onStatusChange(booking.id, 'CONFIRMED')}
              >
                Confirm
              </button>
            ) : null}
            {onStatusChange && booking.status === 'CONFIRMED' ? (
              <button
                type="button"
                className="eyf-button eyf-button--ghost"
                style={{ padding: '0.4rem 0.75rem', minHeight: 'unset', fontSize: '0.85rem' }}
                onClick={() => onStatusChange(booking.id, 'COMPLETED')}
              >
                Mark complete
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

// ─── Profile completion helper ────────────────────────────────────────────────
function calcCompletion(studio) {
  if (!studio) return { pct: 0, checklist: [] };
  const checks = [
    { label: 'Studio name',          done: !!(studio.name?.trim()) },
    { label: 'Profile picture (logo)', done: !!studio.logoUrl },
    { label: 'Cover photo',          done: !!studio.coverUrl },
    { label: 'Bio & story',          done: !!(studio.richDescription?.trim()) },
    { label: 'At least 1 service',   done: !!(studio.services?.length) },
    { label: 'Contact info',         done: !!(studio.contactInfo?.email || studio.contactInfo?.phone) },
    { label: 'Gallery photos',       done: !!(studio.gallery?.length) },
    { label: 'Genre tags',           done: !!(studio.genres?.length) },
    { label: 'Credits',              done: !!(studio.credits?.length) },
    { label: 'Social links',         done: !!(studio.socialLinks && Object.values(studio.socialLinks).some(Boolean)) },
  ];
  const done = checks.filter((c) => c.done).length;
  return { pct: Math.round((done / checks.length) * 100), checklist: checks };
}

// ─── Completion widget ────────────────────────────────────────────────────────
function CompletionWidget({ studio, onSetupClick }) {
  const { pct, checklist } = calcCompletion(studio);

  return (
    <div className="eyf-card eyf-stack">
      <div className="eyf-row eyf-row--between">
        <h3 style={{ margin: 0 }}>Profile completion</h3>
        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: pct === 100 ? 'var(--sage)' : 'var(--muted)' }}>
          {pct}%
        </span>
      </div>
      <div className="eyf-completion-widget">
        <div className="eyf-completion-track">
          <div className="eyf-completion-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="eyf-completion-checklist">
          {checklist.map((item) => (
            <div key={item.label} className={`eyf-completion-item${item.done ? ' is-done' : ''}`}>
              <span className="eyf-completion-dot">{item.done ? '✓' : ''}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      {pct < 100 ? (
        <button
          type="button"
          className="eyf-button eyf-button--secondary"
          style={{ justifySelf: 'start' }}
          onClick={onSetupClick}
        >
          Complete setup
        </button>
      ) : (
        <p className="eyf-muted" style={{ fontSize: '0.875rem' }}>Your profile is complete! ✓</p>
      )}
    </div>
  );
}

// ─── Client dashboard ─────────────────────────────────────────────────────────
export function ClientDashboard() {
  const { currentUser, favoriteStudioIds, toggleFavorite } = useAppContext();

  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      bookingsApi.list().catch(() => []),
      studiosApi.list({ limit: 50 }).catch(() => ({ studios: [] })).then(({ studios }) =>
        studios.filter((s) => favoriteStudioIds.includes(s.id))
      ),
    ])
      .then(([bkgs, favs]) => {
        setBookings(bkgs);
        setFavorites(favs);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [favoriteStudioIds]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="eyf-page">
      <section className="eyf-section eyf-stack">
        <SectionHeading
          eyebrow="Client dashboard"
          title={`Welcome back, ${currentUser?.name}`}
        />
        {loading ? <Spinner /> : error ? <ErrorMessage message={error} onRetry={fetchData} /> : (
          <>
            <h3>Your bookings</h3>
            <BookingRows bookings={bookings} />
            {favorites.length > 0 ? (
              <>
                <SectionHeading eyebrow="Saved studios" title="Quick access to your saved rooms" />
                <div className="eyf-card-grid">
                  {favorites.map((studio) => (
                    <StudioCard
                      key={studio.id}
                      studio={studio}
                      isFavorite={favoriteStudioIds.includes(studio.id)}
                      onFavoriteToggle={toggleFavorite}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}

// ─── Studio owner dashboard ───────────────────────────────────────────────────
export function StudioDashboard() {
  const { currentUser, showToast } = useAppContext();

  const [bookings, setBookings] = useState([]);
  const [studio, setStudio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWizard, setShowWizard] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      bookingsApi.list().catch(() => []),
      studioProfileApi.get().catch(() => null),           // full owner-scoped profile
      studiosApi.list({ limit: 50 }).catch(() => ({ studios: [] })),  // fallback for extra fields
    ])
      .then(([bkgs, profile, { studios }]) => {
        setBookings(bkgs);

        // Prefer studioProfileApi data (richer), fall back to list match
        if (profile) {
          setStudio(profile);
          // Show wizard if profile is incomplete and owner hasn't dismissed it
          const wizardKey = `efyia_wizard_seen_${profile.id}`;
          const hasDismissed = localStorage.getItem(wizardKey);
          if (!hasDismissed && !profile.richDescription?.trim()) {
            setShowWizard(true);
          }
        } else {
          // Fallback: find in public list
          const owned = studios.find(
            (s) => s.owner?.id === currentUser?.id || s.ownerId === currentUser?.id
          );
          if (owned) setStudio(owned);
        }

        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [currentUser?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusChange = async (bookingId, status) => {
    try {
      const updated = await bookingsApi.updateStatus(bookingId, status);
      setBookings((prev) => prev.map((b) => b.id === bookingId ? updated : b));
      showToast(`Booking marked as ${status.toLowerCase()}.`);
    } catch (err) {
      showToast(err.message || 'Could not update booking status.');
    }
  };

  const handleWizardFinished = (updated) => {
    setStudio(updated);
    setShowWizard(false);
    if (studio?.id) localStorage.setItem(`efyia_wizard_seen_${studio.id}`, '1');
    showToast('Profile set up successfully!');
  };

  const handleWizardDismiss = () => {
    setShowWizard(false);
    if (studio?.id) localStorage.setItem(`efyia_wizard_seen_${studio.id}`, '1');
  };

  const openWizard = () => setShowWizard(true);

  const revenue = bookings.filter((b) => ['CONFIRMED', 'COMPLETED'].includes(b.status))
    .reduce((sum, b) => sum + (b.total || 0), 0);

  return (
    <>
      {/* Profile setup wizard — rendered outside page flow as overlay */}
      {showWizard && studio ? (
        <ProfileSetupWizard
          studio={studio}
          onFinished={handleWizardFinished}
          onDismiss={handleWizardDismiss}
        />
      ) : null}

      <div className="eyf-page">
        <section className="eyf-section eyf-stack">
          <SectionHeading
            eyebrow="Studio dashboard"
            title={studio ? `Manage ${studio.name}` : 'Studio dashboard'}
          />

          {loading ? <Spinner /> : error ? <ErrorMessage message={error} onRetry={fetchData} /> : (
            <>
              {/* Stats */}
              <div className="eyf-stats-grid">
                <div className="eyf-card"><strong>{bookings.length}</strong><span>Total bookings</span></div>
                <div className="eyf-card"><strong>{bookings.filter((b) => b.status === 'PENDING').length}</strong><span>Pending</span></div>
                <div className="eyf-card"><strong>${revenue.toFixed(0)}</strong><span>Revenue</span></div>
                <div className="eyf-card"><strong>{studio?.rating || '—'}</strong><span>Rating</span></div>
              </div>

              {/* Bookings */}
              <h3>Bookings</h3>
              <BookingRows bookings={bookings} onStatusChange={handleStatusChange} />

              {studio ? (
                <>
                  {/* Profile completion */}
                  <CompletionWidget studio={studio} onSetupClick={openWizard} />

                  {/* Studio branding customizer CTA (single editing surface lives on studio profile drawer) */}
                  <div className="eyf-card eyf-stack">
                    <div className="eyf-row eyf-row--between">
                      <h3 style={{ margin: 0 }}>Studio page &amp; branding</h3>
                      {studio.slug ? (
                        <a
                          href={`/studios/${studio.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '0.82rem', color: 'var(--muted)', textDecoration: 'underline' }}
                        >
                          View public profile ↗
                        </a>
                      ) : null}
                    </div>
                    <p className="eyf-muted" style={{ margin: 0 }}>
                      Edit branding, layout, content, and contact details from your studio profile editor.
                    </p>
                    {studio.slug ? (
                      <a
                        href={`/studios/${studio.slug}`}
                        className="eyf-button"
                        style={{ width: 'fit-content' }}
                      >
                        Open profile editor
                      </a>
                    ) : (
                      <p className="eyf-muted" style={{ margin: 0 }}>A public studio URL is required to open the profile editor.</p>
                    )}
                  </div>
                </>
              ) : (
                <EmptyState
                  title="No studio linked to your account"
                  description="Contact support to link your studio profile."
                />
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}

// ─── Admin dashboard ──────────────────────────────────────────────────────────
export function AdminDashboard() {
  const { showToast } = useAppContext();

  const [bookings, setBookings] = useState([]);
  const [studios, setStudios] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      bookingsApi.list(),
      studiosApi.list({ limit: 100 }),
      usersApi.list(),
    ])
      .then(([bkgs, { studios: studioList }, userList]) => {
        setBookings(bkgs);
        setStudios(studioList);
        setUsers(userList);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleUserStatus = async (user) => {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const updated = await usersApi.adminUpdate(user.id, { status: newStatus });
      setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
      showToast(`User ${updated.name} ${newStatus === 'SUSPENDED' ? 'suspended' : 'reactivated'}.`);
    } catch (err) {
      showToast(err.message || 'Could not update user.');
    }
  };

  return (
    <div className="eyf-page">
      <section className="eyf-section eyf-stack">
        <SectionHeading eyebrow="Admin" title="Marketplace overview" />
        {loading ? <Spinner /> : error ? <ErrorMessage message={error} onRetry={fetchData} /> : (
          <>
            <div className="eyf-stats-grid">
              <div className="eyf-card"><strong>{studios.length}</strong><span>Studios</span></div>
              <div className="eyf-card"><strong>{users.length}</strong><span>Users</span></div>
              <div className="eyf-card"><strong>{bookings.length}</strong><span>Bookings</span></div>
              <div className="eyf-card">
                <strong>{bookings.filter((b) => b.status === 'PENDING').length}</strong>
                <span>Pending</span>
              </div>
            </div>

            <div className="eyf-admin-grid">
              <div className="eyf-card eyf-stack">
                <h3>Studios ({studios.length})</h3>
                {studios.map((s) => (
                  <div key={s.id} className="eyf-row eyf-row--between">
                    <div>
                      <span>{s.name}</span>
                      <span className="eyf-muted" style={{ display: 'block', fontSize: '0.85rem' }}>
                        {s.city}, {s.state}
                      </span>
                    </div>
                    <span className="eyf-muted">${s.pricePerHour}/hr</span>
                  </div>
                ))}
              </div>
              <div className="eyf-card eyf-stack">
                <h3>Users ({users.length})</h3>
                {users.map((user) => (
                  <div key={user.id} className="eyf-row eyf-row--between">
                    <div>
                      <span>{user.name}</span>
                      <span className="eyf-muted" style={{ display: 'block', fontSize: '0.85rem' }}>
                        {user.email} · {user.role.toLowerCase()}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={`eyf-badge ${user.status === 'ACTIVE' ? 'eyf-badge--sage' : 'eyf-badge--earth'}`}
                      style={{ border: 'none', cursor: 'pointer' }}
                      onClick={() => toggleUserStatus(user)}
                      title={user.status === 'ACTIVE' ? 'Click to suspend' : 'Click to reactivate'}
                    >
                      {user.status.toLowerCase()}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <h3>All bookings</h3>
            <BookingRows bookings={bookings} />
          </>
        )}
      </section>
    </div>
  );
}
