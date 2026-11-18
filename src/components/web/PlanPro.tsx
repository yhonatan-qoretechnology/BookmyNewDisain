"use client";
/* ============================================================
   Plan Pro (/planes/pro)
   ------------------------------------------------------------
   Paso a Next de plan-pro.html de la web nueva. Mismas clases,
   mismos atributos data-* y mismas variables en línea (--i, --k,
   --acc…): de ellos viven el CSS y el motor de animación
   (src/lib/web/motor.ts), así que son parte del diseño y no un
   adorno que se pueda limpiar.

   Esta pantalla vivía en /bookmy-crm-pro y ahora es /planes/pro;
   la dirección antigua la redirige next.config.mjs.

   TRES COSAS QUE NO SON UNA COPIA LITERAL DEL HTML
   1. La promesa de la prueba. El original decía «7 días gratis»
      en el héroe, en la calculadora, en dos preguntas y en la
      llamada final. Hoy la prueba está apagada (oferta.ts), así
      que cada uno de esos textos tiene dos versiones en el
      diccionario y `promesa()` elige la que toca. El número de
      días nunca va escrito: viaja como {dias}.
   2. El desplegable de países de la calculadora. El original
      traía un solo <option> (España) y su money.js metía el resto
      al arrancar. Aquí salen los veintitrés de money.ts ya desde
      el servidor —con la misma etiqueta que escribe el motor—, así
      que la calculadora también se entiende sin JavaScript y no
      hay salto al hidratar. El motor lo rehace igual y ordena los
      topes del precio medio según el país.
   3. El precio medio de partida (mínimo, máximo, paso y valor) es
      el de España según money.ts, que es justo lo que llevaba el
      original escrito a mano.

   Los importes en euros de las tarjetas (33, 45, 40 €) y los 8 €
   de la parafina son ejemplos de lo que un negocio cobra a SUS
   clientes y se quedan tal cual, en el diccionario.
============================================================ */
import Link from "next/link";
import type { CSSProperties } from "react";
import PaginaWeb from "./PaginaWeb";
import { useWebT } from "./useWebT";
import { FUERA, WEB } from "@/lib/web/rutas";
import { DIAS_DE_PRUEBA, SE_OFRECE_PRUEBA } from "@/lib/web/oferta";
import { PAISES, pais, type PaisMoneda } from "@/lib/web/money";

/** El correo del equipo, que sale en la última pregunta. */
const CORREO = "contacto@bookmy.es";

/* El alta llega con el plan ya elegido, como en el original. */
const ALTA_PRO = `${WEB.crearCuenta}?plan=pro`;

/* Los ocho módulos que giran alrededor de la escultura del héroe,
   en el orden del original: el ángulo de cada uno es su --k. */
const ORBITA = [
  ["crm", "users"],
  ["facturacion", "receipt"],
  ["reservas", "calendar"],
  ["equipo", "id-card"],
  ["asistente", "sparkles"],
  ["sedes", "map-pin"],
  ["estadisticas", "bar-chart"],
  ["inventario", "package"],
] as const;

/* Las cuatro barras del cuadro de estadísticas: altura y turno. */
const BARRAS = ["52%", "68%", "61%", "90%"] as const;

/** España manda en los valores de partida de la calculadora. */
const ESPANA = pais("es");
const [TICKET_MIN, TICKET_MAX, TICKET_PASO, TICKET_INICIAL] = ESPANA.range;

/* La etiqueta de cada país con el mismo formato que usa el motor al
   rehacer el desplegable ("España · euros"); los dos países
   genéricos ya llevan la moneda en el nombre. */
const etiquetaPais = (c: PaisMoneda): string =>
  c.code === "eu" || c.code === "usd" ? c.name : `${c.name} · ${c.curName}`;

export default function PlanPro() {
  const { w } = useWebT();

  /* La promesa de la prueba: el mismo texto está escrito dos veces en
     el diccionario (…ConPrueba y …SinPrueba) y aquí se elige cuál se
     enseña. Hoy, con SE_OFRECE_PRUEBA en false, la de sin prueba. */
  const promesa = (clave: string): string =>
    w(`${clave}${SE_OFRECE_PRUEBA ? "ConPrueba" : "SinPrueba"}`, { dias: DIAS_DE_PRUEBA });

  /* ── La llamada a la acción que corona el pie ──────────────── */
  const cta = (
    <section className="f-cta" aria-labelledby="f-cta-title">
      <div className="wrap">
        <h2 className="f-cta__title" id="f-cta-title" data-split>
          {promesa("planPro.cierre.titulo")}
          <em>{w("planPro.cierre.tituloDestacado")}</em>
        </h2>
        <p className="lead" data-reveal>{promesa("planPro.cierre.lead")}</p>
        <div className="f-cta__actions" data-reveal style={{ "--i": 1 } as CSSProperties}>
          <Link className="btn btn--primary btn--lg" href={ALTA_PRO}>
            {promesa("planPro.cta.probar")} <i className="i i-arrow-right" aria-hidden />
          </Link>
          <button
            className="btn btn--ghost btn--lg"
            type="button"
            data-assistant-ask={w("planPro.cta.ventasPregunta")}
          >
            {w("planPro.cta.ventas")}
          </button>
        </div>
      </div>
    </section>
  );

  return (
    <PaginaWeb mundo="crm" pagina="plan-pro" cta={cta}>
      {/* ── Héroe: barras de partículas con los módulos en órbita ── */}
      <section className="ph-hero" aria-labelledby="pro-title">
        <div className="wrap ph-hero__grid">
          <div className="ph-hero__copy">
            <Link className="ph-hero__back" href={WEB.planes} data-reveal>
              <i className="i i-arrow-right flip" aria-hidden />
              {w("planPro.hero.volver")}
            </Link>
            <h1 className="h-hero ph-hero__title" id="pro-title" data-split>
              {w("planPro.hero.titulo")}
              <span className="mint">{w("planPro.hero.tituloDestacado")}</span>
            </h1>
            <p className="lead" data-reveal style={{ "--i": 4 } as CSSProperties}>
              {w("planPro.hero.lead")}
            </p>
            <p className="ph-price" data-reveal style={{ "--i": 5 } as CSSProperties}>
              <b>{promesa("planPro.hero.precio")}</b>
              <span>{promesa("planPro.hero.precioNota")}</span>
            </p>
            <div className="ph-hero__cta" data-reveal style={{ "--i": 6 } as CSSProperties}>
              <Link className="btn btn--primary btn--lg" href={ALTA_PRO}>
                {promesa("planPro.cta.probar")} <i className="i i-arrow-right" aria-hidden />
              </Link>
              <button
                className="btn btn--ghost btn--lg"
                type="button"
                data-assistant-ask={w("planPro.cta.ventasPregunta")}
              >
                {w("planPro.cta.ventas")}
              </button>
            </div>
            <p className="small muted" data-reveal style={{ "--i": 7 } as CSSProperties}>
              {w("planPro.hero.nota")}
            </p>
          </div>

          <div className="ph-hero__stage" aria-hidden>
            <div className="pro-stage">
              <canvas
                data-sculpture="bars"
                data-size="1.5"
                data-spin=".35"
                data-swing=".5"
                data-tilt=".22"
                data-extent="1.32"
              />
              <div className="ring3d" style={{ "--r": "250px" } as CSSProperties}>
                <div className="ring3d__orbit">
                  {ORBITA.map(([clave, icono], i) => (
                    <div className="ring3d__arm" key={clave} style={{ "--k": i } as CSSProperties}>
                      <div className="ring3d__face">
                        <div className="ring3d__chip">
                          <span>
                            <i className={`i i-${icono}`} aria-hidden />
                            {w(`planPro.hero.orbita.${clave}`)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Módulos: galería horizontal fijada ─────────────────── */}
      <section className="hs" data-scene="hscroll" aria-labelledby="pro-mods">
        <div className="hs__stick">
          <div className="wrap hs__head">
            <h2 className="h-xl" id="pro-mods" data-split>{w("planPro.modulos.titulo")}</h2>
            <p className="lead" data-reveal>{w("planPro.modulos.lead")}</p>
          </div>

          <div className="hs__track">
            {/* Reservas */}
            <article className="hs__card" style={{ "--acc": "var(--mint-rgb)" } as CSSProperties}>
              <h3 className="h-md">{w("planPro.modulos.reservas.titulo")}</h3>
              <p>{w("planPro.modulos.reservas.texto")}</p>
              <div className="frag" aria-hidden>
                <div className="week" style={{ "--cols": 3 } as CSSProperties}>
                  <div className="week__row week__head">
                    <span />
                    <span>{w("planPro.modulos.reservas.d1")}<b>{w("planPro.modulos.reservas.d1Numero")}</b></span>
                    <span>{w("planPro.modulos.reservas.d2")}<b>{w("planPro.modulos.reservas.d2Numero")}</b></span>
                    <span>{w("planPro.modulos.reservas.d3")}<b>{w("planPro.modulos.reservas.d3Numero")}</b></span>
                  </div>
                  <div className="week__row">
                    <span className="week__t">{w("planPro.modulos.reservas.h1")}</span>
                    <span className="ev">{w("planPro.modulos.reservas.ev1")}<small>{w("planPro.modulos.reservas.ev1Quien")}</small></span>
                    <span className="ev ev--c">{w("planPro.modulos.reservas.ev2")}<small>{w("planPro.modulos.reservas.ev2Quien")}</small></span>
                    <span className="ev ev--l">{w("planPro.modulos.reservas.ev3")}<small>{w("planPro.modulos.reservas.ev3Quien")}</small></span>
                  </div>
                  <div className="week__row">
                    <span className="week__t">{w("planPro.modulos.reservas.h2")}</span>
                    <span className="ev ev--a">{w("planPro.modulos.reservas.ev4")}<small>{w("planPro.modulos.reservas.ev4Quien")}</small></span>
                    <span className="ev">{w("planPro.modulos.reservas.ev5")}<small>{w("planPro.modulos.reservas.ev5Quien")}</small></span>
                    <span className="ev ev--c">{w("planPro.modulos.reservas.ev6")}<small>{w("planPro.modulos.reservas.ev6Quien")}</small></span>
                  </div>
                  <div className="week__row">
                    <span className="week__t">{w("planPro.modulos.reservas.h3")}</span>
                    <span className="ev ev--c">{w("planPro.modulos.reservas.ev7")}<small>{w("planPro.modulos.reservas.ev7Quien")}</small></span>
                    <span className="ev ev--free">{w("planPro.modulos.reservas.ev8")}<small>{w("planPro.modulos.reservas.ev8Quien")}</small></span>
                    <span className="ev ev--l">{w("planPro.modulos.reservas.ev9")}<small>{w("planPro.modulos.reservas.ev9Quien")}</small></span>
                  </div>
                </div>
              </div>
            </article>

            {/* CRM de clientes */}
            <article className="hs__card" style={{ "--acc": "79,212,230" } as CSSProperties}>
              <h3 className="h-md">{w("planPro.modulos.crm.titulo")}</h3>
              <p>{w("planPro.modulos.crm.texto")}</p>
              <div className="frag client" aria-hidden>
                <div className="client__top">
                  <span className="av av--lg">{w("planPro.modulos.crm.iniciales")}</span>
                  <div>
                    <b>{w("planPro.modulos.crm.nombre")}</b>
                    <small>{w("planPro.modulos.crm.desde")}</small>
                  </div>
                  <span className="tag">{w("planPro.modulos.crm.etiqueta")}</span>
                </div>
                <div className="client__stats">
                  <div><b>{w("planPro.modulos.crm.visitas")}</b><small>{w("planPro.modulos.crm.visitasNota")}</small></div>
                  <div><b>{w("planPro.modulos.crm.consumo")}</b><small>{w("planPro.modulos.crm.consumoNota")}</small></div>
                  <div><b>{w("planPro.modulos.crm.frecuencia")}</b><small>{w("planPro.modulos.crm.frecuenciaNota")}</small></div>
                </div>
              </div>
            </article>

            {/* Facturación y pagos */}
            <article className="hs__card" style={{ "--acc": "var(--lime-rgb)" } as CSSProperties}>
              <h3 className="h-md">{w("planPro.modulos.facturacion.titulo")}</h3>
              <p>{w("planPro.modulos.facturacion.texto")}</p>
              <div className="frag inv" aria-hidden>
                <div className="inv__row">
                  <span>{w("planPro.modulos.facturacion.cliente1")}</span>
                  <b>{w("planPro.modulos.facturacion.importe1")}</b>
                  <span className="tag">{w("planPro.modulos.facturacion.canal1")}</span>
                </div>
                <div className="inv__row">
                  <span>{w("planPro.modulos.facturacion.cliente2")}</span>
                  <b>{w("planPro.modulos.facturacion.importe2")}</b>
                  <span className="tag tag--lime">{w("planPro.modulos.facturacion.canal2")}</span>
                </div>
                <div className="inv__row">
                  <span>{w("planPro.modulos.facturacion.cliente3")}</span>
                  <b>{w("planPro.modulos.facturacion.importe3")}</b>
                  <span className="tag">{w("planPro.modulos.facturacion.canal3")}</span>
                </div>
              </div>
            </article>

            {/* Estadísticas en tiempo real */}
            <article className="hs__card" style={{ "--acc": "255,191,87" } as CSSProperties}>
              <h3 className="h-md">{w("planPro.modulos.estadisticas.titulo")}</h3>
              <p>{w("planPro.modulos.estadisticas.texto")}</p>
              <div className="frag" aria-hidden>
                <div className="stats-row">
                  <div className="ring" style={{ "--v": 78 } as CSSProperties}>
                    <b>
                      {w("planPro.modulos.estadisticas.ocupacion")}
                      <small>{w("planPro.modulos.estadisticas.ocupacionNota")}</small>
                    </b>
                  </div>
                  <div className="stats-row__chart">
                    <div className="bars" style={{ height: 100 }}>
                      {BARRAS.map((alto, i) => (
                        <i key={alto} style={{ "--h": alto, "--i": i } as CSSProperties} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </article>

            {/* Administración de trabajadores */}
            <article className="hs__card" style={{ "--acc": "var(--mint-rgb)" } as CSSProperties}>
              <h3 className="h-md">{w("planPro.modulos.equipo.titulo")}</h3>
              <p>{w("planPro.modulos.equipo.texto")}</p>
              <div className="frag" aria-hidden>
                <div className="team">
                  <span>
                    <span className="av">{w("planPro.modulos.equipo.iniciales1")}</span>
                    {w("planPro.modulos.equipo.nombre1")} <small>{w("planPro.modulos.equipo.area1")}</small>
                  </span>
                  <span>
                    <span className="av av--2">{w("planPro.modulos.equipo.iniciales2")}</span>
                    {w("planPro.modulos.equipo.nombre2")} <small>{w("planPro.modulos.equipo.area2")}</small>
                  </span>
                  <span>
                    <span className="av av--3">{w("planPro.modulos.equipo.iniciales3")}</span>
                    {w("planPro.modulos.equipo.nombre3")} <small>{w("planPro.modulos.equipo.area3")}</small>
                  </span>
                </div>
              </div>
            </article>

            {/* Múltiples sucursales */}
            <article className="hs__card" style={{ "--acc": "79,212,230" } as CSSProperties}>
              <h3 className="h-md">{w("planPro.modulos.sedes.titulo")}</h3>
              <p>{w("planPro.modulos.sedes.texto")}</p>
              <div className="frag" aria-hidden>
                <ul className="sedes">
                  <li className="is-on">
                    <i className="i i-map-pin" aria-hidden />
                    <b>{w("planPro.modulos.sedes.sede1")}</b>
                    <small>{w("planPro.modulos.sedes.estado1")}</small>
                  </li>
                  <li>
                    <i className="i i-map-pin" aria-hidden />
                    <b>{w("planPro.modulos.sedes.sede2")}</b>
                    <small>{w("planPro.modulos.sedes.estado2")}</small>
                  </li>
                  <li>
                    <i className="i i-map-pin" aria-hidden />
                    <b>{w("planPro.modulos.sedes.sede3")}</b>
                    <small>{w("planPro.modulos.sedes.estado3")}</small>
                  </li>
                </ul>
              </div>
            </article>

            {/* Control de inventario */}
            <article className="hs__card" style={{ "--acc": "255,122,147" } as CSSProperties}>
              <h3 className="h-md">{w("planPro.modulos.inventario.titulo")}</h3>
              <p>{w("planPro.modulos.inventario.texto")}</p>
              <div className="frag" aria-hidden>
                <ul className="stock">
                  <li>
                    <span>{w("planPro.modulos.inventario.producto1")}</span>
                    <div className="meter-bar" style={{ "--v": "72%" } as CSSProperties}><span /></div>
                  </li>
                  <li className="is-low">
                    <span>{w("planPro.modulos.inventario.producto2")}</span>
                    <div className="meter-bar" style={{ "--v": "18%" } as CSSProperties}><span /></div>
                  </li>
                  <li>
                    <span>{w("planPro.modulos.inventario.producto3")}</span>
                    <div className="meter-bar" style={{ "--v": "54%" } as CSSProperties}><span /></div>
                  </li>
                </ul>
              </div>
            </article>
          </div>

          <div className="hs__bar" aria-hidden><span /></div>
        </div>
      </section>

      {/* ── El asistente IA, contado desde el Plan Pro ─────────── */}
      <section className="sec">
        <div className="wrap">
          <div className="pro-ai" data-reveal>
            <div className="pro-ai__copy">
              <span className="tag tag--lime">{w("planPro.asistente.etiqueta")}</span>
              <h2 className="h-lg" data-split>{w("planPro.asistente.titulo")}</h2>
              <p className="lead">{w("planPro.asistente.lead")}</p>
              <Link className="btn btn--primary btn--lg" href={WEB.asistenteIa}>
                {w("planPro.asistente.cta")} <i className="i i-arrow-right" aria-hidden />
              </Link>
            </div>
            <div className="mini-chat" data-tilt aria-label={w("planPro.asistente.chatAria")}>
              <p className="bubble">{w("planPro.asistente.burbuja1")}</p>
              <p className="bubble bubble--out">
                {w("planPro.asistente.burbuja2")}
                <span className="bubble__note">
                  <i className="i i-sparkles" aria-hidden />
                  {w("planPro.asistente.burbuja2Nota")}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pensado para ───────────────────────────────────────── */}
      <section className="sec">
        <div className="wrap">
          <div className="sec-head">
            <h2 className="h-xl" data-split>{w("planPro.publico.titulo")}</h2>
          </div>
          <div className="aud">
            <article className="aud__card" data-tilt data-reveal>
              <span className="glare" aria-hidden />
              <span className="feat__lens"><i className="i i-users" aria-hidden /></span>
              <h3 className="h-md">{w("planPro.publico.titulo1")}</h3>
              <p>{w("planPro.publico.texto1")}</p>
            </article>
            <article className="aud__card" data-tilt data-reveal style={{ "--i": 1 } as CSSProperties}>
              <span className="glare" aria-hidden />
              <span className="feat__lens"><i className="i i-building" aria-hidden /></span>
              <h3 className="h-md">{w("planPro.publico.titulo2")}</h3>
              <p>{w("planPro.publico.texto2")}</p>
            </article>
            <article className="aud__card" data-tilt data-reveal style={{ "--i": 2 } as CSSProperties}>
              <span className="glare" aria-hidden />
              <span className="feat__lens"><i className="i i-trending-up" aria-hidden /></span>
              <h3 className="h-md">{w("planPro.publico.titulo3")}</h3>
              <p>{w("planPro.publico.texto3")}</p>
            </article>
          </div>
        </div>
      </section>

      {/* ── Calculadora de lo que se pierde por ausencias ──────── */}
      <section className="sec" id="calculadora">
        <div className="wrap">
          <div className="sec-head sec-head--split">
            <h2 className="h-lg" data-split>{w("planPro.roi.titulo")}</h2>
            <p className="lead" data-reveal>{w("planPro.roi.lead")}</p>
          </div>

          <div className="roi" data-roi data-reveal="scale" role="group" aria-label={w("planPro.roi.grupoAria")}>
            <div className="roi__form">
              <div className="field field--select">
                <div className="field__top">
                  <label htmlFor="roi-pais">{w("planPro.roi.pais")}</label>
                  <output data-out="moneda" htmlFor="roi-pais">{ESPANA.cur}</output>
                </div>
                <select
                  className="input select"
                  id="roi-pais"
                  name="pais"
                  data-money-select
                  defaultValue={ESPANA.code}
                >
                  {PAISES.map((c) => (
                    <option key={c.code} value={c.code}>{etiquetaPais(c)}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <div className="field__top">
                  <label htmlFor="roi-citas">{w("planPro.roi.citas")}</label>
                  <output data-out="citas" htmlFor="roi-citas">{w("planPro.roi.citasInicial")}</output>
                </div>
                <input type="range" id="roi-citas" name="citas" min={10} max={400} step={5} defaultValue={80} />
              </div>

              <div className="field">
                <div className="field__top">
                  <label htmlFor="roi-ticket">{w("planPro.roi.ticket")}</label>
                  <output data-out="ticket" htmlFor="roi-ticket">{w("planPro.roi.ticketInicial")}</output>
                </div>
                <input
                  type="range"
                  id="roi-ticket"
                  name="ticket"
                  min={TICKET_MIN}
                  max={TICKET_MAX}
                  step={TICKET_PASO}
                  defaultValue={TICKET_INICIAL}
                  data-money
                />
              </div>

              <div className="field">
                <div className="field__top">
                  <label htmlFor="roi-aus">{w("planPro.roi.ausencias")}</label>
                  <output data-out="ausencias" htmlFor="roi-aus">{w("planPro.roi.ausenciasInicial")}</output>
                </div>
                <input
                  type="range"
                  id="roi-aus"
                  name="ausencias"
                  min={1}
                  max={30}
                  step={1}
                  defaultValue={8}
                  data-unit={w("planPro.roi.unidadPorcentaje")}
                />
              </div>

              <div className="field">
                <div className="field__top">
                  <label htmlFor="roi-rec">{w("planPro.roi.recupera")}</label>
                  <output data-out="recupera" htmlFor="roi-rec">{w("planPro.roi.recuperaInicial")}</output>
                </div>
                <input
                  type="range"
                  id="roi-rec"
                  name="recupera"
                  min={10}
                  max={70}
                  step={5}
                  defaultValue={35}
                  data-unit={w("planPro.roi.unidadPorcentaje")}
                />
                <small>{w("planPro.roi.recuperaNota")}</small>
              </div>
            </div>

            <div className="roi__viz" aria-hidden>
              <div className="roi__bars">
                <div className="col3d col3d--lost">
                  <span className="col3d__left" />
                  <span className="col3d__right" />
                  <span className="col3d__front" />
                  <span className="col3d__top" />
                </div>
                <div className="col3d col3d--back">
                  <span className="col3d__left" />
                  <span className="col3d__right" />
                  <span className="col3d__front" />
                  <span className="col3d__top" />
                </div>
              </div>
              <div className="roi__labels">
                <span>{w("planPro.roi.columnaPierdes")}</span>
                <span>{w("planPro.roi.columnaRecuperas")}</span>
              </div>
            </div>

            <div className="roi__result" aria-live="polite">
              <h3>{w("planPro.roi.resultadoPierdes")}</h3>
              <div className="roi__big" data-res="perdida">{w("planPro.roi.importeInicial")}</div>
              <h3>{w("planPro.roi.resultadoRecuperas")}</h3>
              <div className="roi__big roi__big--mint" data-res="recupera">{w("planPro.roi.importeInicial")}</div>
              <p>
                {w("planPro.roi.alMes")}
                <b data-res="anual">{w("planPro.roi.importeInicial")}</b>
                {w("planPro.roi.alAnio")}
              </p>
              <small>{w("planPro.roi.nota")}</small>
              <div className="roi__cta">
                <Link className="btn btn--primary" href={ALTA_PRO}>{promesa("planPro.cta.probar")}</Link>
                <button
                  className="btn btn--ghost"
                  type="button"
                  data-assistant-flow="roi"
                  data-assistant-label={w("planPro.roi.asistenteEtiqueta")}
                >
                  {w("planPro.roi.asistente")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonio ─────────────────────────────────────────── */}
      <section className="sec sec--tight">
        <div className="wrap">
          <figure className="bigquote" data-reveal>
            <i className="i i-quote" aria-hidden />
            <blockquote>{w("planPro.testimonio.cita")}</blockquote>
            <figcaption>
              <span className="av av--2 av--lg" aria-hidden>{w("planPro.testimonio.iniciales")}</span>
              <span>
                <b>{w("planPro.testimonio.autor")}</b>
                <span>{w("planPro.testimonio.papel")}</span>
              </span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── Preguntas ──────────────────────────────────────────── */}
      <section className="sec cx-faq" id="faq">
        <div className="wrap cx-faq__grid">
          <div className="cx-faq__head">
            <h2 className="h-xl" data-split>{promesa("planPro.faq.titulo")}</h2>
          </div>

          {/* El acordeón lo abre el motor: aquí va el marcado y los
              aria los pone él al engancharse, como en el original. */}
          <div className="faq" data-reveal>
            <div className="faq__item">
              <button className="faq__q" type="button">{promesa("planPro.faq.q1")}</button>
              <div className="faq__a"><div><p>{promesa("planPro.faq.a1")}</p></div></div>
            </div>
            <div className="faq__item">
              <button className="faq__q" type="button">{promesa("planPro.faq.q2")}</button>
              <div className="faq__a"><div><p>{promesa("planPro.faq.a2")}</p></div></div>
            </div>
            <div className="faq__item">
              <button className="faq__q" type="button">{w("planPro.faq.q3")}</button>
              <div className="faq__a"><div><p>
                {promesa("planPro.faq.a3")}{" "}
                <button className="link-arrow" type="button" data-assistant-ask={w("planPro.faq.a3Pregunta")}>
                  {w("planPro.faq.a3Boton")} <i className="i i-arrow-right" aria-hidden />
                </button>
              </p></div></div>
            </div>
            <div className="faq__item">
              <button className="faq__q" type="button">{w("planPro.faq.q4")}</button>
              <div className="faq__a"><div><p>{w("planPro.faq.a4")}</p></div></div>
            </div>
            <div className="faq__item">
              <button className="faq__q" type="button">{w("planPro.faq.q5")}</button>
              <div className="faq__a"><div><p>
                {w("planPro.faq.a5Inicio")}
                <a href={`mailto:${CORREO}`}>{w("planPro.faq.a5Correo")}</a>
                {w("planPro.faq.a5Medio")}
                <a href={FUERA.whatsapp} target="_blank" rel="noopener">{w("planPro.faq.a5Whatsapp")}</a>
                {w("planPro.faq.a5Fin")}
              </p></div></div>
            </div>
          </div>
        </div>
      </section>
    </PaginaWeb>
  );
}
