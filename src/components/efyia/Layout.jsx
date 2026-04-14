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
      <div className="eyf-footer__grid">
        <div className="eyf-footer__brand">
          <strong className="eyf-footer__brand-name">Efyia <em>Book</em></strong>
          <p>The studio booking marketplace for artists, engineers, and studio owners across major music cities.</p>
        </div>
        <div className="eyf-footer__col">
          <span className="eyf-footer__col-heading">Platform</span>
          <a href="/discover">Find Studios</a>
          <a href="/map">Map View</a>
          <a href="/signup">List Your Studio</a>
        </div>
        <div className="eyf-footer__col">
          <span className="eyf-footer__col-heading">Company</span>
          <a href="/terms">Terms of Service</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="mailto:support@efyia.com">Support</a>
        </div>
      </div>
      <div className="eyf-footer__bottom">
        <span className="eyf-muted">© {new Date().getFullYear()} Efyia Book. All rights reserved.</span>
        <div className="eyf-footer__links">
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
        </div>
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
              <NavLink className="eyf-button eyf-button--secondary eyf-nav__list-cta" to="/signup" style={{ fontSize: '0.875rem' }}>
                List your studio
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
