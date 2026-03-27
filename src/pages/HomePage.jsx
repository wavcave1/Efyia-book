import GallerySection from '../components/GallerySection';
import LogoStrip from '../components/LogoStrip';
import RatesCards from '../components/RatesCards';
import SectionHeading from '../components/SectionHeading';

const highlights = [
  'Vocals & beat sessions welcome',
  'Hourly and monthly rate options',
  'Professional engineer',
  'Columbia, TN — 45 minutes from Nashville',
];

export default function HomePage() {
  return (
    <div className="page">
      <section className="hero">
        <div className="hero__content">
          <p className="section-heading__eyebrow">Columbia, Tennessee recording services</p>
          <h1>Your sound deserves a real studio.</h1>
          <p className="hero__lede">
            The Wav Cave is where artists come to record, create, and walk out with
            something they're proud of. Bring your vocals, your guitar, or just your ideas
            we'll help you capture them right.
          </p>
          <div className="hero__actions">
            <a className="button button--primary" href="/booking.html">Book studio time</a>
            <a className="button button--secondary" href="/rates">See rates</a>
          </div>
          <ul className="hero__highlights">
            {highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="hero__media">
          <img className="hero__logo" src="/images/logo.png" alt="WAV CAVE STUDIO logo" />
          <img className="hero__image" src="/images/st7.png" alt="Recording setup inside WAV CAVE STUDIO" />
        </div>
      </section>

      <section className="content-section">
        <SectionHeading
          eyebrow="Why artists book here"
          title="A studio built for the way artists actually work."
          description="From first take energy to final mix polish, the Wav Cave is set up to keep your session moving — without the corporate studio overhead or the guesswork."
        />
        <div className="benefit-grid">
          <article className="benefit-card">
            <h3>Sounds that translate</h3>
            <p>Track vocals, live instruments, and layered productions in a room tuned to deliver results that hold up on every speaker — from earbuds to car stereos.</p>
          </article>
          <article className="benefit-card">
            <h3>Book in minutes</h3>
            <p>No back and forth emails. Pick your date, choose your session length, and confirm your spot online. Studio time is waiting — grab it before someone else does.</p>
          </article>
          <article className="benefit-card">
            <h3>Flexible for every budget</h3>
            <p>Drop in hourly sessions for a quick vocal cut or monthly plans for artists who need a consistent creative space. There's an option that fits where you're at.</p>
          </article>
        </div>
      </section>

      <section className="content-section content-section--tight">
        <SectionHeading
          eyebrow="Inside the studio"
          title="See the room before you book."
          description="Walk in knowing exactly what to expect. The Wav Cave is a focused, professional environment designed to keep your creativity front and center."
          align="center"
        />
        <GallerySection />
      </section>

      <section className="content-section" id="rates">
        <SectionHeading
          eyebrow="Rates"
          title="Studio time that fits your budget."
          description="Whether you're recording a single or building out a full project, there's a rate option for where you are in your career."
        />
        <RatesCards />
      </section>

      <section className="content-section">
        <SectionHeading
          eyebrow="Tools and workflow"
          title="Trusted gear. No compromises."
          description="Every piece of equipment in the Wav Cave was chosen to give your recordings the professional edge they need to compete at the next level."
        />
        <LogoStrip />
      </section>

      <section className="bottom-cta">
        <div>
          <p className="section-heading__eyebrow">Ready when you are</p>
          <h2>Make your next session official.</h2>
          <p>Sessions fill up fast lock in your date today and start recording tomorrow.</p>
        </div>
        <a className="button button--primary" href="/booking.html">Book your session now</a>
      </section>
    </div>
  );
}
