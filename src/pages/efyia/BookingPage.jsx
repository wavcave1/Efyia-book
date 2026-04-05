import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { bookingsApi, studiosApi } from '../../lib/api';
import { useAppContext } from '../../context/AppContext';
import { ErrorMessage, Spinner } from '../../components/efyia/ui';

const TIMES = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'];
const PLATFORM_FEE_RATE = 0.08;

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export default function BookingPage() {
  const { studioId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useAppContext();

  const [studio, setStudio] = useState(null);
  const [studioLoading, setStudioLoading] = useState(true);
  const [studioError, setStudioError] = useState(null);

  const [sessionType, setSessionType] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00 AM');
  const [hours, setHours] = useState(2);
  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    studiosApi.getById(studioId)
      .then((data) => {
        setStudio(data);
        setSessionType(data.sessionTypes?.[0] || '');
        setStudioLoading(false);
      })
      .catch((err) => {
        setStudioError(err.message);
        setStudioLoading(false);
      });
  }, [studioId]);

  if (studioLoading) return <div className="eyf-page"><section className="eyf-section"><Spinner /></section></div>;
  if (studioError || !studio) return <div className="eyf-page"><section className="eyf-section"><ErrorMessage message={studioError} /></section></div>;

  const subtotal = studio.pricePerHour * hours;
  const fee = Math.round(subtotal * PLATFORM_FEE_RATE * 100) / 100;
  const total = subtotal + fee;

  const validateStep1 = () => {
    const errors = {};
    if (!date) errors.date = 'Please select a date.';
    else if (date < todayString()) errors.date = 'Date cannot be in the past.';
    if (!sessionType) errors.sessionType = 'Please select a session type.';
    return errors;
  };

  const goToStep2 = () => {
    const errors = validateStep1();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setStep(2);
  };

  const confirmBooking = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const created = await bookingsApi.create({
        studioId: studio.id,
        sessionType,
        date,
        time,
        hours,
      });
      setBooking(created);
      setStep(3);
      showToast('Booking confirmed. Check your dashboard for details.');
    } catch (err) {
      setSubmitError(err.message || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="eyf-page">
      <section className="eyf-section eyf-booking-flow">
        <div className="eyf-steps">
          {['Session details', 'Review & confirm', 'Confirmed'].map((label, index) => (
            <div
              key={label}
              className={`eyf-step ${step === index + 1 ? 'is-active' : ''} ${step > index + 1 ? 'is-done' : ''}`}
            >
              <span>{step > index + 1 ? '✓' : index + 1}</span>
              <strong>{label}</strong>
            </div>
          ))}
        </div>

        <div className="eyf-card eyf-stack">
          <div>
            <h1>Book {studio.name}</h1>
            <p className="eyf-muted">{studio.city}, {studio.state} · ${studio.pricePerHour}/hour</p>
          </div>

          {step === 1 ? (
            <>
              <div>
                <label>
                  Session type
                  <select value={sessionType} onChange={(e) => setSessionType(e.target.value)}>
                    {(studio.sessionTypes || []).map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>
                {fieldErrors.sessionType ? <p className="eyf-field-error">{fieldErrors.sessionType}</p> : null}
              </div>
              <div className="eyf-grid-2">
                <div>
                  <label>
                    Date
                    <input
                      type="date"
                      value={date}
                      min={todayString()}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </label>
                  {fieldErrors.date ? <p className="eyf-field-error">{fieldErrors.date}</p> : null}
                </div>
                <label>
                  Start time
                  <select value={time} onChange={(e) => setTime(e.target.value)}>
                    {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
              </div>
              <label>
                Duration: {hours} hour{hours !== 1 ? 's' : ''}
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                />
                <span className="eyf-muted" style={{ fontSize: '0.85rem' }}>
                  Estimated total: ${(studio.pricePerHour * hours * (1 + PLATFORM_FEE_RATE)).toFixed(0)}
                </span>
              </label>
              <button type="button" className="eyf-button" onClick={goToStep2}>
                Continue
              </button>
            </>
          ) : null}

          {step === 2 ? (
            <>
              {submitError ? <div className="eyf-error-box" role="alert">{submitError}</div> : null}
              <div className="eyf-summary-list">
                <div><span>Studio</span><strong>{studio.name}</strong></div>
                <div><span>Session type</span><strong>{sessionType}</strong></div>
                <div><span>Date</span><strong>{new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
                <div><span>Start time</span><strong>{time}</strong></div>
                <div><span>Duration</span><strong>{hours} hour{hours !== 1 ? 's' : ''}</strong></div>
                <div><span>Studio rate</span><strong>${studio.pricePerHour}/hr</strong></div>
                <div><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div>
                <div><span>Platform fee (8%)</span><strong>${fee.toFixed(2)}</strong></div>
                <div className="total-row"><span><strong>Total</strong></span><strong style={{ color: 'var(--mint)' }}>${total.toFixed(2)}</strong></div>
              </div>
              <p className="eyf-muted" style={{ fontSize: '0.85rem' }}>
                Payment is processed at the studio. You will receive a booking confirmation in your dashboard.
              </p>
              <div className="eyf-grid-2">
                <button type="button" className="eyf-button eyf-button--ghost" onClick={() => setStep(1)}>
                  Back
                </button>
                <button
                  type="button"
                  className="eyf-button"
                  onClick={confirmBooking}
                  disabled={submitting}
                >
                  {submitting ? 'Confirming…' : 'Confirm booking'}
                </button>
              </div>
            </>
          ) : null}

          {step === 3 && booking ? (
            <div className="eyf-stack" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem' }}>✓</div>
              <h2>Booking confirmed</h2>
              <p className="eyf-muted">
                Your session at <strong>{studio.name}</strong> on{' '}
                {new Date(booking.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}{' '}
                at {booking.time} has been submitted.
              </p>
              <p className="eyf-muted">
                Booking reference: <strong>#{booking.id}</strong> · Status: <strong>{booking.status.toLowerCase()}</strong>
              </p>
              <div className="eyf-grid-2">
                <Link className="eyf-link-button eyf-link-button--ghost" to="/discover">
                  Browse more studios
                </Link>
                <Link className="eyf-link-button" to="/dashboard/client">
                  View dashboard
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
