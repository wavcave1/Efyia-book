import { useEffect, useState } from 'react';
import { stripeConnectApi } from '../../lib/api';

export default function StudioStripeOnboarding({
  studioId,
  studioName,
  existingStripeAccountId,
  onboardingComplete,
}) {
  const [loading, setLoading] = useState(false);
  const [stripeStatus, setStripeStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (existingStripeAccountId) {
      fetchStripeStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingStripeAccountId]);

  async function fetchStripeStatus() {
    try {
      const data = await stripeConnectApi.status(studioId);
      setStripeStatus(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch Stripe status');
    }
  }

  async function handleEnableStripe() {
    setLoading(true);
    setError(null);
    try {
      const data = await stripeConnectApi.onboard(studioId);
      window.open(data.url, '_blank');
    } catch (err) {
      setError(err.message || 'Unable to start Stripe onboarding');
    } finally {
      setLoading(false);
    }
  }

  async function handleRefreshOnboarding() {
    setLoading(true);
    setError(null);
    try {
      const data = await stripeConnectApi.refresh(studioId);
      window.open(data.url, '_blank');
    } catch (err) {
      setError(err.message || 'Failed to refresh onboarding link');
    } finally {
      setLoading(false);
    }
  }

  const isActive = stripeStatus?.status === 'ACTIVE' || onboardingComplete;
  const isPending = Boolean(existingStripeAccountId) && !isActive;
  const isNotStarted = !existingStripeAccountId;
  const feePercent = import.meta.env.VITE_APP_FEE_PERCENT ?? 10;

  return (
    <div className="stripe-onboarding-panel">
      <div className="panel-header">
        <StripeLogo />
        <div>
          <h3>Stripe Payments</h3>
          <p className="studio-name">{studioName}</p>
        </div>
        <StatusBadge status={isActive ? 'active' : isPending ? 'pending' : 'not_started'} />
      </div>

      {error && (
        <div className="error-banner" role="alert">
          ⚠️ {error}
        </div>
      )}

      {isActive && (
        <div className="status-details success">
          <p>✅ This studio is fully set up to accept payments.</p>
          <ul>
            <li>Card payments: {stripeStatus?.chargesEnabled ? '✓ Enabled' : '⏳ Pending'}</li>
            <li>Payouts: {stripeStatus?.payoutsEnabled ? '✓ Enabled' : '⏳ Pending'}</li>
          </ul>
          <button onClick={fetchStripeStatus} className="btn-secondary">
            Refresh Status
          </button>
        </div>
      )}

      {isPending && (
        <div className="status-details warning">
          <p>⏳ Stripe onboarding is in progress. The studio owner needs to complete their Stripe setup.</p>
          <div className="action-row">
            <button onClick={handleRefreshOnboarding} disabled={loading} className="btn-primary">
              {loading ? 'Generating link...' : 'Resend Onboarding Link'}
            </button>
            <button onClick={fetchStripeStatus} className="btn-secondary">
              Check Status
            </button>
          </div>
        </div>
      )}

      {isNotStarted && (
        <div className="status-details">
          <p>
            Enabling this studio will create a Stripe Express account and send the studio
            owner through Stripe's secure identity verification and bank account setup.
          </p>
          <p className="note">
            The studio will be the merchant of record. Efiya collects a {feePercent}% platform fee on each booking.
          </p>
          <button onClick={handleEnableStripe} disabled={loading} className="btn-primary">
            {loading ? 'Setting up Stripe...' : '⚡ Enable Studio & Start Onboarding'}
          </button>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const labels = { active: '● Active', pending: '● Pending', not_started: '○ Not Started' };
  return <span className={`status-badge status-${status}`}>{labels[status]}</span>;
}

function StripeLogo() {
  return (
    <svg width="40" height="16" viewBox="0 0 60 25" fill="currentColor">
      <path d="M0 0h60v25H0z" fill="#635BFF" rx="4" />
      <text x="8" y="18" fontSize="14" fill="white" fontFamily="sans-serif" fontWeight="bold">
        stripe
      </text>
    </svg>
  );
}
