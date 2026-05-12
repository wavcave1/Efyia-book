import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../../lib/api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [resending, setResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [resendError, setResendError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No verification token found. Please use the link from your verification email.');
      return;
    }

    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setErrorMessage(err.message || 'Verification failed. The link may have expired.');
      });
  }, [token]);

  const handleResend = async () => {
    setResending(true);
    setResendError('');
    try {
      await authApi.resendVerification();
      setResendDone(true);
    } catch (err) {
      setResendError(err.message || 'Could not resend. Please log in first, then try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '80px auto', padding: '0 24px', textAlign: 'center', fontFamily: 'Inter, Arial, sans-serif' }}>
      {status === 'loading' && (
        <>
          <div style={{
            width: '40px', height: '40px',
            border: '3px solid #d5e8e2', borderTopColor: '#0a9e84',
            borderRadius: '50%', margin: '0 auto 24px',
            animation: 'efyia-spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes efyia-spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#5a7870' }}>Verifying your email…</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div style={{
            width: '56px', height: '56px', background: '#e6f7f1',
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 24px',
            color: '#0a7a66', fontSize: '26px', fontWeight: '700',
          }}>✓</div>
          <h1 style={{ fontSize: '22px', color: '#1a2a25', marginBottom: '12px' }}>Email verified</h1>
          <p style={{ color: '#5a7870', marginBottom: '32px', lineHeight: '1.6' }}>
            Your email address has been confirmed. You&apos;re all set.
          </p>
          <Link
            to="/dashboard/client"
            style={{
              display: 'inline-block', background: '#0a9e84', color: '#fff',
              padding: '12px 28px', borderRadius: '6px', textDecoration: 'none',
              fontWeight: '600', fontSize: '15px',
            }}
          >
            Go to your dashboard
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div style={{
            width: '56px', height: '56px', background: '#fff0f0',
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 24px',
            color: '#c0392b', fontSize: '26px', fontWeight: '700',
          }}>✗</div>
          <h1 style={{ fontSize: '22px', color: '#1a2a25', marginBottom: '12px' }}>Verification failed</h1>
          <p style={{ color: '#5a7870', marginBottom: '28px', lineHeight: '1.6' }}>
            {errorMessage || 'This link is invalid or has expired.'}
          </p>

          {!resendDone ? (
            <>
              <button
                onClick={handleResend}
                disabled={resending}
                style={{
                  background: '#0a9e84', color: '#fff', border: 'none',
                  padding: '12px 28px', borderRadius: '6px', fontWeight: '600',
                  fontSize: '15px', cursor: 'pointer', marginBottom: '12px',
                  opacity: resending ? 0.7 : 1,
                }}
              >
                {resending ? 'Sending…' : 'Resend verification email'}
              </button>
              {resendError && (
                <p style={{ color: '#c0392b', fontSize: '13px', marginTop: '8px' }}>{resendError}</p>
              )}
            </>
          ) : (
            <p style={{ color: '#0a7a66', fontWeight: '600', marginBottom: '16px' }}>
              Verification email sent. Check your inbox.
            </p>
          )}

          <div style={{ marginTop: '20px' }}>
            <Link to="/" style={{ color: '#0a9e84', textDecoration: 'none', fontSize: '14px' }}>
              Back to home
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
