const galleryImages = [
  '/images/st1.png',
  '/images/st2.png',
  '/images/st3.png',
  '/images/st4.png',
  '/images/st5.png',
  '/images/st6.png',
];

export default function GallerySection() {
  return (
    <section className="gallery-section">
      {galleryImages.map((src, index) => (
        <figure key={src} className={`gallery-card gallery-card--${(index % 3) + 1}`}>
          <img src={src} alt={`Inside WAV CAVE STUDIO ${index + 1}`} loading="lazy" />
        </figure>
      ))}
    </section>
  );
}
