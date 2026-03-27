const logos = [
  { src: '/images/waves-logo-white.png', alt: 'Waves' },
  { src: '/images/motu-logo.png', alt: 'MOTU' },
  { src: '/images/neumann_audio_logo.png', alt: 'Neumann Audio' },
  { src: '/images/flstudio_logo_light.png', alt: 'FL Studio' },
  { src: '/images/wa-bug_v1.png', alt: 'Waves Audio Bug' },
  { src: '/images/plugin-alliance-logo-preview.png', alt: 'Plugin Alliance' },
  { src: '/images/wbclogo.png', alt: 'WBC' },
  { src: '/images/pro-tools-logo.png', alt: 'Pro Tools' },
];

export default function LogoStrip() {
  return (
    <div className="logo-strip">
      {logos.map((logo) => (
        <div key={logo.alt} className="logo-strip__item">
          <img src={logo.src} alt={logo.alt} loading="lazy" />
        </div>
      ))}
    </div>
  );
}
