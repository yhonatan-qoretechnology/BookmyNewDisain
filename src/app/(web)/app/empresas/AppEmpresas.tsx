"use client";
/* ============================================================
   La app vista por el NEGOCIO · /app/empresas
   ------------------------------------------------------------
   Paso a Next de app-empresas.html. Es la otra cara del mundo
   APP: en /app la app la usa quien reserva, y aquí la usa quien
   RECIBE las reservas. Secciones, en orden: héroe con el móvil
   del negocio, los cuatro pasos, el bento de ventajas, el puente
   al CRM, las preguntas y la llamada a la acción del pie.

   EL MARCADO ES EL DEL ORIGINAL, A PROPÓSITO
   Las clases y los atributos data-* (data-split, data-reveal,
   data-pointer, data-tilt) no son decorativos: de ellos vive el
   motor de animación (src/lib/web/motor.ts) y la hoja de estilos
   public/web/v2/bookmy.css, que se copió tal cual. Las variables
   en línea (--i, --k, --h) son el ritmo de esas animaciones, así
   que viajan igual que venían. Si algo de esto se cambia, la
   página no se rompe: se queda quieta, que es peor de detectar.

   El texto NO se escribe aquí: sale de los diccionarios
   appEmpresas.es.ts / appEmpresas.en.ts con w("appEmpresas.…").
   Lo que ya dice el armazón (cabecera, pie, descargas) se pide
   con w("comun.…") en vez de repetirlo.

   NO HAY NI UNA <img>: el móvil, la agenda, los avisos y el panel
   del CRM los dibuja el CSS. Por eso la pantalla pesa lo que pesa.
============================================================ */
import { Fragment, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import PaginaWeb from "@/components/web/PaginaWeb";
import { Tiendas } from "@/components/web/SiteFooter";
import { useWebT } from "@/components/web/useWebT";
import { WEB } from "@/lib/web/rutas";
import { DIAS_DE_PRUEBA, SE_OFRECE_PRUEBA } from "@/lib/web/oferta";
import { formatearDinero, pais, paisProbable } from "@/lib/web/money";

/** El retardo de una aparición, tal cual lo escribía el original. */
const ritmo = (i: number) => ({ "--i": i }) as CSSProperties;

/* La agenda del día dentro del móvil. El hueco libre y la reserva
   nueva se pintan distintos (is-free / is-new) y solo la nueva lleva
   etiqueta; las demás, el visto. Son seis porque en pantalla
   estrecha el CSS esconde la sexta (.bizapp__list li:nth-child(6)). */
const AGENDA = [
  { n: 1, clase: "", remate: "visto" },
  { n: 2, clase: "", remate: "visto" },
  { n: 3, clase: "is-free", remate: "" },
  { n: 4, clase: "is-new", remate: "etiqueta" },
  { n: 5, clase: "", remate: "visto" },
  { n: 6, clase: "", remate: "visto" },
] as const;

/** Los cuatro pasos, con el icono de icons.css de cada uno. */
const PASOS = [
  { n: 1, icono: "i-user-plus" },
  { n: 2, icono: "i-sliders" },
  { n: 3, icono: "i-map-pin" },
  { n: 4, icono: "i-bell" },
] as const;

/* Los avisos que se amontonan en la primera tarjeta del bento. El
   orden importa: el CSS los va desplazando y apagando de uno en uno
   (.em-notifs .toast:nth-child(n)). */
const AVISOS = [
  { n: 1, caja: "ib ib--solid", icono: "i-calendar-check" },
  { n: 2, caja: "ib ib--amber", icono: "i-refresh" },
  { n: 3, caja: "ib ib--rose", icono: "i-user-x" },
  { n: 4, caja: "ib ib--amber", icono: "i-star" },
] as const;

/** Los módulos del CRM, menos el asistente, que va aparte y resaltado. */
const MODULOS = [
  { clave: "modReservas", icono: "i-calendar" },
  { clave: "modClientes", icono: "i-users" },
  { clave: "modFacturacion", icono: "i-receipt" },
  { clave: "modEquipo", icono: "i-id-card" },
  { clave: "modInventario", icono: "i-package" },
  { clave: "modSedes", icono: "i-map-pin" },
  { clave: "modEstadisticas", icono: "i-bar-chart" },
] as const;

/** La altura de cada barra del gráfico, en el mismo orden del original. */
const BARRAS = [38, 52, 46, 70, 64, 88, 100];

/**
 * Los **tramos en negrita** del diccionario, como <b>. La nota del
 * puente al CRM resalta los nombres de los dos planes, y escribirlo
 * así deja la frase entera en una sola clave: traducirla en tres
 * trozos sueltos es lo que hace que un idioma acabe con el orden de
 * las palabras del otro. Es la misma notación con la que ya están
 * escritos los textos del asistente.
 */
function conNegritas(texto: string): ReactNode[] {
  return texto
    .split(/\*\*(.+?)\*\*/g)
    .map((tramo, i) => (i % 2 ? <b key={i}>{tramo}</b> : <Fragment key={i}>{tramo}</Fragment>));
}

/**
 * El importe de ejemplo de los dos avisos de cobro, en la moneda del
 * visitante. El original decía "33,00 €" a pelo; aquí sale de
 * money.ts, que es lo que hace que en Bogotá se lea en pesos y en
 * Lima en soles. Se usa el precio de ejemplo medio del país.
 *
 * El país se adivina en un efecto y no durante el render: en el
 * servidor no hay navegador, así que el primer HTML es siempre el de
 * España y se corrige al montar. Adivinarlo en el render dejaría el
 * HTML del servidor y el del cliente distintos.
 */
function useImporteEjemplo(): string {
  const [codigo, setCodigo] = useState("es");
  useEffect(() => setCodigo(paisProbable()), []);
  return formatearDinero(pais(codigo).chips[1], codigo);
}

/**
 * Los textos que el original remataba con "7 días gratis". Hoy la
 * prueba está apagada (oferta.ts), así que se enseña la versión
 * escrita sin ella; cuando se encienda, la otra. El número de días
 * nunca va escrito en el texto: entra como {dias}.
 */
function useTextoPrueba() {
  const { w } = useWebT();
  return (base: string) =>
    w(`appEmpresas.${base}${SE_OFRECE_PRUEBA ? "ConPrueba" : "SinPrueba"}`, { dias: DIAS_DE_PRUEBA });
}

/* ============================================================
   1 · Héroe: el móvil del negocio con la agenda del día
============================================================ */
function Hero() {
  const { w } = useWebT();
  const conPrueba = useTextoPrueba();
  const importe = useImporteEjemplo();

  return (
    <section className="ph-hero em-hero" data-pointer aria-labelledby="em-title">
      <div className="wrap ph-hero__grid">
        <div className="ph-hero__copy">
          <h1 className="h-hero ph-hero__title em-hero__title" id="em-title" data-split>
            {w("appEmpresas.heroTitulo")} <span className="mint">{w("appEmpresas.heroTituloMint")}</span>
          </h1>
          <p className="lead" data-reveal style={ritmo(4)}>{w("appEmpresas.heroLead")}</p>
          <div className="ph-hero__cta" data-reveal style={ritmo(5)}>
            <Link className="btn btn--primary btn--lg" href={WEB.crearCuenta}>
              {w("appEmpresas.ctaAlta")} <i className="i i-arrow-right" aria-hidden />
            </Link>
            <a className="btn btn--ghost btn--lg" href="#descargar">
              <i className="i i-download" aria-hidden />
              {w("comun.nav.descargarApp")}
            </a>
          </div>
          <p className="small muted" data-reveal style={ritmo(6)}>{conPrueba("heroPrueba")}</p>
        </div>

        <div className="ph-hero__stage" data-reveal="rise" style={ritmo(3)}>
          <div className="ap-hero__halo" aria-hidden />
          <div className="fr-rig em-rig">
            <div className="phone3d em-phone" role="img" aria-label={w("appEmpresas.movilAria")}>
              {/* El grosor del teléfono: seis capas apiladas en 3D. */}
              {[6, 5, 4, 3, 2, 1].map((k) => (
                <span key={k} className="phone3d__layer" style={{ "--k": k } as CSSProperties} />
              ))}
              <div className="phone3d__front"><div className="phone3d__screen bizapp" aria-hidden>
                <div className="bizapp__top">
                  <div>
                    <small>{w("appEmpresas.movilFecha")}</small>
                    <b>{w("appEmpresas.movilHoy")}</b>
                  </div>
                  <span className="av">{w("appEmpresas.movilIniciales")}</span>
                </div>
                <div className="bizapp__kpis">
                  <div><b>{w("appEmpresas.movilCitasValor")}</b><small>{w("appEmpresas.movilCitas")}</small></div>
                  <div><b>{w("appEmpresas.movilHuecosValor")}</b><small>{w("appEmpresas.movilHuecos")}</small></div>
                  <div><b>{w("appEmpresas.movilNotaValor")}</b><small>{w("appEmpresas.movilNota")}</small></div>
                </div>
                <ul className="bizapp__list">
                  {AGENDA.map(({ n, clase, remate }) => (
                    <li key={n} className={clase || undefined}>
                      <time>{w(`appEmpresas.agenda${n}Hora`)}</time>
                      <span>
                        <b>{w(`appEmpresas.agenda${n}Titulo`)}</b>
                        <small>{w(`appEmpresas.agenda${n}Sub`)}</small>
                      </span>
                      {remate === "visto" ? <i className="i i-check" /> : null}
                      {remate === "etiqueta" ? <span className="tag">{w("appEmpresas.agendaNueva")}</span> : null}
                    </li>
                  ))}
                </ul>
                <div className="bizapp__nav">
                  <i className="i i-calendar" />
                  <i className="i i-users" />
                  <i className="i i-bell" />
                  <i className="i i-bar-chart" />
                </div>
              </div></div>
              <span className="phone3d__island" aria-hidden />
              <span className="phone3d__shine" aria-hidden />
            </div>

            {/* Los tres avisos que flotan alrededor del teléfono. */}
            <div className="fr-chip toast em-chip em-chip--a" aria-hidden>
              <span className="ib ib--solid"><i className="i i-bell" /></span>
              <div><b>{w("appEmpresas.chip1Titulo")}</b>{w("appEmpresas.chip1Texto")}</div>
            </div>
            <div className="fr-chip toast em-chip em-chip--b" aria-hidden>
              <span className="ib ib--lime"><i className="i i-credit-card" /></span>
              <div><b>{w("appEmpresas.chip2Titulo")}</b>{w("appEmpresas.chip2Texto", { importe })}</div>
            </div>
            <div className="fr-chip toast em-chip em-chip--c" aria-hidden>
              <span className="ib ib--amber"><i className="i i-calendar-clock" /></span>
              <div><b>{w("appEmpresas.chip3Titulo")}</b>{w("appEmpresas.chip3Texto")}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   2 · De tu perfil a tu primera reserva, en cuatro pasos
============================================================ */
function Pasos() {
  const { w } = useWebT();
  const conPrueba = useTextoPrueba();

  return (
    <section className="sec em-steps-sec" id="pasos">
      <div className="wrap">
        <div className="sec-head sec-head--split">
          <h2 className="h-xl" data-split>
            {w("appEmpresas.pasosTitulo")} <span className="mint">{w("appEmpresas.pasosTituloMint")}</span>
          </h2>
          <p className="lead" data-reveal>{w("appEmpresas.pasosLead")}</p>
        </div>
        <ol className="em-steps">
          {PASOS.map(({ n, icono }) => (
            <li key={n} className="em-step" data-reveal style={n > 1 ? ritmo(n - 1) : undefined}>
              <span className="em-step__n" aria-hidden>{n}</span>
              <span className="feat__lens"><i className={`i ${icono}`} aria-hidden /></span>
              <h3 className="h-sm">{w(`appEmpresas.paso${n}Titulo`)}</h3>
              {/* El primer paso es el que hablaba de la prueba gratuita. */}
              <p>{n === 1 ? conPrueba("paso1") : w(`appEmpresas.paso${n}Texto`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ============================================================
   3 · Ventajas: el bento sin huecos
============================================================ */
function Ventajas() {
  const { w } = useWebT();
  const importe = useImporteEjemplo();

  return (
    <section className="sec">
      <div className="wrap">
        <div className="sec-head sec-head--split">
          <h2 className="h-xl" data-split>
            {w("appEmpresas.ventajasTitulo")} <span className="stroke">{w("appEmpresas.ventajasTituloStroke")}</span>
          </h2>
          <p className="lead" data-reveal>{w("appEmpresas.ventajasLead")}</p>
        </div>

        <div className="bento em-bento">
          {/* a · Avisos al instante */}
          <article className="bc bc--a" data-tilt data-reveal>
            <span className="glare" aria-hidden />
            <div className="bc__txt">
              <h3 className="h-md">{w("appEmpresas.avisosTitulo")}</h3>
              <p>{w("appEmpresas.avisosTexto")}</p>
            </div>
            <div className="bc__ui em-notifs" aria-hidden>
              {AVISOS.map(({ n, caja, icono }) => (
                <div key={n} className="toast">
                  <span className={caja}><i className={`i ${icono}`} /></span>
                  <div><b>{w(`appEmpresas.aviso${n}Titulo`)}</b>{w(`appEmpresas.aviso${n}Texto`)}</div>
                  <time>{w(`appEmpresas.aviso${n}Tiempo`)}</time>
                </div>
              ))}
            </div>
          </article>

          {/* b · Tu agenda en el bolsillo */}
          <article className="bc bc--b" data-tilt data-reveal style={ritmo(1)}>
            <span className="glare" aria-hidden />
            <div className="bc__txt">
              <h3 className="h-md">{w("appEmpresas.agendaTitulo")}</h3>
              <p>{w("appEmpresas.agendaTexto")}</p>
            </div>
            <div className="bc__ui frag" aria-hidden>
              <div className="week" style={{ "--cols": 3 } as CSSProperties}>
                <div className="week__row week__head">
                  <span />
                  <span>{w("appEmpresas.semanaDia1")}<b>{w("appEmpresas.semanaFecha1")}</b></span>
                  <span>{w("appEmpresas.semanaDia2")}<b>{w("appEmpresas.semanaFecha2")}</b></span>
                  <span>{w("appEmpresas.semanaDia3")}<b>{w("appEmpresas.semanaFecha3")}</b></span>
                </div>
                <div className="week__row">
                  <span className="week__t">{w("appEmpresas.semanaHoraA")}</span>
                  <span className="ev">{w("appEmpresas.semanaA1")}<small>{w("appEmpresas.semanaA1Sub")}</small></span>
                  <span className="ev ev--c">{w("appEmpresas.semanaA2")}<small>{w("appEmpresas.semanaA2Sub")}</small></span>
                  <span className="ev ev--free">{w("appEmpresas.semanaA3")}<small>{w("appEmpresas.semanaA3Sub")}</small></span>
                </div>
                <div className="week__row">
                  <span className="week__t">{w("appEmpresas.semanaHoraB")}</span>
                  <span className="ev ev--l">{w("appEmpresas.semanaB1")}<small>{w("appEmpresas.semanaB1Sub")}</small></span>
                  <span className="ev">{w("appEmpresas.semanaB2")}<small>{w("appEmpresas.semanaB2Sub")}</small></span>
                  <span className="ev ev--a">{w("appEmpresas.semanaB3")}<small>{w("appEmpresas.semanaB3Sub")}</small></span>
                </div>
              </div>
            </div>
          </article>

          {/* c · Cobros online */}
          <article className="bc bc--c" data-tilt data-reveal style={ritmo(2)}>
            <span className="glare" aria-hidden />
            <div className="bc__txt">
              <h3 className="h-sm">{w("appEmpresas.cobrosTitulo")}</h3>
              <p>{w("appEmpresas.cobrosTexto")}</p>
            </div>
            <div className="bc__ui" aria-hidden>
              <div className="toast">
                <span className="ib ib--lime"><i className="i i-credit-card" /></span>
                <div><b>{importe}</b>{w("appEmpresas.cobrosPagado")}</div>
              </div>
            </div>
          </article>

          {/* d · Menos ausencias */}
          <article className="bc bc--d" data-tilt data-reveal style={ritmo(3)}>
            <span className="glare" aria-hidden />
            <div className="bc__txt">
              <h3 className="h-sm">{w("appEmpresas.ausenciasTitulo")}</h3>
              <p>{w("appEmpresas.ausenciasTexto")}</p>
            </div>
            <div className="bc__ui" aria-hidden>
              <div className="toast">
                <span className="ib ib--amber"><i className="i i-bell" /></span>
                <div><b>{w("appEmpresas.ausenciasAvisoTitulo")}</b>{w("appEmpresas.ausenciasAvisoTexto")}</div>
              </div>
            </div>
          </article>

          {/* e · Clientes que vuelven */}
          <article className="bc bc--e" data-tilt data-reveal style={ritmo(1)}>
            <span className="glare" aria-hidden />
            <div className="bc__txt">
              <h3 className="h-md">{w("appEmpresas.clientesTitulo")}</h3>
              <p>{w("appEmpresas.clientesTexto")}</p>
            </div>
            <div className="bc__ui bc__ui--split" aria-hidden>
              <div className="frag client">
                <div className="client__top">
                  <span className="av av--lg">{w("appEmpresas.clienteIniciales")}</span>
                  <div>
                    <b>{w("appEmpresas.clienteNombre")}</b>
                    <small>{w("appEmpresas.clienteDesde")}</small>
                  </div>
                  <span className="tag">{w("appEmpresas.clienteTag")}</span>
                </div>
                <div className="client__stats">
                  <div><b>{w("appEmpresas.clienteVisitasValor")}</b><small>{w("appEmpresas.clienteVisitas")}</small></div>
                  <div><b>{w("appEmpresas.clienteFrecuenciaValor")}</b><small>{w("appEmpresas.clienteFrecuencia")}</small></div>
                  <div><b>{w("appEmpresas.clientePrefiereValor")}</b><small>{w("appEmpresas.clientePrefiere")}</small></div>
                </div>
              </div>
              <div className="frag em-review">
                <div className="em-review__stars">
                  {[1, 2, 3, 4, 5].map((e) => <i key={e} className="i i-star" />)}
                </div>
                <p>{w("appEmpresas.resena")}</p>
                <small>{w("appEmpresas.resenaPie")}</small>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   4 · Puente al CRM: la app es el escaparate, el CRM el mando
============================================================ */
function PuenteCrm() {
  const { w } = useWebT();
  const conPrueba = useTextoPrueba();

  return (
    <section className="sec em-crm">
      <div className="wrap em-crm__grid">
        <div className="em-crm__copy">
          <h2 className="h-lg" data-split>
            {w("appEmpresas.crmTitulo")} <span className="mint t-crm">{w("appEmpresas.crmTituloMint")}</span>
          </h2>
          <p className="lead" data-reveal>{w("appEmpresas.crmLead")}</p>
          <p className="em-crm__note" data-reveal>
            <i className="i i-info" aria-hidden />
            <span>{conNegritas(conPrueba("crmNota"))}</span>
          </p>
          <div className="em-crm__cta t-crm" data-reveal>
            <Link className="btn btn--primary btn--lg" href={WEB.crm}>
              {w("comun.pie.negocioCta")} <i className="i i-arrow-right" aria-hidden />
            </Link>
            <Link className="btn btn--ghost btn--lg" href={WEB.planes}>{w("appEmpresas.ctaVerPlanes")}</Link>
          </div>
        </div>

        <div className="em-crm__panel t-crm" data-tilt data-reveal="rise" aria-hidden>
          <span className="glare" />
          <div className="em-crm__head">
            {/* El logo del CRM, en lima. Aquí no es un enlace (va dentro de
                un bloque aria-hidden), así que no se usa <Marca>. */}
            <span className="brand brand--crm">
              <span className="brand__logo">
                <span className="brand__logo-g" />
                <span className="brand__logo-k" />
              </span>
            </span>
            <span className="live">{w("appEmpresas.crmSincronizado")}</span>
          </div>
          <ul className="em-crm__mods">
            {MODULOS.map(({ clave, icono }) => (
              <li key={clave}><i className={`i ${icono}`} />{w(`appEmpresas.${clave}`)}</li>
            ))}
            <li className="is-ai"><i className="i i-sparkles" />{w("comun.nav.asistenteIa")}</li>
          </ul>
          <div className="em-crm__chart">
            <div className="bars" style={{ height: "110px" }}>
              {BARRAS.map((h, i) => (
                <i key={i} style={{ "--h": `${h}%`, "--i": i } as CSSProperties} />
              ))}
            </div>
            <p><b>{w("appEmpresas.crmSubida")}</b> {w("appEmpresas.crmSubidaTexto")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   5 · Lo que nos preguntan los negocios
   El despliegue lo lleva el motor a través de .faq / .faq__q /
   .faq__a, igual que en la web estática: aquí solo va el marcado.
============================================================ */
function Preguntas() {
  const { w } = useWebT();
  const conPrueba = useTextoPrueba();

  return (
    <section className="sec cx-faq" id="faq">
      <div className="wrap cx-faq__grid">
        <div className="cx-faq__head">
          <h2 className="h-xl" data-split>{w("appEmpresas.faqTitulo")}</h2>
          <p className="lead" data-reveal>
            {w("appEmpresas.faqDuda")}{" "}
            <button
              className="link-arrow"
              type="button"
              data-assistant-ask={w("appEmpresas.faqAsistentePregunta")}
            >
              {w("appEmpresas.faqAsistente")} <i className="i i-arrow-right" aria-hidden />
            </button>
          </p>
        </div>
        <div className="faq" data-reveal>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="faq__item">
              <button className="faq__q" type="button">{w(`appEmpresas.faq${n}P`)}</button>
              <div className="faq__a"><div>
                <p>
                  {/* El precio y la agenda de la competencia son las dos
                      respuestas que prometían la prueba gratuita. */}
                  {n === 2 || n === 6 ? conPrueba(`faq${n}R`) : w(`appEmpresas.faq${n}R`)}
                  {n === 2 ? (
                    <>
                      {" "}
                      <Link href={WEB.planes}>{w("appEmpresas.ctaVerPlanes")}</Link>
                      {"."}
                    </>
                  ) : null}
                </p>
              </div></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   6 · La llamada a la acción que corona el pie
   Lleva el id #descargar, que es donde apuntan el botón
   "Descargar" de la cabecera y el del héroe.
============================================================ */
function CtaDescargar() {
  const { w } = useWebT();
  const conPrueba = useTextoPrueba();

  return (
    <section className="f-cta" id="descargar" aria-labelledby="f-cta-title">
      <div className="wrap">
        <h2 className="f-cta__title" id="f-cta-title" data-split>
          {w("appEmpresas.ctaTitulo")} <em>{w("appEmpresas.ctaTituloEm")}</em>
        </h2>
        <p className="lead" data-reveal>{conPrueba("ctaLead")}</p>
        <div className="f-cta__actions" data-reveal style={ritmo(1)}>
          <div className="f-cta__row">
            <Link className="btn btn--primary btn--lg" href={WEB.crearCuenta}>
              {w("appEmpresas.ctaAlta")} <i className="i i-arrow-right" aria-hidden />
            </Link>
            <Link className="btn btn--ghost btn--lg" href={WEB.crm}>{w("appEmpresas.ctaCrm")}</Link>
          </div>
          <Tiendas centradas />
        </div>
      </div>
    </section>
  );
}

export default function AppEmpresas() {
  return (
    <PaginaWeb mundo="app" pagina="app-empresas" cta={<CtaDescargar />}>
      <Hero />
      <Pasos />
      <Ventajas />
      <PuenteCrm />
      <Preguntas />
    </PaginaWeb>
  );
}
