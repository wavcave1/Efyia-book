import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { SectionHeading, Stars } from '../../components/efyia/ui';

export default function MapPage() {
  const { studios } = useAppContext();

  return (
    <div className="eyf-page">
      <section className="eyf-section">
        <SectionHeading
          eyebrow="Interactive map"
          title="Preview studio coverage across key music markets"
          description="This MVP uses a stylized map canvas with pin cards so stakeholders can validate the browsing experience before a Mapbox upgrade."
        />
        <div className="eyf-map-layout">
          <div className="eyf-card eyf-map-canvas">
            {studios.map((studio, index) => (
              <div
                key={studio.id}
                className="eyf-map-pin"
                style={{ left: `${18 + index * 16}%`, top: `${60 - index * 9}%`, background: studio.color }}
                title={studio.name}
              />
            ))}
            <p className="eyf-map-note">Prototype map canvas with clickable studio pin positions.</p>
          </div>
          <div className="eyf-map-sidebar">
            {studios.map((studio) => (
              <article key={studio.id} className="eyf-card eyf-map-card">
                <div className="eyf-row eyf-row--between eyf-row--start">
                  <div>
                    <h3>{studio.name}</h3>
                    <p className="eyf-muted">{studio.city}, {studio.state}</p>
                  </div>
                  <span className="eyf-price">${studio.pricePerHour}/hr</span>
                </div>
                <Stars rating={studio.rating} />
                <p className="eyf-muted">{studio.description}</p>
                <Link className="eyf-link-button" to={`/studios/${studio.slug}`}>
                  View profile
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
