import { SectionHeading } from '../../components/efyia/ui';

const sprintRows = [
  ['1', 'Auth, roles, database schema'],
  ['2', 'Studio CRUD and uploads'],
  ['3', 'Search API and map integration'],
  ['4', 'Booking flow and payments'],
  ['5', 'Review system'],
  ['6', 'Client and studio dashboards'],
  ['7', 'Admin tools and moderation'],
  ['8+', 'Payouts, email, SEO, launch hardening'],
];

export default function SetupGuidePage() {
  return (
    <div className="eyf-page">
      <section className="eyf-section eyf-stack">
        <SectionHeading
          eyebrow="MVP guide"
          title="Recommended production architecture for Efyia Book"
          description="The repo now includes the interactive frontend plus a dedicated backend folder, while this page preserves the recommended production stack and sprint plan from your brief."
        />
        <div className="eyf-admin-grid">
          <div className="eyf-card eyf-stack">
            <h3>Frontend</h3>
            <ul>
              <li>Next.js 14 App Router for production.</li>
              <li>Tailwind CSS + Shadcn/UI for scalable components.</li>
              <li>Zustand and React Query for app state and data fetching.</li>
              <li>Mapbox GL JS for live geospatial browsing.</li>
            </ul>
          </div>
          <div className="eyf-card eyf-stack">
            <h3>Backend</h3>
            <ul>
              <li>Node.js + Express or Next.js API routes.</li>
              <li>PostgreSQL + Prisma for persistence.</li>
              <li>Supabase or Clerk for auth and identity.</li>
              <li>Stripe, Cloudinary, and deployment on Vercel/Railway/Supabase.</li>
            </ul>
          </div>
        </div>
        <div className="eyf-card eyf-stack">
          <h3>Suggested sprint order</h3>
          {sprintRows.map(([sprint, details]) => (
            <div key={sprint} className="eyf-row eyf-row--between">
              <strong>Sprint {sprint}</strong>
              <span className="eyf-muted">{details}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
