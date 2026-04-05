import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, favoritesApi } from '../lib/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('efyia_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [toast, setToast] = useState('');
  const [favoriteStudioIds, setFavoriteStudioIds] = useState([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);

  // Persist user to localStorage on change
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('efyia_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('efyia_user');
      localStorage.removeItem('efyia_token');
      setFavoriteStudioIds([]);
      setFavoritesLoaded(false);
    }
  }, [currentUser]);

  // Verify token and reload user on mount (handles token expiry)
  useEffect(() => {
    const token = localStorage.getItem('efyia_token');
    if (!token || !currentUser) return;

    authApi.me().then((user) => {
      setCurrentUser(user);
    }).catch(() => {
      // Token invalid or expired — clear session silently
      setCurrentUser(null);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load favorites when user is authenticated
  useEffect(() => {
    if (!currentUser || favoritesLoaded) return;

    favoritesApi.list().then((studios) => {
      setFavoriteStudioIds(studios.map((s) => s.id));
      setFavoritesLoaded(true);
    }).catch(() => {
      setFavoritesLoaded(true);
    });
  }, [currentUser, favoritesLoaded]);

  const login = useCallback(async (email, password) => {
    const { token, user } = await authApi.login({ email, password });
    localStorage.setItem('efyia_token', token);
    setCurrentUser(user);
    setFavoritesLoaded(false);
    setToast(`Welcome back, ${user.name}!`);
    return user;
  }, []);

  const signup = useCallback(async ({ name, email, password, role }) => {
    const { token, user } = await authApi.signup({ name, email, password, role });
    localStorage.setItem('efyia_token', token);
    setCurrentUser(user);
    setFavoritesLoaded(false);
    setToast('Account created. Welcome to Efyia Book.');
    return user;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setToast('Logged out successfully.');
  }, []);

  const toggleFavorite = useCallback(async (studioId) => {
    if (!currentUser) return;

    const isFavorite = favoriteStudioIds.includes(studioId);

    // Optimistic update
    setFavoriteStudioIds((current) =>
      isFavorite ? current.filter((id) => id !== studioId) : [...current, studioId],
    );

    try {
      if (isFavorite) {
        await favoritesApi.remove(studioId);
      } else {
        await favoritesApi.add(studioId);
      }
    } catch {
      // Revert on failure
      setFavoriteStudioIds((current) =>
        isFavorite ? [...current, studioId] : current.filter((id) => id !== studioId),
      );
      setToast('Could not update saved studios. Please try again.');
    }
  }, [currentUser, favoriteStudioIds]);

  const showToast = useCallback((message) => setToast(message), []);

  const value = useMemo(
    () => ({
      currentUser,
      toast,
      setToast,
      showToast,
      favoriteStudioIds,
      login,
      signup,
      logout,
      toggleFavorite,
    }),
    [currentUser, favoriteStudioIds, toast, showToast, login, signup, logout, toggleFavorite],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
