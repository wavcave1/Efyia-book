import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://efyia-book-backend.up.railway.app';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function validate(form, isLogin) {
  const errors = {};
  if (!isLogin && (!form.name || form.name.trim().length < 2)) {
    errors.name = 'Name must be at least 2 characters.';
  }
  if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!form.password || form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }
  return errors;
}

export default function AuthPage({ mode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup } = useAppContext();
  const isLogin = mode === 'login';

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CLIENT' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || null;

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  // Show error from OAuth redirect if present
  const oauthError = new URLSearchParams(location.search).get('error');
  const oauthErrorMessages = {
    oauth_denied: 'Sign-in was cancelled.',
    oauth_invalid_state: 'Sign-in failed (invalid state). Please try again.',
    oauth_token_failed: 'Could not complete sign-in. Please try again.',
    oauth_profile_failed: 'Could not retrieve profile. Please try again.',
    oauth_error: 'Sign-in failed. Please try again.',
    auth_failed: 'Authentication failed. Please try again.',
  };

  const getRedirect = (user) => {
    if (from) return from;
    const roleMap = { ADMIN: '/dashboard/admin', OWNER: '/dashboard/studio', CLIENT: '/dashboard/client' };
    return roleMap[user.role] || '/';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError('');

    const errors = validate(form, isLogin);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      const user = isLogin
        ? await login(form.email.trim(), form.password)
        : await signup({ name: form.name.trim(), email: form.email.trim(), password: form.password, role: form.role });
      navigate(getRedirect(user), { replace: true });
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="eyf-page">
      <section className="eyf-section eyf-auth-wrap">
        <form className="eyf-card eyf-auth-card eyf-stack" onSubmit={handleSubmit} noValidate>
          <div>
            <h1>{isLogin ? 'Welcome back' : 'Create your account'}</h1>
            <p className="eyf-muted">
              {isLogin
                ? 'Sign in to manage your bookings and saved studios.'
                : 'Join Efyia Book to discover and book recording studios.'}
            </p>
          </div>

          {oauthError ? (
            <div className="eyf-error-box" role="alert">
              {oauthErrorMessages[oauthError] || 'Sign-in failed. Please try again.'}
            </div>
          ) : null}

          {serverError ? (
            <div className="eyf-error-box" role="alert">{serverError}</div>
          ) : null}

          {!isLogin ? (
            <div>
              <label>
                Name
                <input
                  value={form.name}
                  onChange={update('name')}
                  autoComplete="name"
                  required
                />
              </label>
              {fieldErrors.name ? <p className="eyf-field-error">{fieldErrors.name}</p> : null}
            </div>
          ) : null}

          <div>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={update('email')}
                autoComplete="email"
                required
              />
            </label>
            {fieldErrors.email ? <p className="eyf-field-error">{fieldErrors.email}</p> : null}
          </div>

          <div>
            <label>
              Password
              <input
                type="password"
                value={form.password}
                onChange={update('password')}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
                minLength={8}
              />
            </label>
            {fieldErrors.password ? <p className="eyf-field-error">{fieldErrors.password}</p> : null}
            {!isLogin ? <p className="eyf-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Minimum 8 characters.</p> : null}
          </div>

          {!isLogin ? (
            <label>
              Account type
              <select value={form.role} onChange={update('role')}>
                <option value="CLIENT">Artist / Client</option>
                <option value="OWNER">Studio Owner</option>
              </select>
            </label>
          ) : null}

          <button type="submit" className="eyf-button" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
          </button>

          {/* OAuth divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.12)' }} />
            <span className="eyf-muted" style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.12)' }} />
          </div>

          {/* OAuth buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <a
              href={`${API_URL}/api/auth/google`}
              className="eyf-button"
              style={{ flex: 1, textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <GoogleIcon /> Google
            </a>
            <a
              href={`${API_URL}/api/auth/github`}
              className="eyf-button"
              style={{ flex: 1, textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <GithubIcon /> GitHub
            </a>
          </div>

          <p className="eyf-muted" style={{ textAlign: 'center', fontSize: '0.9rem' }}>
            {isLogin ? (
              <>Don&apos;t have an account? <Link to="/signup" style={{ color: 'var(--mint)' }}>Sign up</Link></>
            ) : (
              <>Already have an account? <Link to="/login" style={{ color: 'var(--mint)' }}>Sign in</Link></>
            )}
          </p>
        </form>
      </section>
    </div>
  );
}
