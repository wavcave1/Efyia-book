import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Footer from './Footer';

const navLinks = [
  { to: '/rates', label: 'Rates' },
  { to: '/contact', label: 'Contact' },
];

export default function SiteLayout() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <NavLink className="brand" to="/" onClick={() => setOpen(false)}>
            <img className="brand__logo" src="/images/logo.png" alt="WAV CAVE STUDIO logo" />
            <span>WAV CAVE STUDIO</span>
          </NavLink>

          <button
            type="button"
            className="menu-button"
            aria-expanded={open}
            aria-controls="site-nav"
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
          </button>

          <nav id="site-nav" className={`site-nav ${open ? 'site-nav--open' : ''}`}>
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                className={({ isActive }) => `site-nav__link ${isActive ? 'is-active' : ''}`}
                to={link.to}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            <a className="button button--primary nav-booking" href="/booking.html" onClick={() => setOpen(false)}>
              Booking
            </a>
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <Footer />

      <div className={`nav-overlay ${open ? 'nav-overlay--visible' : ''}`} onClick={() => setOpen(false)} />
    </div>
  );
}
