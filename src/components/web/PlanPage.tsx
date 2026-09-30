"use client";
/* ============================================================
   Página de un plan (Bookmy Free / Bookmy CRM Pro).
   Las dos páginas del sitio estático eran la misma estructura
   con distinto contenido, así que aquí es un solo componente
   con el plan como parámetro.
============================================================ */
import Link from "next/link";
import Reveal from "./Reveal";
import { useLeadModal } from "./LeadModal";
import { useWebT } from "./useWebT";

type Plan = "free" | "pro";

const ICONOS: Record<Plan, React.ReactNode[]> = {
  free: [
    <><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></>,
    <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" /><path d="M12 7v5l3.2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></>,
    <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
    <><rect x="6" y="2.5" width="12" height="19" rx="2.4" stroke="currentColor" strokeWidth="1.6" /><path d="M10.5 18.2h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></>,
    <><circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.6" /><path d="M5 20c1.2-3.6 4-5.4 7-5.4S17.8 16.4 19 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></>,
  ],
  pro: [
    <><rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M3 10h18M7 14.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></>,
    <><rect x="3" y="4.5" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M7 9h10M7 13h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></>,
    <><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" /><circle cx="17" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.6" /><path d="M2.5 19c.8-3.4 3-5.2 5.5-5.2s4.7 1.8 5.5 5.2M14.8 19c.5-2.3 1.9-3.7 3.7-3.7s3.2 1.4 3.7 3.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></>,
    <><path d="M3 9.5 12 4l9 5.5v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M9 19v-5h6v5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></>,
    <><circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.6" /><path d="M5 20c1.2-3.6 4-5.4 7-5.4S17.8 16.4 19 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><path d="M16.5 4.5l1.2 1.2M19 8h1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></>,
    <path d="M4 19V10M10 19V5M16 19v-7M21 19H3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />,
    <><path d="M3 21V9l5-3 5 3 5-3v12" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M8 21v-5M13 21v-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></>,
  ],
};

const IMAGEN: Record<Plan, string> = {
  free: "/web/img/free-bookmy.jpg",
  pro: "/web/img/pro-bookmy2.jpg",
};

const NOMBRE: Record<Plan, string> = { free: "Bookmy Free", pro: "Bookmy CRM Pro" };

export default function PlanPage({ plan }: { plan: Plan }) {
  const { w } = useWebT();
  const { abrir } = useLeadModal();
  const iconos = ICONOS[plan];
  const otro = plan === "free" ? "/bookmy-crm-pro" : "/bookmy-free";

  return (
    <>
      <section className="plan-hero">
        <div className="container">
          <Link href="/#planes" className="plan-back-link">{w("planpage.back")}</Link>

          <div className="plan-hero-grid">
            <Reveal>
              <p className="eyebrow"><span className="eyebrow-dot" />{w(`planpage.${plan}.eyebrow`)}</p>
              <h1 className="plan-title">
                <span className="t-white">{w(`planpage.${plan}.title1`)}</span>{" "}
                <span className="t-accent">{w(`planpage.${plan}.title2`)}</span>
              </h1>
              <p className="plan-hero-text">{w(`planpage.${plan}.text`)}</p>
              <div className="plan-hero-actions">
                <Link href={`/crear-cuenta?plan=${plan}`} className="btn btn-primary">
                  {w(`planpage.${plan}.cta`)}
                </Link>
                <Link href={otro} className="plan-compare-link">
                  {plan === "free" ? w("planpage.compareLink") : w("planpage.compareLinkFree")}
                </Link>
              </div>
            </Reveal>

            <Reveal className="plan-summary-card glass">
              <div className="price-img">
                <img src={IMAGEN[plan]} alt={NOMBRE[plan]} loading="lazy" decoding="async" />
              </div>
              <h3>{w(`pricing.${plan}.title`)}</h3>
              <div className="plan-summary-row">
                <span>{w(`planpage.${plan}.priceLabel`)}</span>
                <span>{w(`planpage.${plan}.priceValue`)}</span>
              </div>
              <div className="plan-summary-row">
                <span>{w("pricing.eyebrow")}</span>
                <span>{w(`pricing.${plan}.tagline`)}</span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="plan-features-section">
        <div className="container">
          <Reveal as="p" className="eyebrow center"><span className="eyebrow-dot" />{w("planpage.featuresEyebrow")}</Reveal>
          <Reveal as="h2" className="center">
            <span className="t-soft">{w("planpage.featuresTitle1")}</span>{" "}
            <span className="t-accent">{w("planpage.featuresTitle2")}</span>
          </Reveal>

          <div className="plan-features-grid">
            {iconos.map((icono, i) => (
              <Reveal as="article" className="plan-feature-card" key={i} delay={i * 60}>
                <span className="plan-feature-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden>{icono}</svg>
                </span>
                <div>
                  <h3>{w(`planpage.${plan}.f${i + 1}Title`)}</h3>
                  <p>{w(`planpage.${plan}.f${i + 1}Text`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="plan-cta-section">
        <div className="container">
          <Reveal className="plan-cta-box">
            <p className="eyebrow"><span className="eyebrow-dot" />{w("planpage.ctaEyebrow")}</p>
            <h2>{w(`planpage.${plan}.title2`)}</h2>
            <p>{w("planpage.ctaText")}</p>
            <div className="plan-cta-actions">
              <Link href={`/crear-cuenta?plan=${plan}`} className="btn btn-dark">
                {w(`planpage.${plan}.cta`)}
              </Link>
              <button type="button" className="btn btn-ghost" onClick={() => abrir(NOMBRE[plan])}>
                {w("planpage.salesCta")}
              </button>
            </div>
            <p className="plan-cta-trial">
              {plan === "free" ? w("pricing.freeTrialNudge") : w("pricing.proTrial")}
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
