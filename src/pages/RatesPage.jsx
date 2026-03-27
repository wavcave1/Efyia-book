import { useState } from 'react';
import RatesCards from '../components/RatesCards';
import SectionHeading from '../components/SectionHeading';
import PopupModal from '../components/PopupModal';

export default function RatesPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="page page--narrow">
      <section className="page-hero">
        <SectionHeading
          eyebrow="Rates & packages"
          title="Choose the studio time that fits your workflow."
          description=""
        />
      </section>

      <RatesCards />

      <section className="bottom-cta bottom-cta--compact">
        <div>
          <p className="section-heading__eyebrow">Want a better rate?</p>
          <h2>Book on wednesday or thursday for a spcial rate</h2>
          <p>
            
          </p>
        </div>

        <div className="bottom-cta__actions">
          <button
            type="button"
            className="button button--primary"
            onClick={() => setOpen(true)}
          >
            View Special
          </button>

          <a className="button button--secondary" href="/contact">
            Contact the studio
          </a>
        </div>
      </section>

      <PopupModal isOpen={open} onClose={() => setOpen(false)} />
    </div>
  );
}
