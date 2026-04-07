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
}) {
  const stripePromise = useMemo(() => {
    if (!publishableKey) return null;
    return loadStripe(publishableKey, {
      stripeAccount: connectedAccountId,
    });
  }, [connectedAccountId]);

  if (!publishableKey) {
    return <div className="checkout-error">Stripe publishable key is not configured.</div>;
  }

  if (!stripePromise || !clientSecret) {
    return <div className="checkout-loading">Preparing secure payment…</div>;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#0f172a',
            borderRadius: '8px',
          },
        },
      }}
    >
      <CheckoutForm
        bookingId={bookingId}
        studioName={studioName}
        amountCents={amountCents}
        bookingDetails={bookingDetails}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}

function CheckoutForm({ bookingId, studioName, amountCents, bookingDetails, onSuccess, onError }) {
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

    if (paymentIntent?.status === 'succeeded') {
      onSuccess?.();
      setProcessing(false);
    } else {
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <div className="checkout-summary">
        <h3>Complete Your Booking</h3>
        <p className="studio-name">{studioName}</p>
        <div className="booking-details">
          <span>{bookingDetails.date} at {bookingDetails.time}</span>
          <span>{bookingDetails.duration}</span>
        </div>
        <div className="amount-row">
          <span>Total</span>
          <strong>${amountDollars}</strong>
        </div>
      </div>

      <PaymentElement />

      {errorMessage && (
        <div className="payment-error" role="alert">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="pay-button"
      >
        {processing ? 'Processing…' : `Pay $${amountDollars}`}
      </button>

      <p className="secure-note">🔒 Payments are processed securely by Stripe</p>
    </form>
  );
}
