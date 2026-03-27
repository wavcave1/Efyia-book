const hourlyRates = [
  { title: '2 Hour Session', price: '$100', details: 'Ideal for focused vocal tracking or finishing a single idea.' },
  { title: '4 Hour Session', price: '$175', details: 'Extra time for multiple takes, comping, and stronger creative momentum.' },
  { title: '8 Hour Session', price: '$360', details: 'Best for artists planning a full day of tracking with an engineer included.' },
  { title: '12 Hour Session', price: '$540', details: 'For longer creative blocks that need room for experimentation and execution.' },
];

const subscriptionRates = [
  { title: '4 Hours / Month', price: '$160 / month', details: 'Consistent monthly studio time with a 3-month commitment.' },
  { title: '8 Hours / Month', price: '$300 / month', details: 'Flexible recurring sessions spread across up to 4 days.' },
  { title: '12 Hours / Month', price: '$420 / month', details: 'The strongest subscription value for artists building a regular release schedule.' },
];

function RateCard({ title, price, details, actionLabel, href }) {
  return (
    <article className="rate-card">
      <p className="rate-card__price">{price}</p>
      <h3>{title}</h3>
      <p>{details}</p>
      <a className="button button--primary button--full" href={href}>{actionLabel}</a>
    </article>
  );
}

export default function RatesCards({ showSubscriptions = true }) {
  return (
    <div className="rates-stack">
      <section className="rates-grid">
        {hourlyRates.map((rate) => (
          <RateCard key={rate.title} {...rate} actionLabel="Book this session" href="/booking.html" />
        ))}
      </section>

      {showSubscriptions ? (
        <section className="subscription-panel">
          <div className="subscription-panel__intro">
            <p className="section-heading__eyebrow">Monthly memberships</p>
            <h3>Need regular time in the studio?</h3>
            <p>Subscriptions are designed for artists who want recurring sessions without rethinking the schedule every week.</p>
          </div>
          <div className="rates-grid rates-grid--subscriptions">
            {subscriptionRates.map((rate) => (
              <RateCard key={rate.title} {...rate} actionLabel="View subscription options" href="/subscription.html" />
            ))}
          </div>
        </section>
      ) : null}

      <div className="rates-note">
        <p>You’ll receive a rough mix at the end of each session, and sessions of 8 hours or more include complimentary mix and mastering.</p>
        <a className="button button--primary" href="/booking.html">Book from rates</a>
      </div>
    </div>
  );
}
