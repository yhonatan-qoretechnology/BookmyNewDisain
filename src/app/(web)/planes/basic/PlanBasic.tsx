"use client";
/* ============================================================
   /planes/basic — el Plan Basic
   ------------------------------------------------------------
   Paso a Next de plan-basic.html del diseño 2.0. Mismas clases,
   mismos atributos data-* y mismas variables en línea (--i, --k,
   --x/--y/--z): de eso vive el motor de animación, así que lo que
   aquí parezca decorativo no lo es.

   POR QUÉ ESTE ARCHIVO ES CLIENTE Y page.tsx NO
   Todo el texto sale de useWebT(), que es un hook, y el marco
   <PaginaWeb> también es de cliente. Pero un archivo con
   "use client" no puede exportar `metadata`, así que la página de
   verdad (page.tsx) se queda en el servidor, exporta los
   metadatos y mete esto dentro.

   LA CLASE DE LA PANTALLA ES "plan-basic" Y NO SE TOCA
   bookmy.css afina el titular y la entradilla del héroe con
   .page-plan-basic, y esta página vivía en /bookmy-free, que
   sigue entrando aquí por un 301. Si cambia ese nombre, el héroe
   se descuadra.

   LA PRUEBA GRATUITA
   El diseño prometía siete días de prueba en el héroe, en la
   lista de «es para ti», en la tabla, en tres preguntas y en la
   llamada final. Hoy no hay prueba que ofrecer (ver
   src/lib/web/oferta.ts), así que cada uno de esos textos tiene
   dos versiones en el diccionario y `promesa()` elige. El número
   de días nunca está escrito: viaja como {dias}.
============================================================ */
import type { CSSProperties } from "react";
import Link from "next/link";
import PaginaWeb from "@/components/web/PaginaWeb";
import { useWebT } from "@/components/web/useWebT";
import { WEB } from "@/lib/web/rutas";
import { DIAS_DE_PRUEBA, SE_OFRECE_PRUEBA } from "@/lib/web/oferta";

/** El `style="--i:4"` del original: el turno en el que entra cada bloque. */
const ritmo = (i: number) => ({ "--i": i }) as CSSProperties;

/** Las capas de grosor del teléfono 3D, de la más honda a la de arriba. */
const CAPAS = [6, 5, 4, 3, 2, 1];

/** El alta que recoge cada botón de este plan. */
const ALTA_BASIC = `${WEB.crearCuenta}?plan=basic`;
const ALTA_PRO = `${WEB.crearCuenta}?plan=pro`;

/** Las ocho filas de la tabla: qué trae Basic y qué añade Pro. */
const FILAS: { clave: string; basic: boolean; nuevo?: boolean }[] = [
  { clave: "f1", basic: true },
  { clave: "f2", basic: true },
  { clave: "f3", basic: false },
  { clave: "f4", basic: false },
  { clave: "f5", basic: false },
  { clave: "f6", basic: false },
  { clave: "f7", basic: false },
  { clave: "f8", basic: false, nuevo: true },
];

export default function PlanBasic() {
  const { w } = useWebT();
  /* Atajos para no arrastrar "planBasic." por doscientas líneas. */
  const txt = (clave: string) => w(`planBasic.${clave}`);
  /** Los textos que van por parejas: la versión con prueba o la de sin ella. */
  const promesa = (clave: string) =>
    w(`planBasic.${clave}${SE_OFRECE_PRUEBA ? "ConPrueba" : "SinPrueba"}`, { dias: DIAS_DE_PRUEBA });

  return (
    <PaginaWeb
      mundo="crm"
      pagina="plan-basic"
      cta={
        /* ── 7 · La llamada final, que corona el pie ───────── */
        <section className="f-cta" aria-labelledby="f-cta-title">
          <div className="wrap">
            <h2 className="f-cta__title" id="f-cta-title" data-split="">
              {txt("cierre.tituloA")} <em>{txt("cierre.tituloB")}</em>
            </h2>
            <p className="lead" data-reveal="">{promesa("cierre.lead")}</p>
            <div className="f-cta__actions" data-reveal="" style={ritmo(1)}>
              <Link className="btn btn--primary btn--lg" href={ALTA_BASIC}>
                {promesa("cierre.cta")} <i className="i i-arrow-right" aria-hidden />
              </Link>
              {/* El asistente lo engancha solo por estos data-*, igual que en
                  la web estática: aquí no hace falta ningún onClick. */}
              <button
                className="btn btn--ghost btn--lg"
                type="button"
                data-assistant-flow="recomendar"
                data-assistant-label={txt("cierre.ctaAsistenteFrase")}
              >
                {txt("cierre.ctaAsistente")}
              </button>
            </div>
          </div>
        </section>
      }
    >
      {/* ── 1 · Héroe del Plan Basic ────────────────────────── */}
      <section className="ph-hero" data-pointer="" aria-labelledby="fr-title">
        <div className="wrap ph-hero__grid">
          <div className="ph-hero__copy">
            <Link className="ph-hero__back" href={WEB.planes} data-reveal="">
              <i className="i i-arrow-right flip" aria-hidden />
              {txt("hero.volver")}
            </Link>
            <h1 className="h-hero ph-hero__title" id="fr-title" data-split="">
              {txt("hero.tituloA")} <span className="mint">{txt("hero.tituloB")}</span>
            </h1>
            <p className="lead" data-reveal="" style={ritmo(4)}>{txt("hero.lead")}</p>

            {/* El bloque grande del precio. Mientras no haya prueba que
                ofrecer no dice días: dice que empezar no cuesta nada, que
                es lo que el alta cumple de verdad. */}
            <p className="ph-price" data-reveal="" style={ritmo(5)}>
              <b>{promesa("hero.precioCifra")}</b>
              <span>{promesa("hero.precioPie")}</span>
            </p>

            <div className="ph-hero__cta" data-reveal="" style={ritmo(6)}>
              <Link className="btn btn--primary btn--lg" href={ALTA_BASIC}>
                {promesa("hero.cta")} <i className="i i-arrow-right" aria-hidden />
              </Link>
              <a className="btn btn--ghost btn--lg" href="#comparar">{txt("hero.ctaComparar")}</a>
            </div>
            <p className="small muted" data-reveal="" style={ritmo(7)}>{txt("hero.nota")}</p>
          </div>

          <div className="ph-hero__stage" data-reveal="rise" style={ritmo(3)}>
            <div className="ap-hero__halo" aria-hidden />
            <div className="fr-rig">
              <div className="phone3d" role="img" aria-label={txt("hero.telefonoAlt")}>
                {CAPAS.map((k) => (
                  <span key={k} className="phone3d__layer" style={{ "--k": k } as CSSProperties} />
                ))}
                <div className="phone3d__front">
                  <div className="phone3d__screen">
                    {/* La única imagen de la pantalla y la primera que se ve:
                        va sin loading="lazy" para que no parpadee. El tamaño
                        se lo da el CSS, de ahí el <img> normal. */}
                    <img
                      className="is-on"
                      src="/web/v2/img/app-reserva.webp"
                      alt=""
                      width={740}
                      height={1600}
                      fetchPriority="high"
                      decoding="async"
                    />
                  </div>
                </div>
                <span className="phone3d__island" aria-hidden />
                <span className="phone3d__shine" aria-hidden />
              </div>

              <div className="fr-agenda" aria-hidden>
                <div className="frag">
                  <div className="frag__head">
                    <div><b>{txt("hero.agendaHoy")}</b><small>{txt("hero.agendaReservas")}</small></div>
                    <span className="live">{txt("hero.agendaAbierta")}</span>
                  </div>
                  <ul className="res-list">
                    <li><b>{txt("reservas.manicura")}</b><time>10:30</time><span className="tag">{txt("reservas.confirmada")}</span></li>
                    <li><b>{txt("reservas.cejas")}</b><time>13:15</time><span className="tag">{txt("reservas.confirmada")}</span></li>
                    <li><b>{txt("reservas.masaje")}</b><time>17:00</time><span className="tag tag--lime">{txt("reservas.pendiente")}</span></li>
                  </ul>
                </div>
              </div>

              {/* Los dos avisos que flotan alrededor del teléfono: --x/--y/--z
                  son su sitio en el espacio, no un adorno del CSS. */}
              <div
                className="fr-chip toast"
                style={{ "--x": "150px", "--y": "60px", "--z": "150px" } as CSSProperties}
                aria-hidden
              >
                <span className="ib"><i className="i i-calendar-check" /></span>
                <div><b>{txt("hero.chipNuevaTitulo")}</b>{txt("hero.chipNuevaTexto")}</div>
              </div>
              <div
                className="fr-chip toast"
                style={{ "--x": "120px", "--y": "470px", "--z": "110px" } as CSSProperties}
                aria-hidden
              >
                <span className="ib ib--amber"><i className="i i-moon" /></span>
                <div><b>{txt("hero.chipHorarioTitulo")}</b>{txt("hero.chipHorarioTexto")}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2 · Qué incluye: el bento sin huecos ───────────── */}
      <section className="sec">
        <div className="wrap">
          <div className="sec-head sec-head--split">
            <h2 className="h-lg" data-split="">{txt("incluye.titulo")}</h2>
            <p className="lead" data-reveal="">{txt("incluye.lead")}</p>
          </div>
          <div className="bento">
            <article className="bc bc--a" data-tilt="" data-reveal="">
              <span className="glare" aria-hidden />
              <div className="bc__txt">
                <h3 className="h-md">{txt("incluye.gestionTitulo")}</h3>
                <p>{txt("incluye.gestionTexto")}</p>
              </div>
              <div className="bc__ui frag" aria-hidden>
                <div className="frag__head">
                  <div><b>{txt("incluye.gestionPanelTitulo")}</b><small>{txt("incluye.gestionPanelSede")}</small></div>
                  <span className="live">{txt("incluye.gestionPanelDirecto")}</span>
                </div>
                <ul className="res-list">
                  <li><b>{txt("reservas.manicura")}</b><time>10:30</time><span className="tag">{txt("reservas.confirmada")}</span></li>
                  <li><b>{txt("reservas.cejas")}</b><time>13:15</time><span className="tag">{txt("reservas.confirmada")}</span></li>
                  <li><b>{txt("reservas.masaje")}</b><time>17:00</time><span className="tag tag--lime">{txt("reservas.pendiente")}</span></li>
                  <li><b>{txt("reservas.corte")}</b><time>18:30</time><span className="tag">{txt("reservas.confirmada")}</span></li>
                </ul>
              </div>
            </article>

            <article className="bc bc--b" data-tilt="" data-reveal="" style={ritmo(1)}>
              <span className="glare" aria-hidden />
              <div className="bc__txt">
                <h3 className="h-md">{txt("incluye.agendaTitulo")}</h3>
                <p>{txt("incluye.agendaTexto")}</p>
              </div>
              <div className="bc__ui" aria-hidden>
                <ul className="res-list">
                  <li><b>{txt("incluye.agendaRecibida")}</b><time>23:40</time><span className="tag">{txt("incluye.agendaDomingo")}</span></li>
                  <li><b>{txt("incluye.agendaRecibida")}</b><time>07:15</time><span className="tag">{txt("incluye.agendaLunes")}</span></li>
                  <li><b>{txt("incluye.agendaRecibida")}</b><time>14:05</time><span className="tag tag--lime">{txt("incluye.agendaFestivo")}</span></li>
                </ul>
              </div>
            </article>

            <article className="bc bc--c" data-tilt="" data-reveal="" style={ritmo(2)}>
              <span className="glare" aria-hidden />
              <div className="bc__txt">
                <h3 className="h-sm">{txt("incluye.confirmaTitulo")}</h3>
                <p>{txt("incluye.confirmaTexto")}</p>
              </div>
              <div className="bc__ui" aria-hidden>
                <div className="toast">
                  <span className="ib ib--solid"><i className="i i-check" /></span>
                  <div><b>{txt("incluye.confirmaToastTitulo")}</b>{txt("incluye.confirmaToastTexto")}</div>
                </div>
              </div>
            </article>

            <article className="bc bc--d" data-tilt="" data-reveal="" style={ritmo(3)}>
              <span className="glare" aria-hidden />
              <div className="bc__txt">
                <h3 className="h-sm">{txt("incluye.dispositivosTitulo")}</h3>
                <p>{txt("incluye.dispositivosTexto")}</p>
              </div>
              <div className="bc__ui" aria-hidden>
                <div className="share">
                  <span><i className="i i-smartphone" />{txt("incluye.dispositivosMovil")}</span>
                  <span><i className="i i-grid" />{txt("incluye.dispositivosTablet")}</span>
                </div>
              </div>
            </article>

            <article className="bc bc--e" data-tilt="" data-reveal="" style={ritmo(1)}>
              <span className="glare" aria-hidden />
              <div className="bc__txt">
                <h3 className="h-md">{txt("incluye.perfilTitulo")}</h3>
                <p>{txt("incluye.perfilTexto")}</p>
              </div>
              <div className="bc__ui" aria-hidden>
                <div className="share">
                  <span><i className="i i-heart" />Instagram</span>
                  <span><i className="i i-message-circle" />WhatsApp</span>
                  <span><i className="i i-search" />Google</span>
                  <span><i className="i i-globe" />{txt("incluye.perfilWeb")}</span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── 3 · ¿Es para ti? ───────────────────────────────── */}
      <section className="sec">
        <div className="wrap">
          <div className="sec-head">
            <h2 className="h-xl" data-split="">{txt("perfecto.titulo")}</h2>
          </div>
          <div className="fit">
            <ul className="fit__list">
              <li data-reveal=""><i className="i i-check" aria-hidden />{txt("perfecto.p1")}</li>
              <li data-reveal=""><i className="i i-check" aria-hidden />{txt("perfecto.p2")}</li>
              <li data-reveal=""><i className="i i-check" aria-hidden />{txt("perfecto.p3")}</li>
              <li data-reveal=""><i className="i i-check" aria-hidden />{promesa("perfecto.p4")}</li>
            </ul>
            <aside className="fit__aside" data-reveal="">
              <p>{txt("perfecto.asideTexto")}</p>
              <h3 className="h-sm">{txt("perfecto.asideTitulo")}</h3>
              <Link className="link-arrow" href={WEB.planPro}>
                {txt("perfecto.asideEnlace")} <i className="i i-arrow-right" aria-hidden />
              </Link>
            </aside>
          </div>
        </div>
      </section>

      {/* ── 4 · Tres pasos ─────────────────────────────────── */}
      <section className="sec">
        <div className="wrap">
          <div className="sec-head sec-head--center">
            <h2 className="h-xl" data-split="">{txt("pasos.titulo")}</h2>
          </div>
          <ol className="trio">
            <li className="trio__item" data-reveal="">
              <span className="trio__ic" aria-hidden><i className="i i-user-plus" /></span>
              <h3 className="h-md">{txt("pasos.unoTitulo")}</h3>
              <p>{txt("pasos.unoTexto")}</p>
            </li>
            <li className="trio__item" data-reveal="" style={ritmo(1)}>
              <span className="trio__ic" aria-hidden><i className="i i-scissors" /></span>
              <h3 className="h-md">{txt("pasos.dosTitulo")}</h3>
              <p>{txt("pasos.dosTexto")}</p>
            </li>
            <li className="trio__item" data-reveal="" style={ritmo(2)}>
              <span className="trio__ic" aria-hidden><i className="i i-send" /></span>
              <h3 className="h-md">{txt("pasos.tresTitulo")}</h3>
              <p>{txt("pasos.tresTexto")}</p>
            </li>
          </ol>
        </div>
      </section>

      {/* ── 5 · Basic frente a Pro ─────────────────────────── */}
      <section className="sec" id="comparar">
        <div className="wrap">
          <div className="sec-head sec-head--center">
            <h2 className="h-xl" data-split="">
              {txt("comparar.tituloA")} <span className="mint">{txt("comparar.tituloB")}</span>
            </h2>
          </div>
          <div className="compare-wrap" data-reveal="">
            <table className="compare">
              <caption className="sr-only">{txt("comparar.resumen")}</caption>
              <colgroup><col /><col /><col /></colgroup>
              <thead>
                <tr>
                  <th scope="col">{txt("comparar.colFuncion")}</th>
                  <th scope="col">{txt("comparar.colBasic")}<small>{promesa("comparar.notaBasic")}</small></th>
                  <th scope="col" className="hl">{txt("comparar.colPro")}<small>{promesa("comparar.notaPro")}</small></th>
                </tr>
              </thead>
              <tbody>
                {FILAS.map((fila) => (
                  <tr key={fila.clave}>
                    <td>
                      {txt(`comparar.${fila.clave}`)}
                      {fila.nuevo ? <> <span className="tag tag--lime">{w("comun.nav.nuevo")}</span></> : null}
                    </td>
                    <td className={fila.basic ? "yes" : "no"}>
                      <i
                        className={`i ${fila.basic ? "i-check" : "i-minus"}`}
                        aria-label={fila.basic ? txt("comparar.si") : txt("comparar.no")}
                      />
                    </td>
                    <td className="yes hl"><i className="i i-check" aria-label={txt("comparar.si")} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="compare-cta" data-reveal="">
            {/* Con prueba, el botón invita a probar Pro. Sin ella no puede:
                el alta crearía el negocio en Basic, así que lleva a conocer
                el plan en vez de prometer lo que no se concede. */}
            <Link className="btn btn--primary btn--lg" href={SE_OFRECE_PRUEBA ? ALTA_PRO : WEB.planPro}>
              {promesa("comparar.ctaPro")}
            </Link>
            <Link className="btn btn--ghost btn--lg" href={WEB.planes}>{txt("comparar.ctaCompleta")}</Link>
          </div>
        </div>
      </section>

      {/* ── 6 · Preguntas ──────────────────────────────────── */}
      <section className="sec cx-faq" id="faq">
        <div className="wrap cx-faq__grid">
          <div className="cx-faq__head">
            <h2 className="h-xl" data-split="">{txt("faq.titulo")}</h2>
          </div>
          {/* El abrir y cerrar lo lleva el motor por la clase .faq, igual
              que en la web estática: estos botones no llevan onClick. */}
          <div className="faq" data-reveal="">
            <div className="faq__item">
              <button className="faq__q" type="button">{promesa("faq.q1")}</button>
              <div className="faq__a"><div><p>{promesa("faq.a1")}</p></div></div>
            </div>
            <div className="faq__item">
              <button className="faq__q" type="button">{txt("faq.q2")}</button>
              <div className="faq__a"><div><p>{txt("faq.a2")}</p></div></div>
            </div>
            <div className="faq__item">
              <button className="faq__q" type="button">{promesa("faq.q3")}</button>
              <div className="faq__a"><div><p>{promesa("faq.a3")}</p></div></div>
            </div>
            <div className="faq__item">
              <button className="faq__q" type="button">{txt("faq.q4")}</button>
              <div className="faq__a"><div><p>{promesa("faq.a4")}</p></div></div>
            </div>
            <div className="faq__item">
              <button className="faq__q" type="button">{txt("faq.q5")}</button>
              <div className="faq__a">
                <div>
                  <p>
                    {txt("faq.a5Antes")}{" "}
                    <Link href={WEB.appEmpresas}>{txt("faq.a5Enlace")}</Link>
                    {txt("faq.a5Despues")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PaginaWeb>
  );
}
