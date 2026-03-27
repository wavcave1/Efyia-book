import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

export default function BookingPage() {
  const navigate = useNavigate();
  const { studioId } = useParams();
  const { studios, currentUser, createBooking } = useAppContext();
  const studio = useMemo(() => studios.find((item) => item.id === Number(studioId)) || studios[0], [studioId, studios]);
  const [sessionType, setSessionType] = useState(studio.sessionTypes[0]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00 AM');
  const [duration, setDuration] = useState(2);
  const [step, setStep] = useState(1);

  const subtotal = studio.pricePerHour * duration;
  const fee = Math.round(subtotal * 0.08);
  const total = subtotal + fee;

  const confirmBooking = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    createBooking({ studioId: studio.id, date: date || '2026-04-30', time, duration, sessionType });
    navigate('/dashboard/client');
  };

  return (
    <div className="eyf-page">
      <section className="eyf-section eyf-booking-flow">
        <div className="eyf-steps">
          {['Session details', 'Review & pay', 'Confirmed'].map((label, index) => (
            <div key={label} className={`eyf-step ${step === index + 1 ? 'is-active' : ''}`}>
              <span>{index + 1}</span>
              <strong>{label}</strong>
            </div>
          ))}
        </div>
        <div className="eyf-card eyf-stack">
          <div>
            <h1>Book {studio.name}</h1>
            <p className="eyf-muted">{studio.city} · ${studio.pricePerHour}/hour</p>
          </div>
          {step === 1 ? (
            <>
              <label>
                Session type
                <select value={sessionType} onChange={(event) => setSessionType(event.target.value)}>
                  {studio.sessionTypes.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <div className="eyf-grid-2">
                <label>
                  Date
                  <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
                </label>
                <label>
                  Time
                  <select value={time} onChange={(event) => setTime(event.target.value)}>
                    {['9:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM'].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
              </div>
              <label>
                Duration ({duration} hours)
                <input type="range" min="1" max="8" value={duration} onChange={(event) => setDuration(Number(event.target.value))} />
              </label>
              <button type="button" className="eyf-button" onClick={() => setStep(2)}>Continue</button>
            </>
          ) : null}
          {step === 2 ? (
            <>
              <div className="eyf-summary-list">
                <div><span>Session type</span><strong>{sessionType}</strong></div>
                <div><span>Date</span><strong>{date || 'Select at checkout'}</strong></div>
                <div><span>Time</span><strong>{time}</strong></div>
                <div><span>Duration</span><strong>{duration} hours</strong></div>
                <div><span>Subtotal</span><strong>${subtotal}</strong></div>
                <div><span>Platform fee</span><strong>${fee}</strong></div>
                <div><span>Total</span><strong>${total}</strong></div>
              </div>
              <div className="eyf-grid-2">
                <button type="button" className="eyf-button eyf-button--ghost" onClick={() => setStep(1)}>Back</button>
                <button type="button" className="eyf-button" onClick={() => { setStep(3); confirmBooking(); }}>
                  Confirm & pay
                </button>
              </div>
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}
