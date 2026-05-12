import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function getPasswordStrength(password) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z\d]/.test(password),
  ];
  const passed = checks.filter(Boolean).length;
  if (passed <= 2) return 'weak';
  if (passed <= 4) return 'fair';
  return 'strong';
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
  } else if (!isLogin && !STRONG_PASSWORD_REGEX.test(form.password)) {
    errors.password = 'Password must include an uppercase letter, a lowercase letter, a number, and a special character.';
  }
  if (!isLogin && form.password && form.confirmPassword !== form.password) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  return errors;
}

const strengthLabel = { weak: 'Weak', fair: 'Fair', strong: 'Strong' };
const strengthColor = { weak: '#e74c3c', fair: '#f39c12', strong: '#0a9e84' };

export default function AuthPage({ mode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup } = useAppContext();
  const isLogin = mode === 'login';

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'CLIENT' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const from = location.state?.from?.pathname || null;

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

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
      if (isLogin) {
        const user = await login(form.email.trim(), form.password);
        navigate(getRedirect(user), { replace: true });
      } else {
        await signup({ name: form.name.trim(), email: form.email.trim(), password: form.password, role: form.role });
        setSignupSuccess(true);
      }
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = !isLogin ? getPasswordStrength(form.password) : null;

  if (signupSuccess) {
    return (
      <div className="eyf-page">
        <section className="eyf-section eyf-auth-wrap">
          <div className="eyf-card eyf-auth-card eyf-stack" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✉️</div>
            <h1>Check your inbox</h1>
            <p className="eyf-muted">
              We sent a verification link to <strong>{form.email}</strong>.
              Click it to activate your account, then come back to sign in.
            </p>
            <p className="eyf-muted" style={{ fontSize: '0.85rem' }}>Didn't get it? Check your spam folder.</p>
            <Link to="/login" className="eyf-button" style={{ display: 'inline-block', marginTop: '0.5rem' }}>
              Go to sign in
            </Link>
          </div>
        </section>
      </div>
    );
  }

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
            {!isLogin && form.password ? (
              <div style={{ marginTop: '0.4rem' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  {['weak', 'fair', 'strong'].map((level, i) => {
                    const levels = ['weak', 'fair', 'strong'];
                    const currentIndex = levels.indexOf(passwordStrength);
                    const filled = i <= currentIndex;
                    return (
                      <div
                        key={level}
                        style={{
                          height: '4px',
                          flex: 1,
                          borderRadius: '2px',
                          background: filled ? strengthColor[passwordStrength] : '#d5e8e2',
                          transition: 'background 0.2s',
                        }}
                      />
                    );
                  })}
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: strengthColor[passwordStrength] }}>
                  {strengthLabel[passwordStrength]}
                </p>
              </div>
            ) : null}
            {!isLogin && !form.password ? (
              <p className="eyf-muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                Min 8 chars &middot; uppercase &middot; lowercase &middot; number &middot; special character
              </p>
            ) : null}
          </div>

          {!isLogin ? (
            <div>
              <label>
                Confirm Password
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={update('confirmPassword')}
                  autoComplete="new-password"
                  required
                />
              </label>
              {fieldErrors.confirmPassword ? <p className="eyf-field-error">{fieldErrors.confirmPassword}</p> : null}
            </div>
          ) : null}

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

          <p className="eyf-muted" style={{ textAlign: 'center', fontSize: '0.9rem' }}>
            {isLogin ? (
              <>Don't have an account? <Link to="/signup" style={{ color: 'var(--mint)' }}>Sign up</Link></>
            ) : (
              <>Already have an account? <Link to="/login" style={{ color: 'var(--mint)' }}>Sign in</Link></>
            )}
          </p>
        </form>
      </section>
    </div>
  );
}
