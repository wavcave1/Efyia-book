import { createContext, useContext, useMemo, useState } from 'react';
import { bookings as seedBookings, demoAccounts, reviews, studios, users } from '../data/efyiaData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [toast, setToast] = useState('');
  const [allBookings, setAllBookings] = useState(seedBookings);
  const [favoriteStudioIds, setFavoriteStudioIds] = useState([1, 3]);

  const login = (email) => {
    const account = demoAccounts[email] || {
      id: Date.now(),
      name: email.split('@')[0],
      email,
      role: 'client',
    };
    setCurrentUser(account);
    setToast(`Welcome back, ${account.name}!`);
    return account;
  };

  const signup = ({ name, email, role }) => {
    const account = {
      id: Date.now(),
      name: name || email.split('@')[0],
      email,
      role,
    };
    setCurrentUser(account);
    setToast('Account created! Welcome to Efyia Book.');
    return account;
  };

  const logout = () => {
    setCurrentUser(null);
    setToast('Logged out successfully.');
  };

  const toggleFavorite = (studioId) => {
    setFavoriteStudioIds((current) =>
      current.includes(studioId) ? current.filter((id) => id !== studioId) : [...current, studioId],
    );
  };

  const createBooking = ({ studioId, date, time, duration, sessionType }) => {
    const studio = studios.find((item) => item.id === studioId);
    const subtotal = studio.pricePerHour * duration;
    const fee = Math.round(subtotal * 0.08);
    const booking = {
      id: allBookings.length + 1,
      studioId,
      studioName: studio.name,
      userId: currentUser?.id || 11,
      clientName: currentUser?.name || 'Guest Client',
      date,
      time,
      duration,
      sessionType,
      status: 'confirmed',
      total: subtotal + fee,
    };
    setAllBookings((current) => [booking, ...current]);
    setToast('Booking confirmed! Check your dashboard.');
    return booking;
  };

  const value = useMemo(
    () => ({
      currentUser,
      setCurrentUser,
      toast,
      setToast,
      studios,
      reviews,
      users,
      bookings: allBookings,
      favoriteStudioIds,
      login,
      signup,
      logout,
      toggleFavorite,
      createBooking,
    }),
    [allBookings, currentUser, favoriteStudioIds, toast],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
