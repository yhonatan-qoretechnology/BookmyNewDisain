"use client";
/* ============================================================
   /crear-cuenta — alta de un negocio en bookmy.es
   ------------------------------------------------------------
   Reemplaza al modal "déjanos tus datos y te llamamos": aquí se
   crea la cuenta de verdad y se entra al panel.
============================================================ */
import { Suspense } from "react";
import Link from "next/link";
import Reveal from "@/components/web/Reveal";
import SignupWizard from "@/components/web/SignupWizard";
import { useWebT } from "@/components/web/useWebT";

function Cabecera() {
  const { w } = useWebT();
  return (
    <>
      <Link href="/#planes" className="plan-back-link">{w("signup.back")}</Link>
      <Reveal as="p" className="eyebrow"><span className="eyebrow-dot" />{w("signup.eyebrow")}</Reveal>
      <Reveal as="h1" className="plan-title">
        <span className="t-white">{w("signup.title1")}</span>{" "}
        <span className="t-accent">{w("signup.title2")}</span>
      </Reveal>
      <Reveal as="p" className="plan-hero-text">{w("signup.lead")}</Reveal>
    </>
  );
}

export default function CrearCuentaPage() {
  return (
    <section className="plan-hero signup-section">
      <div className="container">
        <Cabecera />
        {/* useSearchParams necesita un límite de Suspense en el build estático */}
        <Suspense fallback={null}>
          <SignupWizard />
        </Suspense>
      </div>
    </section>
  );
}
