"use client";
/* ============================================================
   bookmy.es — portada
   ------------------------------------------------------------
   Paso a Next de index.html de la web estática: mismas secciones
   y mismas imágenes, con el texto saliendo del diccionario del
   panel (t("web.…")) y una banda nueva de acceso al panel.
============================================================ */
import Link from "next/link";
import { ROUTES } from "@/constants";
import Reveal from "@/components/web/Reveal";
import FaqList from "@/components/web/FaqList";
import StepsSection from "@/components/web/StepsSection";
import { useWebT } from "@/components/web/useWebT";

const MARCAS = ["Glow", "Rituals by Glow", "Qore Technology", "Lash by Glow", "Ink Nova"];
const CIUDADES = ["Benalmádena", "Fuengirola", "Marbella", "Málaga", "Torremolinos"];

export default function HomePage() {
  const { w, locale } = useWebT();

  const faq = [1, 2, 3, 4, 5].map((n) => ({ q: w(`faq.q${n}`), a: w(`faq.a${n}`) }));

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="hero" id="app">
        <div className="container hero-grid">
          <Reveal className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" />{w("hero.eyebrow")}</p>
            <h1 className="hero-title">
              <span className="t-white">{w("hero.title1")}</span>
              <span className="t-accent">{w("hero.title2")}</span>
              <span className="t-soft">{w("hero.title3")}</span>
            </h1>
            <p className="hero-text">{w("hero.text")}</p>

            <div className="hero-meta">
              <div className="avatar-stack" aria-hidden>
                {[1, 2, 3, 4].map((n) => (
                  <img key={n} src={`/web/img/pp${n}.png`} alt="" />
                ))}
              </div>
              <div className="avatar-meta-text">
                <strong>+25K</strong>
                <span>{w("hero.users")}</span>
              </div>
            </div>

            <div className="hero-cta-row">
              <Link href="#planes" className="btn btn-primary">{w("hero.ctaPrimary")}</Link>
              <Link href="#funciona" className="btn btn-ghost">{w("hero.ctaSecondary")}</Link>
            </div>

            <div className="hero-info-card glass">
              <span className="info-icon" aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M7 17 17 7M17 7H9M17 7v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <p>{w("hero.infoCard")}</p>
            </div>
          </Reveal>

          <Reveal className="hero-visual" aria-hidden>
            <div className="ghost-word">BOOKMY</div>

            <svg className="orbit-path" viewBox="0 0 520 520">
              <path d="M70,150 C150,40 380,40 450,160 C500,250 470,400 330,460 C190,510 70,420 70,300" fill="none" stroke="url(#orbitGrad)" strokeWidth="1.4" strokeDasharray="2 8" />
              <defs>
                <linearGradient id="orbitGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#39ff8c" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#70c1a6" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            <div className="hero-chip chip-1">
              <span className="chip-icon"><svg viewBox="0 0 24 24" width="16" height="16" fill="none"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg></span>
              <span className="chip-text"><strong>32</strong><small>{w("hero.chip1")}</small></span>
            </div>
            <div className="hero-chip chip-2">
              <span className="chip-icon"><svg viewBox="0 0 24 24" width="16" height="16" fill="none"><path d="M12 21s-7-4.6-9.6-9.1C.7 8.6 2 5 5.4 4.3 7.7 3.9 10 5 12 7c2-2 4.3-3.1 6.6-2.7C22 5 23.3 8.6 21.6 11.9 19 16.4 12 21 12 21Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg></span>
              <span className="chip-text"><strong>4.9★</strong><small>{w("hero.chip2")}</small></span>
            </div>
            <div className="hero-chip chip-3">
              <span className="chip-icon"><svg viewBox="0 0 24 24" width="16" height="16" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" /><path d="M12 7v5l3.2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg></span>
              <span className="chip-text"><strong>2 min</strong><small>{w("hero.chip3")}</small></span>
            </div>

            <div className="hero-float-img">
              <img
                src={locale === "en" ? "/web/img/bookmy-app-funciona.webp" : "/web/img/introThumb1_1.png"}
                alt=""
                className="hero-float-image"
                fetchPriority="high"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Marquesina ───────────────────────────────────── */}
      <Reveal as="section" className="marquee-x-wrap" aria-hidden>
        <div className="marquee-x">
          <div className="marquee-row row-a">
            <div className="marquee-track">
              {[...MARCAS, ...MARCAS].map((m, i) => <span key={`${m}-${i}`}>✦ {m}</span>)}
            </div>
          </div>
          <div className="marquee-row row-b">
            <div className="marquee-track">
              {[...CIUDADES, ...CIUDADES].map((c, i) => <span key={`${c}-${i}`}>• {c}</span>)}
            </div>
          </div>
        </div>
      </Reveal>

      {/* ── Aliado de confianza ──────────────────────────── */}
      <section className="trust" id="confianza">
        <div className="container">
          <div className="trust-head">
            <Reveal as="h2">
              <span className="t-soft">{w("trust.title1")}</span>{" "}
              <span className="t-accent">{w("trust.title2")}</span>{" "}
              <span className="t-soft">{w("trust.title3")}</span>
            </Reveal>
            <Reveal as="p">{w("trust.text")}</Reveal>
          </div>

          <div className="trust-cards">
            <Reveal as="article" className="trust-card">
              <span className="trust-num">01.</span>
              <h3>{w("trust.card1.title")}</h3>
              <p>{w("trust.card1.text")}</p>
            </Reveal>
            <Reveal as="article" className="trust-card trust-card-highlight" delay={80}>
              <span className="trust-num">02.</span>
              <h3>{w("trust.card2.title")}</h3>
              <p>{w("trust.card2.text")}</p>
              <Link href="#funciona" className="btn btn-dark btn-small">{w("trust.card2.cta")}</Link>
            </Reveal>
            <Reveal as="article" className="trust-card" delay={160}>
              <span className="trust-num">03.</span>
              <h3>{w("trust.card3.title")}</h3>
              <p>{w("trust.card3.text")}</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ────────────────────────────────── */}
      <StepsSection />

      {/* ── Experiencia / panel ──────────────────────────── */}
      <section className="experience">
        <div className="container experience-grid">
          <Reveal className="experience-visual">
            <div className="float-card card-rate glass">
              <span className="dash" aria-hidden>|</span>
              <div>
                <strong>{w("experience.statTitle")}</strong>
                <p>{w("experience.statText")}</p>
              </div>
            </div>

            <div className="mini-chart glass">
              <svg viewBox="0 0 220 110" className="chart-svg" aria-hidden>
                <polyline points="0,80 30,60 55,68 85,35 115,46 150,18 180,28 220,10" fill="none" stroke="#39ff8c" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="150" cy="18" r="4" fill="#39ff8c" />
              </svg>
              <span className="chart-marker">{w("experience.chartMarker")}</span>
            </div>

            <div className="float-card card-volume glass">
              <span className="vol-label">{w("experience.volTitle")}</span>
              <strong className="vol-amount">1,245</strong>
              <span className="vol-trend">↗ +45.6%</span>
              <span className="vol-pill">{w("experience.volBadge")}</span>
            </div>

            <div className="exp-image-wrap">
              <img src="/web/img/dashboard-b.png" alt={w("experience.title2")} className="exp-image" loading="lazy" decoding="async" />
            </div>
          </Reveal>

          <Reveal className="experience-copy">
            <h2>
              <span className="t-soft">{w("experience.title1")}</span>{" "}
              <span className="t-accent">{w("experience.title2")}</span>
            </h2>
            <div className="stars" aria-hidden>★★★★★</div>
            <p>{w("experience.text1")}</p>

            <ul className="check-list">
              {[1, 2, 3, 4].map((n) => (
                <li key={n}><span className="check-icon" aria-hidden>✓</span><span>{w(`experience.check${n}`)}</span></li>
              ))}
            </ul>

            <div className="hero-cta-row">
              <Link href="#planes" className="btn btn-primary">{w("experience.cta")}</Link>
              <Link href="#faq" className="link-question">{w("experience.ask")}</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Planes ───────────────────────────────────────── */}
      <section className="pricing" id="planes">
        <div className="container">
          <Reveal as="p" className="eyebrow center"><span className="eyebrow-dot" />{w("pricing.eyebrow")}</Reveal>
          <Reveal as="h2" className="center">
            <span className="t-soft">{w("pricing.title1")}</span>{" "}
            <span className="t-accent">{w("pricing.title2")}</span>
          </Reveal>
          <Reveal as="p" className="center sub">{w("pricing.text")}</Reveal>

          <div className="pricing-grid">
            <Reveal as="article" className="price-card">
              <div className="price-img"><img src="/web/img/free-bookmy.jpg" alt="Bookmy Free" loading="lazy" decoding="async" /></div>
              <h3>{w("pricing.free.title")}</h3>
              <p className="price-tag">{w("pricing.free.tagline")}</p>
              <p className="price-desc">{w("pricing.free.text")}</p>
              <ul className="feature-list">
                {[1, 2, 3, 4, 5].map((n) => (
                  <li key={n}><span className="check-icon" aria-hidden>✓</span><span>{w(`pricing.free.f${n}`)}</span></li>
                ))}
              </ul>
              <Link href="/crear-cuenta?plan=free" className="btn btn-dark btn-block">
                {w("pricing.free.cta")}
              </Link>
              <p className="price-trial">{w("pricing.freeTrialNudge")}</p>
              <Link href="/bookmy-free" className="price-more">{w("planpage.free.moreLink")}</Link>
            </Reveal>

            <Reveal as="article" className="price-card price-card-highlight" delay={90}>
              <span className="badge-popular">{w("pricing.popular")}</span>
              <div className="price-img"><img src="/web/img/pro-bookmy2.jpg" alt="Bookmy CRM Pro" loading="lazy" decoding="async" /></div>
              <h3>{w("pricing.pro.title")}</h3>
              <p className="price-tag">{w("pricing.pro.tagline")}</p>
              <p className="price-desc">{w("pricing.pro.text")}</p>
              <ul className="feature-list">
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <li key={n}><span className="check-icon" aria-hidden>✓</span><span>{w(`pricing.pro.f${n}`)}</span></li>
                ))}
              </ul>
              <Link href="/crear-cuenta?plan=pro" className="btn btn-primary btn-block">
                {w("pricing.pro.cta")}
              </Link>
              <p className="price-trial">{w("pricing.proTrial")}</p>
              <Link href="/bookmy-crm-pro" className="price-more">{w("planpage.pro.moreLink")}</Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Acceso al panel ──────────────────────────────── */}
      <section className="panel-access" id="acceso">
        <div className="container">
          <Reveal className="panel-access-card glass">
            <div className="panel-access-copy">
              <p className="eyebrow"><span className="eyebrow-dot" />{w("panelAccess.eyebrow")}</p>
              <h2>
                <span className="t-soft">{w("panelAccess.title1")}</span>{" "}
                <span className="t-accent">{w("panelAccess.title2")}</span>
              </h2>
              <p>{w("panelAccess.text")}</p>
              <ul className="check-list">
                {[1, 2, 3].map((n) => (
                  <li key={n}><span className="check-icon" aria-hidden>✓</span><span>{w(`panelAccess.point${n}`)}</span></li>
                ))}
              </ul>
              <div className="hero-cta-row">
                <Link href={ROUTES.login} className="btn btn-primary">{w("panelAccess.cta")}</Link>
                <Link href="/crear-cuenta?plan=pro" className="btn btn-ghost">
                  {w("panelAccess.secondary")}
                </Link>
              </div>
            </div>
            <div className="panel-access-visual" aria-hidden>
              <img src="/web/img/Dashboard  -director.png" alt="" loading="lazy" decoding="async" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section className="faq" id="faq">
        <div className="container faq-grid">
          <Reveal className="faq-head">
            <p className="eyebrow"><span className="eyebrow-dot" />{w("faq.eyebrow")}</p>
            <h2>
              <span className="t-soft">{w("faq.title1")}</span>{" "}
              <span className="t-accent">{w("faq.title2")}</span>
            </h2>
            <p>{w("faq.text")}</p>
          </Reveal>
          <Reveal>
            <FaqList items={faq} />
          </Reveal>
        </div>
      </section>

      {/* ── Testimonios ──────────────────────────────────── */}
      <section className="testimonials">
        <div className="container">
          <Reveal as="p" className="eyebrow center"><span className="eyebrow-dot" />{w("testi.eyebrow")}</Reveal>
          <Reveal as="h2" className="center">
            <span className="t-soft">{w("testi.title1")}</span>{" "}
            <span className="t-accent">{w("testi.title2")}</span>
          </Reveal>

          <div className="testi-grid">
            {[1, 2, 3].map((n) => (
              <Reveal as="article" className="testi-card glass" key={n} delay={(n - 1) * 80}>
                <p className="testi-quote">{w(`testi.q${n}`)}</p>
                <div className="testi-author">
                  <img src={`/web/img/test${n}.png`} alt="" loading="lazy" decoding="async" />
                  <div>
                    <strong>{w(`testi.n${n}`)}</strong>
                    <span>{w(`testi.r${n}`)}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Instagram ────────────────────────────────────── */}
      <section className="social-feed" id="redes">
        <div className="container">
          <Reveal as="p" className="eyebrow center"><span className="eyebrow-dot" />{w("social.eyebrow")}</Reveal>
          <Reveal as="h2" className="center">
            <span className="t-soft">{w("social.title1")}</span>{" "}
            <span className="t-accent">{w("social.title2")}</span>
          </Reveal>
          <Reveal as="p" className="center sub">{w("social.text")}</Reveal>

          <Reveal className="insta-grid">
            {[1, 2, 3, 1, 2].map((n, i) => (
              <a key={i} href="https://www.instagram.com/appbookmy/" target="_blank" rel="noopener" className="insta-card">
                <div className="insta-img-wrap">
                  <img src={`/web/img/redes${n}.jpg`} alt={w("social.viewPost")} className="insta-img" loading="lazy" decoding="async" />
                  <div className="insta-overlay">
                    <svg className="insta-overlay-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden><rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.8" /><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" /></svg>
                    <span className="insta-overlay-label">{w("social.viewPost")}</span>
                  </div>
                </div>
              </a>
            ))}
          </Reveal>

          <Reveal className="insta-cta">
            <a href="https://www.instagram.com/appbookmy/" target="_blank" rel="noopener" className="btn btn-ghost insta-follow-btn">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden><rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.6" /><circle cx="17.2" cy="6.8" r="1" fill="currentColor" /></svg>
              <span>{w("social.followBtn")}</span>
            </a>
          </Reveal>
        </div>
      </section>

      {/* ── Descarga ─────────────────────────────────────── */}
      <section className="final-cta" id="contacto">
        <div className="container final-cta-grid">
          <Reveal className="final-copy">
            <p className="eyebrow"><span className="eyebrow-dot" />{w("cta.eyebrow")}</p>
            <h2>
              <span className="t-white">{w("cta.title1")}</span>{" "}
              <span className="t-accent">{w("cta.title2")}</span>
            </h2>
            <p>{w("cta.text")}</p>
            <div className="store-row">
              <a href="https://play.google.com/store/search?q=bookmy" target="_blank" rel="noopener" className="store-btn">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden><path d="M17.5 12.5 5 21V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
                <span><small>{w("cta.storeOn")}</small>Google Play</span>
              </a>
              <a href="https://apps.apple.com/search?term=bookmy" target="_blank" rel="noopener" className="store-btn">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden><path d="M16.4 3.4c.2 1-.2 2-.8 2.7-.6.7-1.6 1.3-2.6 1.2-.2-1 .3-2 .9-2.7.6-.7 1.6-1.2 2.5-1.2ZM19.8 17c-.5 1.1-.8 1.6-1.4 2.6-1 1.6-2.4 3.5-4.2 3.5-1.6 0-2-1-4.1-1s-2.6 1-4.2 1c-1.7 0-3-1.8-4-3.4C-.4 16-.1 10.4 3.4 8c.9-.6 2-1 3.1-1 1.4 0 2.5.9 3.4.9.8 0 2.1-1 3.8-1 1.2 0 2.6.3 3.5 1.2-3.1 1.9-2.6 6.3 1.6 8.9Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>
                <span><small>{w("cta.storeOn")}</small>App Store</span>
              </a>
            </div>
          </Reveal>

          <Reveal className="final-visual" aria-hidden>
            <div className="hero-chip chip-1">
              <span className="chip-icon"><svg viewBox="0 0 24 24" width="16" height="16" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
              <span className="chip-text"><strong>{w("cta.chip1Strong")}</strong><small>{w("cta.chip1Small")}</small></span>
            </div>
            <div className="hero-chip chip-2">
              <span className="chip-icon"><svg viewBox="0 0 24 24" width="16" height="16" fill="none"><path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg></span>
              <span className="chip-text"><strong>{w("cta.chip2Strong")}</strong><small>{w("cta.chip2Small")}</small></span>
            </div>
            <div className="final-float-img">
              <img src="/web/img/bookmy-app-funciona.png" alt="" className="final-float-image" loading="lazy" decoding="async" />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
