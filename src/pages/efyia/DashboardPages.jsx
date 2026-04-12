import { useCallback, useEffect, useState } from ‘react’;
import { bookingsApi, studioProfileApi, studiosApi, usersApi } from ‘../../lib/api’;
import { useAppContext } from ‘../../context/AppContext’;
import { EmptyState, ErrorMessage, SectionHeading, Spinner, StudioCard } from ‘../../components/efyia/ui’;
import ProfileSetupWizard from ‘../../components/studio/ProfileSetupWizard’;
import StudioStripeOnboarding from ‘../../components/stripe/StudioStripeOnboarding’;

// ─── Confirm action modal ─────────────────────────────────────────────────────
function ConfirmModal({ title, description, confirmLabel = ‘Confirm’, danger = false, onConfirm, onClose, loading }) {
return (
<div
style={{
position: ‘fixed’, inset: 0, background: ‘rgba(0,0,0,0.65)’,
backdropFilter: ‘blur(4px)’, zIndex: 200,
display: ‘grid’, placeItems: ‘center’, padding: ‘1rem’,
}}
role=“dialog” aria-modal=“true”
>
<div style={{
background: ‘var(–card)’, border: ‘1px solid var(–border)’,
borderRadius: 20, padding: ‘2rem’, width: ‘min(420px, 100%)’,
display: ‘grid’, gap: ‘1.25rem’,
}}>
<h3 style={{ margin: 0 }}>{title}</h3>
<p style={{ margin: 0, color: ‘var(–muted)’, lineHeight: 1.6 }}>{description}</p>
<div style={{ display: ‘grid’, gridTemplateColumns: ‘1fr 1fr’, gap: ‘0.75rem’ }}>
<button type="button" className="eyf-button eyf-button--ghost" onClick={onClose} disabled={loading}>
Go back
</button>
<button
type=“button”
className=“eyf-button”
onClick={onConfirm}
disabled={loading}
style={danger ? { background: ‘transparent’, borderColor: ‘#f87171’, color: ‘#f87171’ } : {}}
>
{loading ? ‘Please wait…’ : confirmLabel}
</button>
</div>
</div>
</div>
);
}

// ─── Booking status badge ─────────────────────────────────────────────────────
function BookingStatusBadge({ status }) {
const map = {
PENDING: ‘pending’,
CONFIRMED: ‘confirmed’,
COMPLETED: ‘completed’,
CANCELLED: ‘cancelled’,
};
return (
<span className={`eyf-badge eyf-badge--${map[status] || 'default'}`}>
{status.charAt(0) + status.slice(1).toLowerCase()}
</span>
);
}

// ─── Client booking rows ──────────────────────────────────────────────────────
function ClientBookingRows({ bookings, onCancel }) {
const [confirmCancel, setConfirmCancel] = useState(null);
const [cancelling, setCancelling] = useState(false);

if (!bookings.length) {
return <EmptyState title="No bookings yet" description="Your confirmed bookings will appear here." />;
}

const handleConfirmCancel = async () => {
setCancelling(true);
await onCancel(confirmCancel.id);
setCancelling(false);
setConfirmCancel(null);
};

return (
<>
{confirmCancel ? (
<ConfirmModal
title=“Cancel booking?”
description={`Cancel your ${confirmCancel.sessionType} session at ${confirmCancel.studio?.name} on ${confirmCancel.date} at ${confirmCancel.time}? This cannot be undone.`}
confirmLabel=“Yes, cancel booking”
danger
loading={cancelling}
onConfirm={handleConfirmCancel}
onClose={() => setConfirmCancel(null)}
/>
) : null}

```
  <div className="eyf-stack">
    {bookings.map((booking) => (
      <article key={booking.id} className="eyf-card eyf-row eyf-row--between eyf-row--start">
        <div>
          <h3>{booking.studio?.name || 'Studio'}</h3>
          <p className="eyf-muted">
            {booking.date} · {booking.time} · {booking.sessionType} · {booking.hours}hr
          </p>
        </div>
        <div className="eyf-booking-meta">
          <BookingStatusBadge status={booking.status} />
          <strong>${booking.total?.toFixed(2)}</strong>
          {/* Client can cancel if not already cancelled/completed */}
          {['PENDING', 'CONFIRMED'].includes(booking.status) ? (
            <button
              type="button"
              className="eyf-button eyf-button--ghost"
              style={{ padding: '0.4rem 0.75rem', minHeight: 'unset', fontSize: '0.82rem', color: '#f87171', borderColor: '#f87171' }}
              onClick={() => setConfirmCancel(booking)}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </article>
    ))}
  </div>
</>
```

);
}

// ─── Studio owner booking rows ────────────────────────────────────────────────
function OwnerBookingRows({ bookings, onStatusChange }) {
const [confirmAction, setConfirmAction] = useState(null); // { booking, action }
const [acting, setActing] = useState(false);

if (!bookings.length) {
return <EmptyState title="No bookings yet" description="Booking requests will appear here." />;
}

const handleConfirm = async () => {
setActing(true);
await onStatusChange(confirmAction.booking.id, confirmAction.action);
setActing(false);
setConfirmAction(null);
};

return (
<>
{confirmAction ? (
<ConfirmModal
title={confirmAction.action === ‘CONFIRMED’ ? ‘Confirm booking?’ : confirmAction.action === ‘COMPLETED’ ? ‘Mark as completed?’ : ‘Cancel booking?’}
description={
confirmAction.action === ‘CONFIRMED’
? `Confirm the ${confirmAction.booking.sessionType} session on ${confirmAction.booking.date} at ${confirmAction.booking.time}? The client will be notified.`
: confirmAction.action === ‘COMPLETED’
? `Mark this session as completed? This will finalize the booking.`
: `Cancel this booking for ${confirmAction.booking.user?.name}? This cannot be undone.`
}
confirmLabel={
confirmAction.action === ‘CONFIRMED’ ? ‘Confirm session’
: confirmAction.action === ‘COMPLETED’ ? ‘Mark complete’
: ‘Cancel booking’
}
danger={confirmAction.action === ‘CANCELLED’}
loading={acting}
onConfirm={handleConfirm}
onClose={() => setConfirmAction(null)}
/>
) : null}

```
  <div className="eyf-stack">
    {bookings.map((booking) => (
      <article key={booking.id} className="eyf-card eyf-row eyf-row--between eyf-row--start">
        <div>
          <h3>{booking.user?.name || 'Client'}</h3>
          <p className="eyf-muted">
            {booking.date} · {booking.time} · {booking.sessionType} · {booking.hours}hr
          </p>
        </div>
        <div className="eyf-booking-meta">
          <BookingStatusBadge status={booking.status} />
          <strong>${booking.total?.toFixed(2)}</strong>
          {booking.status === 'PENDING' ? (
            <>
              <button
                type="button"
                className="eyf-button eyf-button--secondary"
                style={{ padding: '0.4rem 0.75rem', minHeight: 'unset', fontSize: '0.85rem' }}
                onClick={() => setConfirmAction({ booking, action: 'CONFIRMED' })}
              >
                Confirm
              </button>
              <button
                type="button"
                className="eyf-button eyf-button--ghost"
                style={{ padding: '0.4rem 0.75rem', minHeight: 'unset', fontSize: '0.82rem', color: '#f87171', borderColor: '#f87171' }}
                onClick={() => setConfirmAction({ booking, action: 'CANCELLED' })}
              >
                Decline
              </button>
            </>
          ) : null}
          {booking.status === 'CONFIRMED' ? (
            <>
              <button
                type="button"
                className="eyf-button eyf-button--ghost"
                style={{ padding: '0.4rem 0.75rem', minHeight: 'unset', fontSize: '0.85rem' }}
                onClick={() => setConfirmAction({ booking, action: 'COMPLETED' })}
              >
                Mark complete
              </button>
              <button
                type="button"
                className="eyf-button eyf-button--ghost"
                style={{ padding: '0.4rem 0.75rem', minHeight: 'unset', fontSize: '0.82rem', color: '#f87171', borderColor: '#f87171' }}
                onClick={() => setConfirmAction({ booking, action: 'CANCELLED' })}
              >
                Cancel
              </button>
            </>
          ) : null}
        </div>
      </article>
    ))}
  </div>
</>
```

);
}

// ─── Profile completion widget ────────────────────────────────────────────────
function calcCompletion(studio) {
if (!studio) return { pct: 0, checklist: [] };
const checks = [
{ label: ‘Studio name’,           done: !!(studio.name?.trim()) },
{ label: ‘Profile picture (logo)’, done: !!studio.logoUrl },
{ label: ‘Cover photo’,           done: !!studio.coverUrl },
{ label: ‘Bio & story’,           done: !!(studio.richDescription?.trim()) },
{ label: ‘At least 1 service’,    done: !!(studio.services?.length) },
{ label: ‘Contact info’,          done: !!(studio.contactInfo?.email || studio.contactInfo?.phone) },
{ label: ‘Gallery photos’,        done: !!(studio.gallery?.length) },
{ label: ‘Genre tags’,            done: !!(studio.genres?.length) },
{ label: ‘Credits’,               done: !!(studio.credits?.length) },
{ label: ‘Social links’,          done: !!(studio.socialLinks && Object.values(studio.socialLinks).some(Boolean)) },
];
const done = checks.filter((c) => c.done).length;
return { pct: Math.round((done / checks.length) * 100), checklist: checks };
}

function CompletionWidget({ studio, onSetupClick }) {
const { pct, checklist } = calcCompletion(studio);
return (
<div className="eyf-card eyf-stack">
<div className="eyf-row eyf-row--between">
<h3 style={{ margin: 0 }}>Profile completion</h3>
<span style={{ fontSize: ‘0.875rem’, fontWeight: 700, color: pct === 100 ? ‘var(–sage)’ : ‘var(–muted)’ }}>
{pct}%
</span>
</div>
<div className="eyf-completion-widget">
<div className="eyf-completion-track">
<div className=“eyf-completion-fill” style={{ width: `${pct}%` }} />
</div>
<div className="eyf-completion-checklist">
{checklist.map((item) => (
<div key={item.label} className={`eyf-completion-item${item.done ? ' is-done' : ''}`}>
<span className="eyf-completion-dot">{item.done ? ‘✓’ : ‘’}</span>
<span>{item.label}</span>
</div>
))}
</div>
</div>
{pct < 100 ? (
<button type=“button” className=“eyf-button eyf-button–secondary” style={{ justifySelf: ‘start’ }} onClick={onSetupClick}>
Complete setup
</button>
) : (
<p className=“eyf-muted” style={{ fontSize: ‘0.875rem’ }}>Your profile is complete! ✓</p>
)}
</div>
);
}

// ─── Client dashboard ─────────────────────────────────────────────────────────
export function ClientDashboard() {
const { currentUser, favoriteStudioIds, toggleFavorite } = useAppContext();
const { showToast } = useAppContext();

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

const handleCancel = async (bookingId) => {
try {
const updated = await bookingsApi.updateStatus(bookingId, ‘CANCELLED’);
setBookings((prev) => prev.map((b) => b.id === bookingId ? updated : b));
showToast(‘Booking cancelled.’);
} catch (err) {
showToast(err.message || ‘Could not cancel booking.’);
}
};

return (
<div className="eyf-page">
<section className="eyf-section eyf-stack">
<SectionHeading eyebrow=“Client dashboard” title={`Welcome back, ${currentUser?.name}`} />
{loading ? <Spinner /> : error ? <ErrorMessage message={error} onRetry={fetchData} /> : (
<>
<h3>Your bookings</h3>
<ClientBookingRows bookings={bookings} onCancel={handleCancel} />
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
studioProfileApi.get().catch(() => null),
studiosApi.list({ limit: 50 }).catch(() => ({ studios: [] })),
])
.then(([bkgs, profile, { studios }]) => {
setBookings(bkgs);
if (profile) {
setStudio(profile);
const wizardKey = `efyia_wizard_seen_${profile.id}`;
if (!localStorage.getItem(wizardKey) && !profile.richDescription?.trim()) {
setShowWizard(true);
}
} else {
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
const label = status === ‘CONFIRMED’ ? ‘confirmed’ : status === ‘COMPLETED’ ? ‘marked complete’ : ‘cancelled’;
showToast(`Booking ${label}.`);
} catch (err) {
showToast(err.message || ‘Could not update booking status.’);
}
};

const handleWizardFinished = (updated) => {
setStudio(updated);
setShowWizard(false);
if (studio?.id) localStorage.setItem(`efyia_wizard_seen_${studio.id}`, ‘1’);
showToast(‘Profile set up successfully!’);
};

const handleWizardDismiss = () => {
setShowWizard(false);
if (studio?.id) localStorage.setItem(`efyia_wizard_seen_${studio.id}`, ‘1’);
};

const revenue = bookings
.filter((b) => [‘CONFIRMED’, ‘COMPLETED’].includes(b.status))
.reduce((sum, b) => sum + (b.total || 0), 0);

const pendingCount = bookings.filter((b) => b.status === ‘PENDING’).length;

return (
<>
{showWizard && studio ? (
<ProfileSetupWizard studio={studio} onFinished={handleWizardFinished} onDismiss={handleWizardDismiss} />
) : null}

```
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
            <div className="eyf-card">
              <strong style={pendingCount > 0 ? { color: '#fbbf24' } : {}}>{pendingCount}</strong>
              <span>Awaiting confirmation</span>
            </div>
            <div className="eyf-card"><strong>${revenue.toFixed(0)}</strong><span>Revenue</span></div>
            <div className="eyf-card"><strong>{studio?.rating || '—'}</strong><span>Rating</span></div>
          </div>

          {/* Pending bookings callout */}
          {pendingCount > 0 ? (
            <div style={{
              background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)',
              borderRadius: 14, padding: '1rem 1.25rem', fontSize: '0.9rem',
            }}>
              <strong style={{ color: '#fbbf24' }}>⏳ {pendingCount} booking{pendingCount !== 1 ? 's' : ''} waiting for your confirmation</strong>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)' }}>
                Review and confirm below to lock in your client's session.
              </p>
            </div>
          ) : null}

          {/* Bookings */}
          <h3>Bookings</h3>
          <OwnerBookingRows bookings={bookings} onStatusChange={handleStatusChange} />

          {studio ? (
            <>
              <StudioStripeOnboarding
                studioId={studio.id}
                studioName={studio.name}
                existingStripeAccountId={studio.stripeConnectAccountId}
                onboardingComplete={Boolean(studio.stripeOnboardingComplete)}
                chargesEnabled={Boolean(studio.stripeChargesEnabled)}
                payoutsEnabled={Boolean(studio.stripePayoutsEnabled)}
                detailsSubmitted={Boolean(studio.stripeDetailsSubmitted)}
                connectStatus={studio.stripeConnectStatus}
              />

              <CompletionWidget studio={studio} onSetupClick={() => setShowWizard(true)} />

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
                  Edit branding, layout, services, cancellation policy, and contact details.
                </p>
                {studio.slug ? (
                  <a href={`/studios/${studio.slug}`} className="eyf-button" style={{ width: 'fit-content' }}>
                    Open profile editor
                  </a>
                ) : (
                  <p className="eyf-muted" style={{ margin: 0 }}>A public studio URL is required to open the profile editor.</p>
                )}
              </div>
            </>
          ) : (
            <EmptyState title="No studio linked" description="Contact support to link your studio profile." />
          )}
        </>
      )}
    </section>
  </div>
</>
```

);
}

// ─── Admin dashboard (unchanged) ─────────────────────────────────────────────
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
const newStatus = user.status === ‘ACTIVE’ ? ‘SUSPENDED’ : ‘ACTIVE’;
try {
const updated = await usersApi.adminUpdate(user.id, { status: newStatus });
setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
showToast(`User ${updated.name} ${newStatus === 'SUSPENDED' ? 'suspended' : 'reactivated'}.`);
} catch (err) {
showToast(err.message || ‘Could not update user.’);
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
<strong>{bookings.filter((b) => b.status === ‘PENDING’).length}</strong>
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
<span className=“eyf-muted” style={{ display: ‘block’, fontSize: ‘0.85rem’ }}>
{[s.city, s.state].filter(Boolean).join(’, ’)}
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
<span className=“eyf-muted” style={{ display: ‘block’, fontSize: ‘0.85rem’ }}>
{user.email} · {user.role.toLowerCase()}
</span>
</div>
<button
type=“button”
className={`eyf-badge ${user.status === 'ACTIVE' ? 'eyf-badge--sage' : 'eyf-badge--earth'}`}
style={{ border: ‘none’, cursor: ‘pointer’ }}
onClick={() => toggleUserStatus(user)}
title={user.status === ‘ACTIVE’ ? ‘Click to suspend’ : ‘Click to reactivate’}
>
{user.status.toLowerCase()}
</button>
</div>
))}
</div>
</div>
<h3>All bookings</h3>
<OwnerBookingRows bookings={bookings} onStatusChange={async () => {}} />
</>
)}
</section>
</div>
);
}