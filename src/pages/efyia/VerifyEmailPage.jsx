import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found. Please use the link from your email.');
      return;
    }

    fetch(`${API_BASE}/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed. Please try again.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Something went wrong. Please try again later.');
      });
  }, [token]);

  return (
    <div className="eyf-page">
      <section className="eyf-section eyf-auth-wrap">
        <div className="eyf-card eyf-auth-card eyf-stack" style={{ textAlign: 'center' }}>
          {status === 'loading' && (
            <>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
              <h1>Verifying your email&hellip;</h1>
              <p className="eyf-muted">Just a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
              <h1>Email verified!</h1>
              <p className="eyf-muted">{message}</p>
              <Link to="/login" className="eyf-button" style={{ display: 'inline-block', marginTop: '0.5rem' }}>
                Sign in
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>❌</div>
              <h1>Verification failed</h1>
              <p className="eyf-muted">{message}</p>
              <Link to="/signup" className="eyf-button" style={{ display: 'inline-block', marginTop: '0.5rem' }}>
                Sign up again
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
