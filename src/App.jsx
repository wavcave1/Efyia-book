import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/efyia/Layout';
import { AppProvider } from './context/AppContext';
import AuthPage from './pages/efyia/AuthPage';
import BookingPage from './pages/efyia/BookingPage';
import { AdminDashboard, ClientDashboard, StudioDashboard } from './pages/efyia/DashboardPages';
import HomePage from './pages/efyia/HomePage';
import MapPage from './pages/efyia/MapPage';
import SearchPage from './pages/efyia/SearchPage';
import SetupGuidePage from './pages/efyia/SetupGuidePage';
import StudioProfilePage from './pages/efyia/StudioProfilePage';

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="discover" element={<SearchPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="studios/:slug" element={<StudioProfilePage />} />
          <Route path="booking/:studioId" element={<BookingPage />} />
          <Route path="login" element={<AuthPage mode="login" />} />
          <Route path="signup" element={<AuthPage mode="signup" />} />
          <Route path="dashboard/client" element={<ClientDashboard />} />
          <Route path="dashboard/studio" element={<StudioDashboard />} />
          <Route path="dashboard/admin" element={<AdminDashboard />} />
          <Route path="about-mvp" element={<SetupGuidePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AppProvider>
  );
}
