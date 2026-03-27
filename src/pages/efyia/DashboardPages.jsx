import { useAppContext } from '../../context/AppContext';
import { EmptyState, SectionHeading, StudioCard } from '../../components/efyia/ui';

function BookingRows({ bookings }) {
  if (!bookings.length) {
    return <EmptyState title="No bookings yet" description="Once a session is booked it will appear here for clients, owners, and admins." />;
  }

  return (
    <div className="eyf-stack">
      {bookings.map((booking) => (
        <article key={booking.id} className="eyf-card eyf-row eyf-row--between eyf-row--start">
          <div>
            <h3>{booking.studioName}</h3>
            <p className="eyf-muted">{booking.clientName} · {booking.date} · {booking.time} · {booking.sessionType}</p>
          </div>
          <div className="eyf-booking-meta">
            <span className={`eyf-badge eyf-badge--${booking.status === 'confirmed' ? 'mint' : booking.status === 'completed' ? 'sage' : 'earth'}`}>
              {booking.status}
            </span>
            <strong>${booking.total}</strong>
          </div>
        </article>
      ))}
    </div>
  );
}

export function ClientDashboard() {
  const { bookings, currentUser, favoriteStudioIds, studios, toggleFavorite } = useAppContext();
  const userBookings = bookings.filter((booking) => booking.userId === (currentUser?.id || 11));
  const favorites = studios.filter((studio) => favoriteStudioIds.includes(studio.id));

  return (
    <div className="eyf-page">
      <section className="eyf-section eyf-stack">
        <SectionHeading eyebrow="Client dashboard" title="Manage bookings, favorites, and profile settings" />
        <BookingRows bookings={userBookings} />
        <SectionHeading eyebrow="Saved studios" title="Quick access to your favorite rooms" />
        <div className="eyf-card-grid">
          {favorites.map((studio) => (
            <StudioCard key={studio.id} studio={studio} isFavorite={favoriteStudioIds.includes(studio.id)} onFavoriteToggle={toggleFavorite} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function StudioDashboard() {
  const { bookings, reviews, studios, currentUser } = useAppContext();
  const ownedStudio = studios.find((studio) => studio.ownerId === (currentUser?.id || 2)) || studios[0];
  const studioBookings = bookings.filter((booking) => booking.studioId === ownedStudio.id);
  const studioReviews = reviews.filter((review) => review.studioId === ownedStudio.id);

  return (
    <div className="eyf-page">
      <section className="eyf-section eyf-stack">
        <SectionHeading eyebrow="Studio owner dashboard" title={`Operate ${ownedStudio.name} from one control center`} />
        <div className="eyf-stats-grid">
          <div className="eyf-card"><strong>{studioBookings.length}</strong><span>Bookings</span></div>
          <div className="eyf-card"><strong>${studioBookings.reduce((sum, item) => sum + item.total, 0)}</strong><span>Revenue</span></div>
          <div className="eyf-card"><strong>{studioReviews.length}</strong><span>Reviews</span></div>
          <div className="eyf-card"><strong>{ownedStudio.rating}</strong><span>Rating</span></div>
        </div>
        <BookingRows bookings={studioBookings} />
        <div className="eyf-card eyf-stack">
          <h3>Profile editor preview</h3>
          <label>
            Studio name
            <input defaultValue={ownedStudio.name} />
          </label>
          <label>
            Description
            <textarea rows="4" defaultValue={ownedStudio.description} />
          </label>
          <button type="button" className="eyf-button">Save studio profile</button>
        </div>
      </section>
    </div>
  );
}

export function AdminDashboard() {
  const { bookings, reviews, studios, users } = useAppContext();

  return (
    <div className="eyf-page">
      <section className="eyf-section eyf-stack">
        <SectionHeading eyebrow="Admin dashboard" title="Moderate the marketplace across studios, users, bookings, and reviews" />
        <div className="eyf-stats-grid">
          <div className="eyf-card"><strong>{studios.length}</strong><span>Studios</span></div>
          <div className="eyf-card"><strong>{users.length}</strong><span>Users</span></div>
          <div className="eyf-card"><strong>{bookings.length}</strong><span>Bookings</span></div>
          <div className="eyf-card"><strong>{reviews.length}</strong><span>Reviews</span></div>
        </div>
        <div className="eyf-admin-grid">
          <div className="eyf-card eyf-stack">
            <h3>Studios</h3>
            {studios.map((studio) => (
              <div key={studio.id} className="eyf-row eyf-row--between">
                <span>{studio.name}</span>
                <span className="eyf-muted">{studio.city}</span>
              </div>
            ))}
          </div>
          <div className="eyf-card eyf-stack">
            <h3>Users</h3>
            {users.map((user) => (
              <div key={user.id} className="eyf-row eyf-row--between">
                <span>{user.name}</span>
                <span className="eyf-muted">{user.role}</span>
              </div>
            ))}
          </div>
        </div>
        <BookingRows bookings={bookings} />
      </section>
    </div>
  );
}
