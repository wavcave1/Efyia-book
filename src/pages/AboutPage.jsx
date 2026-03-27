import GallerySection from '../components/GallerySection';
import LogoStrip from '../components/LogoStrip';
import SectionHeading from '../components/SectionHeading';

const aboutPoints = [
  {
    title: 'Creative environment',
    body: 'WAV CAVE STUDIO is built for artists who want a relaxed, focused room where ideas can move from rough concept to polished track without unnecessary friction.',
  },
  {
    title: 'Professional support',
    body: 'Whether you are recording vocals, layering instruments, or building a full song, the studio workflow stays centered on clarity, performance, and usable results.',
  },
  {
    title: 'Flexible sessions',
    body: 'From shorter focused sessions to recurring creative blocks, the available session lengths and subscriptions are meant to support real release schedules and consistent progress.',
  },
];

const videos = [
  { src: '/media/st7.mp4', title: 'Studio walkthrough clip 1' },
  { src: '/media/st8.mp4', title: 'Studio walkthrough clip 2' },
  { src: '/media/st9.mp4', title: 'Studio walkthrough clip 3' },
];

export default function AboutPage() {
  return (
    <div className="page">
      <section className="page-hero">
        <SectionHeading
          eyebrow="About WAV CAVE"
          title="A recording studio built for serious artists in Columbia, Tennessee."
          description=""
        />
        <div className="page-hero__actions">
          <a className="button button--primary" href="/booking.html">Book studio time</a>
          <a className="button button--secondary" href="/rates">View rates</a>
        </div>
      </section>

      <section className="content-section content-section--tight">
        <div className="about-grid">
          {aboutPoints.map((point) => (
            <article key={point.title} className="benefit-card">
              <h3>{point.title}</h3>
              <p>{point.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section content-section--tight">
        <SectionHeading
          eyebrow="Studio visuals"
          title="See the room and creative setup."
          description=""
          align="center"
        />
        <GallerySection />
      </section>

      <section className="content-section content-section--tight">
        <SectionHeading
          eyebrow="Studio clips"
          title="A closer look at the space."
          description=""
          align="center"
        />
        <div className="video-grid">
          {videos.map((video) => (
            <article key={video.src} className="video-card">
              <video controls preload="metadata">
                <source src={video.src} type="video/mp4" />
              </video>
              <p>{video.title}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section">
        <SectionHeading
          eyebrow="Gear and tools"
          title="Trusted equipment and software are still part of the story."
          description= "We record with high quality tools from trusted brands such as nuemann, warm audio, and universal,"
        />
        <LogoStrip />
      </section>

      <section className="bottom-cta">
        <div>
          <p className="section-heading__eyebrow">Ready to record?</p>
          <h2>Cultivate your sound at the Wav Cave</h2>
          <p></p>
        </div>
        <a className="button button--primary" href="/booking.html">Book now</a>
      </section>
    </div>
  );
}
