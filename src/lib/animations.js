import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─── Utility ──────────────────────────────────────────────────────────────────

function reduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ─── Hero heading — 3-D letter entrance ───────────────────────────────────────
//
// Targets every .gsap-char inside the given container element.
// Each character falls in from above with an X-axis rotation, creating a
// dramatic "flipping letters" effect. A stagger spreads the entrance across
// the full word.
//
// Returns a cleanup fn that kills the timeline on unmount.
export function animateHeroHeading(headingEl) {
  if (reduced() || !headingEl) return () => {};

  const chars = headingEl.querySelectorAll('.gsap-char');
  if (!chars.length) return () => {};

  // Give each character its own 3-D space so the rotateX looks correct
  gsap.set(chars, {
    transformPerspective: 900,
    transformOrigin: '50% 100% -24px',
  });

  const tl = gsap.timeline();
  tl.from(chars, {
    duration: 0.7,
    opacity: 0,
    rotateX: -85,
    y: 44,
    stagger: { each: 0.038, ease: 'power1.inOut' },
    ease: 'back.out(1.7)',
    delay: 0.1,
  });

  return () => tl.kill();
}

// ─── Hero supporting content — fade + slide ───────────────────────────────────
//
// Animates a list of DOM elements (eyebrow, sub-copy, search bar, city chips)
// sequentially after the heading has finished its entrance.
export function animateHeroContent(elements) {
  if (reduced()) return () => {};

  const els = elements.filter(Boolean);
  if (!els.length) return () => {};

  const tl = gsap.timeline({ delay: 0.72 });
  tl.from(els, {
    duration: 0.72,
    opacity: 0,
    y: 26,
    stagger: 0.1,
    ease: 'power3.out',
  });

  return () => tl.kill();
}

// ─── Scroll animations ────────────────────────────────────────────────────────
//
// Call once on mount (after DOM is painted). Each animation sets its own
// ScrollTrigger so it fires only when the element enters the viewport.
// Using autoAlpha (visibility + opacity) prevents a brief flash of hidden
// content before the trigger activates.
export function initScrollAnimations() {
  if (reduced()) return () => {};

  const kills = [];

  // 1. Hero background parallax — background layer drifts upward as you scroll
  //    down, creating depth separation from the foreground content.
  const heroBg = document.querySelector('.eyf-home-hero__bg');
  const heroSection = document.querySelector('.eyf-home-hero');
  if (heroBg && heroSection) {
    const heroParallax = gsap.to(heroBg, {
      y: '22%',
      ease: 'none',
      scrollTrigger: {
        trigger: heroSection,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      },
    });
    if (heroParallax.scrollTrigger) kills.push(heroParallax.scrollTrigger);
  }

  // 2. Category buttons — wave stagger as row scrolls into view.
  const categoriesSection = document.querySelector('.eyf-home-categories');
  const categoryItems = document.querySelectorAll('.eyf-home-category');
  if (categoriesSection && categoryItems.length) {
    const cats = gsap.from(categoryItems, {
      scrollTrigger: {
        trigger: categoriesSection,
        start: 'top 92%',
        once: true,
      },
      duration: 0.42,
      autoAlpha: 0,
      scale: 0.82,
      stagger: 0.035,
      ease: 'back.out(1.5)',
    });
    if (cats.scrollTrigger) kills.push(cats.scrollTrigger);
  }

  // 3. Stats strip — each stat pops in from a slightly scaled-down state,
  //    giving a "punchy" reveal consistent with bold numeric content.
  const statsSection = document.querySelector('.eyf-home-stats');
  const statsItems = document.querySelectorAll('.eyf-home-stats__item');
  if (statsSection && statsItems.length) {
    const stats = gsap.from(statsItems, {
      scrollTrigger: {
        trigger: statsSection,
        start: 'top 87%',
        once: true,
      },
      duration: 0.5,
      autoAlpha: 0,
      scale: 0.72,
      stagger: 0.08,
      ease: 'back.out(1.8)',
    });
    if (stats.scrollTrigger) kills.push(stats.scrollTrigger);
  }

  // 4. How-it-works steps — staggered slide-up so each card lands in sequence,
  //    guiding the reader's eye left-to-right through the process.
  const stepsSection = document.querySelector('.eyf-how-steps');
  const stepItems = document.querySelectorAll('.eyf-how-step');
  if (stepsSection && stepItems.length) {
    const steps = gsap.from(stepItems, {
      scrollTrigger: {
        trigger: stepsSection,
        start: 'top 80%',
        once: true,
      },
      duration: 0.65,
      autoAlpha: 0,
      y: 52,
      stagger: 0.15,
      ease: 'power3.out',
    });
    if (steps.scrollTrigger) kills.push(steps.scrollTrigger);
  }

  // 5. CTA section — larger y-offset creates a more dramatic reveal befitting
  //    a full-width conversion block at the bottom of the page.
  const ctaSection = document.querySelector('.eyf-home-cta');
  const ctaInner = document.querySelector('.eyf-home-cta__inner');
  if (ctaSection && ctaInner) {
    const cta = gsap.from(ctaInner, {
      scrollTrigger: {
        trigger: ctaSection,
        start: 'top 82%',
        once: true,
      },
      duration: 0.8,
      autoAlpha: 0,
      y: 60,
      ease: 'power3.out',
    });
    if (cta.scrollTrigger) kills.push(cta.scrollTrigger);
  }

  return () => kills.forEach((t) => t.kill());
}

// ─── Studio card grid ─────────────────────────────────────────────────────────
//
// Separated from initScrollAnimations because cards load asynchronously.
// Call this inside a useEffect that depends on the loaded studios array.
export function initCardScrollAnimation() {
  if (reduced()) return () => {};

  const cardGrid = document.querySelector('.eyf-card-grid');
  const cards = document.querySelectorAll('.eyf-card-grid .eyf-card');
  if (!cardGrid || !cards.length) return () => {};

  const anim = gsap.from(cards, {
    scrollTrigger: {
      trigger: cardGrid,
      start: 'top 83%',
      once: true,
    },
    duration: 0.55,
    autoAlpha: 0,
    y: 36,
    stagger: 0.055,
    ease: 'power2.out',
  });

  return () => anim.scrollTrigger?.kill();
}
