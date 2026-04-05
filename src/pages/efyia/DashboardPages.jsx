import { useCallback, useEffect, useState } from 'react';
import { bookingsApi, studiosApi, usersApi } from '../../lib/api';
import { useAppContext } from '../../context/AppContext';
import { EmptyState, ErrorMessage, SectionHeading, Spinner, StudioCard } from '../../components/efyia/ui';
import ProfileCustomizer from '../../components/studio/ProfileCustomizer';

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
      bookingsApi.list(),
      studiosApi.list({ limit: 50 }).then(({ studios }) =>
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

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      bookingsApi.list(),
      studiosApi.list({ limit: 50 }),
    ])
      .then(([bkgs, { studios }]) => {
        setBookings(bkgs);
        const owned = studios.find((s) => s.owner?.id === currentUser?.id || s.ownerId === currentUser?.id);
        if (owned) {
          setStudio(owned);
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

  const revenue = bookings.filter((b) => ['CONFIRMED', 'COMPLETED'].includes(b.status))
    .reduce((sum, b) => sum + (b.total || 0), 0);

  return (
    <div className="eyf-page">
      <section className="eyf-section eyf-stack">
        <SectionHeading
          eyebrow="Studio dashboard"
          title={studio ? `Manage ${studio.name}` : 'Studio dashboard'}
        />
        {loading ? <Spinner /> : error ? <ErrorMessage message={error} onRetry={fetchData} /> : (
          <>
            <div className="eyf-stats-grid">
              <div className="eyf-card"><strong>{bookings.length}</strong><span>Total bookings</span></div>
              <div className="eyf-card"><strong>{bookings.filter((b) => b.status === 'PENDING').length}</strong><span>Pending</span></div>
              <div className="eyf-card"><strong>${revenue.toFixed(0)}</strong><span>Revenue</span></div>
              <div className="eyf-card"><strong>{studio?.rating || '—'}</strong><span>Rating</span></div>
            </div>

            <h3>Bookings</h3>
            <BookingRows bookings={bookings} onStatusChange={handleStatusChange} />

            {studio ? (
              <div className="eyf-card eyf-stack">
                <h3>Studio page &amp; branding</h3>
                <ProfileCustomizer
                  studio={studio}
                  onSaved={(updated) => {
                    setStudio(updated);
                    showToast('Studio profile updated.');
                  }}
                />
              </div>
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
                {studios.map((studio) => (
                  <div key={studio.id} className="eyf-row eyf-row--between">
                    <div>
                      <span>{studio.name}</span>
                      <span className="eyf-muted" style={{ display: 'block', fontSize: '0.85rem' }}>
                        {studio.city}, {studio.state}
                      </span>
                    </div>
                    <span className="eyf-muted">${studio.pricePerHour}/hr</span>
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
