import { Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/efyia/Layout';
import ProtectedRoute from './components/efyia/ProtectedRoute';
import AuthPage from './pages/efyia/AuthPage';
import BookingPage from './pages/efyia/BookingPage';
import BookingDirectPage from './pages/efyia/BookingDirectPage';
import { ClientDashboard, StudioDashboard } from './pages/efyia/DashboardPages';
import AdminPanel from './pages/efyia/AdminPanel';
import HomePage from './pages/efyia/HomePage';
import SearchPage from './pages/efyia/SearchPage';
import StudioProfilePage from './pages/efyia/StudioProfilePage';
import StudioPublicPage from './pages/efyia/StudioPublicPage';
import MapPage from './pages/efyia/MapPage';
import TermsPage from './pages/efyia/TermsPage';
import PrivacyPage from './pages/efyia/PrivacyPage';

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <Routes>
          {/* Standalone studio public page — outside main Layout */}
          <Route path="s/:slug" element={<StudioPublicPage />} />
          <Route
            path="admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />


          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="discover" element={<SearchPage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="studios/:slug" element={<StudioProfilePage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route
              path="booking/:studioId"
              element={
                <ProtectedRoute>
                  <BookingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="book/:slug"
              element={
                <ProtectedRoute>
                  <BookingDirectPage />
                </ProtectedRoute>
              }
            />
            <Route path="login" element={<AuthPage mode="login" />} />
            <Route path="signup" element={<AuthPage mode="signup" />} />
            <Route
              path="dashboard/client"
              element={
                <ProtectedRoute roles={['client']}>
                  <ClientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="dashboard/studio"
              element={
                <ProtectedRoute roles={['owner']}>
                  <StudioDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="dashboard/admin" element={<Navigate to="/admin" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AppProvider>
    </ThemeProvider>
  );
}
