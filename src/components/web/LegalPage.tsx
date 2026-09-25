"use client";
/* ============================================================
   Páginas legales (privacidad y cookies).
   Las dos son la misma estructura: portada, índice lateral y
   bloques numerados; cambia el contenido, que sale del
   diccionario. El índice marca en qué bloque estás.
============================================================ */
import { useEffect, useState } from "react";
import Link from "next/link";
import Reveal from "./Reveal";
import { useWebT } from "./useWebT";
import { useCookieBanner } from "./CookieBanner";

export interface BloqueLegal {
  /** Ancla del bloque, p. ej. "s1" o "c2" */
  id: string;
  /** Clave del título dentro de la sección del diccionario */
  titulo: string;
  /** Clave del párrafo principal (opcional si solo hay lista o tabla) */
  texto?: string;
  /** Claves de los puntos de una lista */
  lista?: string[];
  /** Tabla de cookies: [claveTipo, claveFinalidad, claveDuracion][] */
  tabla?: { cabeceras: string[]; filas: string[][] };
  /** Botón para reabrir el aviso de cookies */
  botonCookies?: string;
}

export default function LegalPage({
  seccion,
  bloques,
}: {
  seccion: "privacy" | "cookies";
  bloques: BloqueLegal[];
}) {
  const { w } = useWebT();
  const { abrir: abrirCookies } = useCookieBanner();
  const [activo, setActivo] = useState(bloques[0]?.id);

  /* El índice sigue al bloque que se está leyendo */
  useEffect(() => {
    const secciones = bloques
      .map((b) => document.getElementById(b.id))
      .filter((el): el is HTMLElement => !!el);
    if (!secciones.length || !("IntersectionObserver" in window)) return;
    const obs = new IntersectionObserver(
      (entradas) => {
        const visible = entradas
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActivo(visible.target.id);
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: 0 }
    );
    secciones.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [bloques]);

  return (
    <>
      <section className="legal-hero">
        <div className="container">
          <Link href="/" className="plan-back-link">{w("planpage.back")}</Link>
          <p className="eyebrow"><span className="eyebrow-dot" />{w("legal.eyebrow")}</p>
          <h1><span className="t-white">{w(`${seccion}.title`)}</span></h1>
          <p>{w(`${seccion}.intro`)}</p>
          <span className="legal-updated"><span className="dot-status" />{w("legal.updated")}</span>
        </div>
      </section>

      <section className="legal-section">
        <div className="container legal-grid">
          <aside className="legal-toc glass">
            <h4>{w("legal.tocTitle")}</h4>
            {bloques.map((b, i) => (
              <a key={b.id} href={`#${b.id}`} className={activo === b.id ? "is-active" : ""}>
                {w(`${seccion}.toc${i + 1}`)}
              </a>
            ))}
            <div className="legal-toc-cta">
              <p>{w("legal.tocCtaText")}</p>
              <Link href="/contacto" className="btn btn-dark btn-small btn-block">{w("legal.tocCtaBtn")}</Link>
            </div>
          </aside>

          <div className="legal-content">
            {bloques.map((b, i) => (
              <article className="legal-block" id={b.id} key={b.id}>
                <h2>
                  <span className="legal-block-num">{i + 1}</span>
                  <span>{w(`${seccion}.${b.titulo}`)}</span>
                </h2>
                {b.texto && <p>{w(`${seccion}.${b.texto}`)}</p>}

                {b.lista && (
                  <ul>
                    {b.lista.map((clave) => (
                      <li key={clave}>
                        <span className="check-icon" aria-hidden>✓</span>
                        <span>{w(`${seccion}.${clave}`)}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {b.tabla && (
                  <div className="legal-table-wrap">
                    <table>
                      <thead>
                        <tr>{b.tabla.cabeceras.map((c) => <th key={c}>{w(`${seccion}.${c}`)}</th>)}</tr>
                      </thead>
                      <tbody>
                        {b.tabla.filas.map((fila, f) => (
                          <tr key={f}>
                            {fila.map((celda, c) => (
                              <td key={celda} data-label={w(`${seccion}.${b.tabla!.cabeceras[c]}`)}>
                                {w(`${seccion}.${celda}`)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {b.botonCookies && (
                  <button type="button" className="btn btn-dark btn-small" onClick={abrirCookies}>
                    {w(`${seccion}.${b.botonCookies}`)}
                  </button>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
