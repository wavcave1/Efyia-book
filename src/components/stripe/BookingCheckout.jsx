import { useMemo, useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export default function BookingCheckout({
clientSecret,
connectedAccountId,
bookingId,
studioName,
amountCents,
bookingDetails,
onSuccess,
onError,
isDepositPayment,
}) {
const stripePromise = useMemo(() => {
if (!publishableKey) return null;
return loadStripe(publishableKey, {
stripeAccount: connectedAccountId,
});
}, [connectedAccountId]);

if (!publishableKey) {
return (
<div className="eyf-error-box">
Stripe is not configured. Please contact support.
</div>
);
}

if (!stripePromise || !clientSecret) {
return <div className="checkout-loading">Preparing secure payment...</div>;
}

return (
<Elements
stripe={stripePromise}
options={{
clientSecret,
appearance: {
theme: 'stripe',
variables: {
colorPrimary: '#62f3d4',
colorBackground: '#111820',
colorText: '#e8f4f0',
colorDanger: '#f87171',
borderRadius: '10px',
fontFamily: 'Inter, system-ui, sans-serif',
},
rules: {
'.Input': {
border: '1px solid #1e2d3a',
backgroundColor: '#0d1117',
},
'.Input:focus': {
border: '1px solid #62f3d4',
boxShadow: '0 0 0 3px rgba(98,243,212,0.15)',
},
'.Label': { color: '#6b8f85' },
},
},
// Enable all available payment methods including Apple Pay, Google Pay, Cash App
paymentMethodCreation: 'manual',
}}
>
<CheckoutForm
bookingId={bookingId}
studioName={studioName}
amountCents={amountCents}
bookingDetails={bookingDetails}
onSuccess={onSuccess}
onError={onError}
isDepositPayment={isDepositPayment}
/>
</Elements>
);
}

function CheckoutForm({ bookingId, studioName, amountCents, bookingDetails, onSuccess, onError, isDepositPayment }) {
const stripe = useStripe();
const elements = useElements();
const [processing, setProcessing] = useState(false);
const [errorMessage, setErrorMessage] = useState(null);

const amountDollars = (amountCents / 100).toFixed(2);

async function handleSubmit(e) {
e.preventDefault();
if (!stripe || !elements) return;

setProcessing(true);
setErrorMessage(null);

// Validate the payment element before confirming
const { error: submitError } = await elements.submit();
if (submitError) {
  setErrorMessage(submitError.message);
  onError?.(submitError.message);
  setProcessing(false);
  return;
}

const { error, paymentIntent } = await stripe.confirmPayment({
  elements,
  redirect: 'if_required',
  confirmParams: {
    return_url: `${window.location.origin}/dashboard/client?booking=${bookingId}`,
  },
});

if (error) {
  const message = error.message || 'Payment failed. Please try again.';
  setErrorMessage(message);
  onError?.(message);
  setProcessing(false);
  return;
}

// Payment succeeded or requires redirect
if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
  onSuccess?.();
}

setProcessing(false);

}

return (
<form onSubmit={handleSubmit} className="checkout-form">
<div className="checkout-summary">
<p className="studio-name">{studioName}</p>
<div className="booking-details">
<span>{bookingDetails.date} at {bookingDetails.time}</span>
<span>{bookingDetails.duration}</span>
</div>
<div className="amount-row">
<span>{isDepositPayment ? 'Deposit due' : 'Total due'}</span>
<strong>${amountDollars}</strong>
</div>
</div>

  {/* PaymentElement automatically shows Apple Pay, Google Pay, Cash App, card — whatever's available */}
  <PaymentElement
    options={{
      layout: 'tabs',
      wallets: {
        applePay: 'auto',
        googlePay: 'auto',
      },
      fields: {
        billingDetails: {
          name: 'auto',
          email: 'auto',
        },
      },
    }}
  />

  {errorMessage ? (
    <div className="payment-error eyf-error-box" role="alert" style={{ marginTop: '1rem' }}>
      {errorMessage}
    </div>
  ) : null}

  <button
    type="submit"
    disabled={!stripe || processing}
    className="pay-button eyf-button"
    style={{ width: '100%', marginTop: '1.25rem', justifyContent: 'center' }}
  >
    {processing ? 'Processing...' : `Pay $${amountDollars}`}
  </button>

  <p className="secure-note" style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.75rem' }}>
    🔒 Payments processed securely by Stripe
  </p>
</form>

);
}