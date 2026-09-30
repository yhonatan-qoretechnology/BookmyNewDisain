"use client";
/* ============================================================
   "Así funciona" — los cinco pasos con el móvil que cambia de
   pantalla según lo que se está leyendo. El paso activo es el
   que queda más cerca del 45% de la ventana.
============================================================ */
import { useCallback, useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";
import { useWebT } from "./useWebT";

const PASOS = [1, 2, 3, 4, 5];

export default function StepsSection() {
  const { w } = useWebT();
  const [activo, setActivo] = useState(1);
  const items = useRef<(HTMLElement | null)[]>([]);

  const actualizar = useCallback(() => {
    const referencia = window.innerHeight * 0.45;
    let cercano = 1;
    let distancia = Infinity;
    items.current.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - referencia);
      if (d < distancia) { distancia = d; cercano = i + 1; }
    });
    setActivo(cercano);
  }, []);

  useEffect(() => {
    let pendiente = false;
    const alHacerScroll = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => { pendiente = false; actualizar(); });
    };
    window.addEventListener("scroll", alHacerScroll, { passive: true });
    window.addEventListener("resize", alHacerScroll);
    actualizar();
    return () => {
      window.removeEventListener("scroll", alHacerScroll);
      window.removeEventListener("resize", alHacerScroll);
    };
  }, [actualizar]);

  return (
    <section className="steps" id="funciona">
      <div className="container">
        <Reveal as="p" className="eyebrow center"><span className="eyebrow-dot" />{w("steps.eyebrow")}</Reveal>
        <Reveal as="h2" className="center">
          <span className="t-soft">{w("steps.title1")}</span>{" "}
          <span className="t-accent">{w("steps.title2")}</span>
        </Reveal>
        <Reveal as="p" className="center sub">{w("steps.text")}</Reveal>

        <div className="steps-scroll">
          <div className="steps-list">
            {PASOS.map((n, i) => (
              <article
                key={n}
                className={`step-item ${activo === n ? "is-active" : ""}`}
                ref={(el) => { items.current[i] = el; }}
              >
                <span className="step-count"><span className="step-count-current">{String(n).padStart(2, "0")}</span> / 05</span>
                <h3>{w(`steps.s${n}.title`)}</h3>
                <p>{w(`steps.s${n}.text`)}</p>
              </article>
            ))}
            <div className="steps-spacer" aria-hidden />
          </div>

          <div className="steps-visual">
            <div className="steps-phone">
              <div className="steps-phone-frame">
                <span className="steps-phone-island" aria-hidden />
                <div className="steps-phone-screen">
                  {PASOS.map((n) => (
                    <img
                      key={n}
                      className={`steps-screen-img ${activo === n ? "is-active" : ""}`}
                      src={`/web/img/funciona-bookmy-${n}.png`}
                      alt={w(`steps.s${n}.title`)}
                      loading="lazy"
                      decoding="async"
                    />
                  ))}
                </div>
              </div>
              <span className="steps-phone-btn steps-phone-btn-power" aria-hidden />
              <span className="steps-phone-btn steps-phone-btn-vol1" aria-hidden />
              <span className="steps-phone-btn steps-phone-btn-vol2" aria-hidden />
              <div className="steps-phone-glow" aria-hidden />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
