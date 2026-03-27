import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Toast } from './ui';

function Footer() {
  return (
    <footer className="eyf-footer">
      <div>
        <strong>Efyia Book</strong>
        <p>The studio booking marketplace built for artists, engineers, and studio owners.</p>
      </div>
      <div className="eyf-footer__links">
        <a href="#">Terms</a>
        <a href="#">Privacy</a>
        <a href="#">Support</a>
      </div>
    </footer>
  );
}

export default function Layout() {
  const navigate = useNavigate();
  const { currentUser, logout, toast, setToast } = useAppContext();

  useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => setToast(''), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [setToast, toast]);

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
          <NavLink to="/about-mvp">Setup Guide</NavLink>
        </nav>
        <div className="eyf-nav__actions">
          {currentUser ? (
            <>
              <span className="eyf-muted">{currentUser.name}</span>
              <button
                type="button"
                className="eyf-button eyf-button--secondary"
                onClick={() =>
                  navigate(
                    currentUser.role === 'admin'
                      ? '/dashboard/admin'
                      : currentUser.role === 'owner'
                        ? '/dashboard/studio'
                        : '/dashboard/client',
                  )
                }
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
