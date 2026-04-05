import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { studioProfileApi } from '../../lib/api';
import { FONT_PAIRINGS, LAYOUT_TYPES, buildStudioVars, FONT_URLS } from '../../lib/studioTheme';
import LayoutMinimal from './LayoutMinimal';
import LayoutHero from './LayoutHero';
import LayoutSplit from './LayoutSplit';
import LayoutGrid from './LayoutGrid';
import '../../styles/studio.css';

const LAYOUT_COMPONENTS = {
  minimal: LayoutMinimal,
  hero: LayoutHero,
  split: LayoutSplit,
  grid: LayoutGrid,
};

const injectedFonts = new Set();
function injectFont(url) {
  if (!url || injectedFonts.has(url)) return;
  injectedFonts.add(url);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

function FieldGroup({ label, children }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.875rem' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function ProfileCustomizer({ studio: initialStudio, onSaved }) {
  const [form, setForm] = useState(() => ({
    name: initialStudio?.name || '',
    description: initialStudio?.description || '',
    richDescription: initialStudio?.richDescription || '',
    logoUrl: initialStudio?.logoUrl || '',
    coverUrl: initialStudio?.coverUrl || '',
    accentColor: initialStudio?.accentColor || '#62f3d4',
    themeOverride: initialStudio?.themeOverride || '',
    fontPairing: initialStudio?.fontPairing || 'modern',
    layoutType: initialStudio?.layoutType || 'minimal',
    socialLinks: initialStudio?.socialLinks || {},
    contactInfo: initialStudio?.contactInfo || {},
    services: initialStudio?.services || [],
  }));

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('branding');

  // Inject font when pairing changes
  useEffect(() => {
    const url = FONT_URLS[form.fontPairing];
    if (url) injectFont(url);
  }, [form.fontPairing]);

  const set = useCallback((field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }, []);

  const setSocial = useCallback((field) => (e) => {
    setForm((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [field]: e.target.value },
    }));
  }, []);

  const setContact = useCallback((field) => (e) => {
    setForm((prev) => ({
      ...prev,
      contactInfo: { ...prev.contactInfo, [field]: e.target.value },
    }));
  }, []);

  const addService = () => {
    setForm((prev) => ({
      ...prev,
      services: [...(prev.services || []), { name: '', description: '', price: '', unit: 'hr' }],
    }));
  };

  const removeService = (idx) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== idx),
    }));
  };

  const setService = (idx, field) => (e) => {
    setForm((prev) => {
      const updated = [...prev.services];
      updated[idx] = { ...updated[idx], [field]: e.target.value };
      return { ...prev, services: updated };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      // Normalize services: convert price string to number or undefined
      const services = (form.services || [])
        .filter((s) => s.name.trim())
        .map((s) => ({
          name: s.name,
          description: s.description || undefined,
          price: s.price !== '' && s.price != null ? parseFloat(s.price) : undefined,
          unit: s.unit || undefined,
        }));

      const payload = {
        ...form,
        themeOverride: form.themeOverride || null,
        logoUrl: form.logoUrl || null,
        coverUrl: form.coverUrl || null,
        services: services.length ? services : null,
        socialLinks: Object.values(form.socialLinks).some(Boolean) ? form.socialLinks : null,
        contactInfo: Object.values(form.contactInfo).some(Boolean) ? form.contactInfo : null,
      };

      const updated = await studioProfileApi.update(payload);
      if (onSaved) onSaved(updated);
    } catch (err) {
      setSaveError(err.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  // Build a preview studio object by merging the form with the initial studio data
  const previewStudio = {
    ...initialStudio,
    ...form,
    services: (form.services || [])
      .filter((s) => s.name.trim())
      .map((s) => ({ ...s, price: s.price !== '' ? parseFloat(s.price) : undefined })),
  };

  const PreviewLayout = LAYOUT_COMPONENTS[form.layoutType] || LayoutMinimal;
  const previewVars = buildStudioVars(previewStudio);

  const TABS = [
    { id: 'branding', label: 'Branding' },
    { id: 'layout', label: 'Layout' },
    { id: 'content', label: 'Content' },
    { id: 'services', label: 'Services' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <div>
      {/* Tab nav */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.5rem 1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--studio-accent, #62f3d4)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--text)' : 'var(--muted)',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 700 : 400,
              fontSize: '0.9rem',
              paddingBottom: '0.6rem',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Branding tab */}
      {activeTab === 'branding' ? (
        <div>
          <FieldGroup label="Accent color">
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input
                type="color"
                value={form.accentColor}
                onChange={set('accentColor')}
                style={{ width: 44, height: 44, border: 'none', cursor: 'pointer', borderRadius: 6, background: 'none' }}
              />
              <input
                type="text"
                value={form.accentColor}
                onChange={set('accentColor')}
                placeholder="#62f3d4"
                maxLength={7}
                style={{ width: '100px' }}
              />
            </div>
          </FieldGroup>

          <FieldGroup label="Logo URL">
            <input
              type="url"
              value={form.logoUrl}
              onChange={set('logoUrl')}
              placeholder="https://cdn.example.com/logo.png"
            />
            {form.logoUrl ? (
              <img
                src={form.logoUrl}
                alt="Logo preview"
                style={{ maxHeight: 60, maxWidth: 200, objectFit: 'contain', marginTop: '0.5rem', display: 'block' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : null}
          </FieldGroup>

          <FieldGroup label="Cover image URL">
            <input
              type="url"
              value={form.coverUrl}
              onChange={set('coverUrl')}
              placeholder="https://cdn.example.com/cover.jpg"
            />
            {form.coverUrl ? (
              <div
                style={{
                  marginTop: '0.5rem',
                  height: 100,
                  borderRadius: 8,
                  backgroundImage: `url(${form.coverUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1px solid var(--border)',
                }}
              />
            ) : null}
          </FieldGroup>

          <FieldGroup label="Page theme override">
            <select value={form.themeOverride} onChange={set('themeOverride')}>
              <option value="">Follow visitor preference</option>
              <option value="dark">Always dark</option>
              <option value="light">Always light</option>
            </select>
          </FieldGroup>
        </div>
      ) : null}

      {/* Layout tab */}
      {activeTab === 'layout' ? (
        <div>
          <FieldGroup label="Layout template">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {Object.entries(LAYOUT_TYPES).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, layoutType: key }))}
                  style={{
                    padding: '1rem',
                    borderRadius: 10,
                    border: `2px solid ${form.layoutType === key ? form.accentColor : 'var(--border)'}`,
                    background: form.layoutType === key ? `${form.accentColor}18` : 'var(--card)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{cfg.preview}</div>
                  <strong style={{ fontSize: '0.9rem' }}>{cfg.label}</strong>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                    {cfg.description}
                  </p>
                </button>
              ))}
            </div>
          </FieldGroup>

          <FieldGroup label="Font pairing">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.entries(FONT_PAIRINGS).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, fontPairing: key }))}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 8,
                    border: `2px solid ${form.fontPairing === key ? form.accentColor : 'var(--border)'}`,
                    background: form.fontPairing === key ? `${form.accentColor}18` : 'var(--card)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: cfg.headingFamily,
                  }}
                >
                  <strong style={{ fontSize: '0.95rem' }}>{cfg.label}</strong>
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--muted)', fontFamily: "'Inter', sans-serif" }}>
                    — {cfg.description}
                  </span>
                </button>
              ))}
            </div>
          </FieldGroup>
        </div>
      ) : null}

      {/* Content tab */}
      {activeTab === 'content' ? (
        <div>
          <FieldGroup label="Studio name">
            <input type="text" value={form.name} onChange={set('name')} />
          </FieldGroup>
          <FieldGroup label="Short description (used on marketplace cards)">
            <textarea rows={3} value={form.description} onChange={set('description')} />
          </FieldGroup>
          <FieldGroup label="Rich description (full text shown on your studio page — supports line breaks)">
            <textarea
              rows={8}
              value={form.richDescription}
              onChange={set('richDescription')}
              placeholder="Tell your story, describe the vibe, list what makes your space special…"
            />
          </FieldGroup>
        </div>
      ) : null}

      {/* Services tab */}
      {activeTab === 'services' ? (
        <div>
          {(form.services || []).map((svc, idx) => (
            <div
              key={idx}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '1rem',
                marginBottom: '1rem',
                background: 'var(--card)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <strong style={{ fontSize: '0.875rem' }}>Service {idx + 1}</strong>
                <button
                  type="button"
                  onClick={() => removeService(idx)}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}
                  aria-label="Remove service"
                >
                  ×
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '0.25rem' }}>Name *</label>
                  <input value={svc.name} onChange={setService(idx, 'name')} placeholder="e.g. Recording session" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '0.25rem' }}>Price ($)</label>
                    <input type="number" min="0" value={svc.price} onChange={setService(idx, 'price')} placeholder="85" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '0.25rem' }}>Unit</label>
                    <input value={svc.unit} onChange={setService(idx, 'unit')} placeholder="hr" />
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '0.25rem' }}>Description</label>
                <textarea rows={2} value={svc.description} onChange={setService(idx, 'description')} placeholder="Brief description of what's included…" />
              </div>
            </div>
          ))}
          <button
            type="button"
            className="eyf-button eyf-button--secondary"
            onClick={addService}
            style={{ width: '100%' }}
          >
            + Add service
          </button>
        </div>
      ) : null}

      {/* Contact tab */}
      {activeTab === 'contact' ? (
        <div>
          <FieldGroup label="Phone number">
            <input type="tel" value={form.contactInfo?.phone || ''} onChange={setContact('phone')} placeholder="+1 (555) 000-0000" />
          </FieldGroup>
          <FieldGroup label="Booking email">
            <input type="email" value={form.contactInfo?.email || ''} onChange={setContact('email')} placeholder="bookings@yourstudio.com" />
          </FieldGroup>
          <FieldGroup label="External booking URL">
            <input type="url" value={form.contactInfo?.bookingUrl || ''} onChange={setContact('bookingUrl')} placeholder="https://calendly.com/yourstudio" />
          </FieldGroup>

          <h4 style={{ margin: '1.5rem 0 1rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>
            Social links
          </h4>
          {['instagram', 'twitter', 'facebook', 'youtube', 'soundcloud', 'website'].map((platform) => (
            <FieldGroup key={platform} label={platform.charAt(0).toUpperCase() + platform.slice(1)}>
              <input
                type="url"
                value={form.socialLinks?.[platform] || ''}
                onChange={setSocial(platform)}
                placeholder={`https://${platform}.com/yourstudio`}
              />
            </FieldGroup>
          ))}
        </div>
      ) : null}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
        <button
          type="button"
          className="eyf-button"
          onClick={handleSave}
          disabled={saving}
          style={{ background: form.accentColor, color: '#111', borderColor: form.accentColor }}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          className="eyf-button eyf-button--ghost"
          onClick={() => setShowPreview((v) => !v)}
        >
          {showPreview ? 'Hide preview' : 'Show preview'}
        </button>
        {initialStudio?.slug ? (
          <Link
            to={`/s/${initialStudio.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.875rem', color: 'var(--muted)', textDecoration: 'underline' }}
          >
            Open live page ↗
          </Link>
        ) : null}
        {saveError ? (
          <span style={{ color: 'var(--error, #f87171)', fontSize: '0.875rem' }}>{saveError}</span>
        ) : null}
      </div>

      {/* Live preview */}
      {showPreview ? (
        <div style={{ marginTop: '2rem' }}>
          <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>
            Live preview — {LAYOUT_TYPES[form.layoutType]?.label}
          </h4>
          <div className="sp-preview-frame">
            <div className="sp-root" style={previewVars}>
              <PreviewLayout studio={previewStudio} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
