import { SectionHeading } from '../../components/efyia/ui';
import MapView from '../../components/efyia/MapView';

export default function MapPage() {
  return (
    <div className="eyf-page">
      <section className="eyf-section">
        <SectionHeading
          eyebrow="Map view"
          title="Studio locations in your favorite cities"
          description="Select a pin to explore studios near you."
        />
        <MapView />
      </section>
    </div>
  );
}
