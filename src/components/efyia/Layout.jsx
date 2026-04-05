import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { Toast } from './ui';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      className="eyf-theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? '☀' : '☽'}
    </button>
  );
}

function Footer() {
  return (
    <footer className="eyf-footer">
      <div>
        <strong>Efyia Book</strong>
        <p>The studio booking marketplace for artists, engineers, and studio owners.</p>
      </div>
      <div className="eyf-footer__links">
        <a href="/terms">Terms</a>
        <a href="/privacy">Privacy</a>
        <a href="mailto:support@efyia.com">Support</a>
      </div>
    </footer>
  );
}

export default function Layout() {
  const navigate = useNavigate();
  const { currentUser, logout, toast, setToast } = useAppContext();

  useEffect(() => {
    if (!toast) return undefined;
    const id = window.setTimeout(() => setToast(''), 3500);
    return () => window.clearTimeout(id);
  }, [setToast, toast]);

  const dashboardPath =
    currentUser?.role === 'ADMIN'
      ? '/dashboard/admin'
      : currentUser?.role === 'OWNER'
        ? '/dashboard/studio'
        : '/dashboard/client';

  return (
    <div className="eyf-shell">
      <header className="eyf-nav">
        <button type="button" className="eyf-brand" onClick={() => navigate('/')}>
          <span className="eyf-brand__mark">●</span>
          <span>Efyia <em>Book</em></span>
        </button>
        <nav className="eyf-nav__links">
          <NavLink to="/discover">Find Studios</NavLink>
          <NavLink to="/map">Map View</NavLink>
        </nav>
        <div className="eyf-nav__actions">
          <ThemeToggle />
          {currentUser ? (
            <>
              <span className="eyf-muted">{currentUser.name}</span>
              <button
                type="button"
                className="eyf-button eyf-button--secondary"
                onClick={() => navigate(dashboardPath)}
              >
                Dashboard
              </button>
              <button type="button" className="eyf-button eyf-button--ghost" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink className="eyf-button eyf-button--ghost" to="/login">
                Log in
              </NavLink>
              <NavLink className="eyf-button" to="/signup">
                Get started
              </NavLink>
            </>
          )}
        </div>
      </header>
      <main className="eyf-main">
        <Outlet />
      </main>
      <Footer />
      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  );
}
