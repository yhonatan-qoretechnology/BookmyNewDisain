"use client";
/* ============================================================
   /planes — Plan Basic frente a Plan Pro, con calculadora
   ------------------------------------------------------------
   Es planes.html del rediseño pasado a React. El marcado es el
   mismo, clase por clase y atributo por atributo, porque de los
   data-* vive el motor de animación (src/lib/web/motor.ts): los
   data-reveal, el data-split de los titulares, el data-pointer que
   inclina las dos tarjetas, el data-tilt de cada una, el .faq y,
   sobre todo, el data-roi de la calculadora.

   LA CALCULADORA NO SE PROGRAMA AQUÍ
   Este componente solo pone los mandos y los huecos. Quien calcula
   es el motor, que además rellena el desplegable con los 23 países
   de src/lib/web/money.ts y pasa todos los importes por la moneda
   del que se elija. Por eso el <select> trae un solo <option>: es
   lo que se ve si el JavaScript no llega, y el motor lo sustituye.
   Los números que se enseñan de salida son el molde de antes de
   arrancar; en cuanto arranca, los escribe él.

   EL TEXTO, NI UNA PALABRA AQUÍ
   Todo sale de src/i18n/dictionaries/web/planes.es.ts y .en.ts,
   salvo lo del armazón (el nombre de los planes, «Más popular»,
   «Nuevo»), que es de comun.* para que se llame igual en toda la
   web.

   LA PRUEBA GRATUITA
   El original prometía «7 días gratis» por toda la página. Hoy la
   prueba está apagada (src/lib/web/oferta.ts), así que cada uno de
   esos textos tiene dos versiones en el diccionario y aquí se
   elige con `claveOferta()`. El número de días nunca se escribe:
   viaja como {dias}.
============================================================ */
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import PaginaWeb from "@/components/web/PaginaWeb";
import { useWebT } from "@/components/web/useWebT";
import { WEB } from "@/lib/web/rutas";
import { pais } from "@/lib/web/money";
import { DIAS_DE_PRUEBA, SE_OFRECE_PRUEBA } from "@/lib/web/oferta";

/* El alta recibe el plan por la URL, igual que en la web estática
   (crear-cuenta.html?plan=basic). La dirección sale de rutas.ts; lo
   único que se añade aquí es el parámetro. */
const ALTA_BASIC = `${WEB.crearCuenta}?plan=basic`;
const ALTA_PRO = `${WEB.crearCuenta}?plan=pro`;

/** Todas las claves de esta pantalla cuelgan de `planes.`. */
const clave = (nombre: string) => `planes.${nombre}`;

/**
 * El sufijo que decide la promesa. Los textos que hablaban de la
 * prueba están escritos dos veces en el diccionario, así que
 * `hero.lead` se convierte en `hero.leadConPrueba` o en
 * `hero.leadSinPrueba`. Hoy SE_OFRECE_PRUEBA es false: sale el
 * segundo.
 */
const OFERTA = SE_OFRECE_PRUEBA ? "ConPrueba" : "SinPrueba";

/** La clave de uno de esos textos, ya con su sufijo y su prefijo. */
const claveOferta = (nombre: string) => clave(nombre + OFERTA);

/** Los días de prueba, que ningún texto escribe a mano. */
const DIAS = { dias: DIAS_DE_PRUEBA };

/** El turno de cada bloque al entrar en pantalla (--i del original). */
const ritmo = (i: number) => ({ "--i": i }) as CSSProperties;

/* ============================================================
   Héroe: los dos planes como monolitos en 3D
============================================================ */

/** Una línea de las listas: la parte en negrita y el resto. */
function Punto({ negrita, resto, extra }: { negrita: string; resto?: string; extra?: ReactNode }) {
  const { w } = useWebT();
  return (
    <li>
      <b>{w(negrita)}</b>
      {resto ? <> {w(resto)}</> : null}
      {extra ? <> {extra}</> : null}
    </li>
  );
}

function TarjetaBasic() {
  const { w } = useWebT();
  return (
    <div className="pcard-wrap" data-reveal="" style={ritmo(5)}>
      <article className="pcard" data-tilt="5" aria-labelledby="plan-basic">
        <span className="glare" aria-hidden />
        <h2 id="plan-basic">{w("comun.nav.planBasic")}</h2>
        <p className="pcard__desc">{w(clave("basic.desc"))}</p>
        {/* PRECIO_BASIC: el precio todavía no se publica. Donde iría la
            cifra va la promesa de hoy, que la elige oferta.ts. */}
        <p className="pcard__price">
          <b>{w(claveOferta("basic.precio"), DIAS)}</b>
          <span>{w(claveOferta("basic.precioPie"), DIAS)}</span>
        </p>
        <p className="pcard__note">{w(clave("basic.nota"))}</p>
        <ul className="checks">
          <Punto negrita={clave("basic.reservasB")} resto={clave("basic.reservas")} />
          <Punto negrita={clave("basic.agendaB")} resto={clave("basic.agenda")} />
          <Punto negrita={clave("basic.confirmacionesB")} resto={clave("basic.confirmaciones")} />
          <Punto negrita={clave("basic.movilB")} resto={clave("basic.movil")} />
          <Punto negrita={clave("basic.perfilB")} resto={clave("basic.perfil")} />
        </ul>
        <div className="pcard__cta">
          <Link className="btn btn--light btn--lg btn--block" href={ALTA_BASIC}>
            {w(claveOferta("basic.cta"), DIAS)}
          </Link>
          <p className="pcard__small">{w(clave("basic.ctaPie"))}</p>
        </div>
        <Link className="link-arrow" href={WEB.planBasic}>
          {w(clave("basic.ver"))} <i className="i i-arrow-right" aria-hidden />
        </Link>
      </article>
    </div>
  );
}

function TarjetaPro() {
  const { w } = useWebT();
  return (
    <div className="pcard-wrap" data-reveal="" style={ritmo(6)}>
      <article className="pcard pcard--pro" data-tilt="5" aria-labelledby="plan-pro">
        <span className="glare" aria-hidden />
        <span className="tag tag--lime pcard__badge">{w("comun.nav.masPopular")}</span>
        <h2 id="plan-pro">{w("comun.nav.planPro")}</h2>
        <p className="pcard__desc">{w(clave("pro.desc"))}</p>
        {/* PRECIO_PRO: igual que el Basic, el precio no está publicado. */}
        <p className="pcard__price">
          <b>{w(claveOferta("pro.precio"), DIAS)}</b>
          <span>{w(claveOferta("pro.precioPie"), DIAS)}</span>
        </p>
        <p className="pcard__note">{w(claveOferta("pro.nota"), DIAS)}</p>
        <ul className="checks">
          <li>{w(clave("pro.todoBasic"))}</li>
          <Punto negrita={clave("pro.crmB")} resto={clave("pro.crm")} />
          <Punto negrita={clave("pro.facturacionB")} resto={clave("pro.facturacion")} />
          <Punto negrita={clave("pro.reservasB")} resto={clave("pro.reservas")} />
          <Punto negrita={clave("pro.equipoB")} resto={clave("pro.equipo")} />
          <Punto negrita={clave("pro.inventarioB")} resto={clave("pro.inventario")} />
          <Punto negrita={clave("pro.estadisticasB")} />
          <Punto negrita={clave("pro.sedesB")} resto={clave("pro.sedes")} />
          <Punto
            negrita={clave("pro.iaB")}
            extra={<span className="tag tag--lime">{w("comun.nav.nuevo")}</span>}
          />
        </ul>
        <div className="pcard__cta">
          <Link className="btn btn--primary btn--lg btn--block" href={ALTA_PRO}>
            {w(claveOferta("pro.cta"), DIAS)}
          </Link>
          {/* No lleva onClick: lo engancha el asistente por el data-*,
              igual que en la web estática. */}
          <button
            className="btn btn--ghost btn--lg btn--block"
            type="button"
            data-assistant-ask={w(clave("pro.ventasPregunta"))}
          >
            {w(clave("pro.ventas"))}
          </button>
        </div>
        <Link className="link-arrow" href={WEB.planPro}>
          {w(clave("pro.ver"))} <i className="i i-arrow-right" aria-hidden />
        </Link>
      </article>
    </div>
  );
}

function Hero() {
  const { w } = useWebT();
  return (
    <section className="pl-hero" aria-labelledby="pl-title">
      <div className="wrap pl-hero__head">
        <h1 className="h-hero" id="pl-title" data-split="">
          {w(clave("hero.titulo"))} <span className="mint">{w(clave("hero.tituloMint"))}</span>
        </h1>
        <p className="lead" data-reveal="" style={ritmo(4)}>
          {w(claveOferta("hero.lead"), DIAS)}
        </p>
      </div>
      <div className="wrap">
        {/* data-pointer: el motor expone --px y --py y el CSS inclina
            las dos tarjetas con el ratón. */}
        <div className="pl-cards" data-pointer="">
          <TarjetaBasic />
          <TarjetaPro />
        </div>
        <div className="ent" data-reveal="">
          <span className="ib ib--lime" aria-hidden><i className="i i-building" /></span>
          <p>
            <b>{w(clave("cadena.titulo"))}</b> {w(clave("cadena.texto"))}
          </p>
          <button
            className="btn btn--outline btn--sm"
            type="button"
            data-assistant-ask={w(clave("cadena.pregunta"))}
          >
            {w(clave("cadena.cta"))}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Comparativa Basic / Pro
   ------------------------------------------------------------
   Veintidós filas que solo cambian en tres palabras: si fueran
   veintidós bloques de JSX calcados, revisar si falta una línea
   sería imposible. Así que cada fila es un dato y el marcado se
   escribe una sola vez, igual que hace la página de cookies con
   sus bloques legales. El orden de la lista ES el de la tabla.
============================================================ */

/** Lo que cae en la columna de un plan. */
type Celda =
  /** El icono de «incluido». */
  | "si"
  /** El icono de «no incluido». */
  | "no"
  /** Un texto del diccionario, en negrita si `fuerte`. */
  | { texto: string; fuerte?: boolean };

/** Una fila: o la cabecera de un bloque, o una funcionalidad. */
type Fila =
  | { grupo: string }
  | { nombre: string; nota?: string; nuevo?: boolean; basic: Celda; pro: Celda };

const FILAS: Fila[] = [
  { grupo: "comparar.grupoReservas" },
  { nombre: "comparar.agenda", basic: "si", pro: "si" },
  { nombre: "comparar.confirmaciones", basic: "si", pro: "si" },
  { nombre: "comparar.perfil", basic: "si", pro: "si" },
  {
    nombre: "comparar.reservas",
    basic: { texto: "comparar.reservasBasic" },
    pro: { texto: "comparar.reservasPro", fuerte: true },
  },
  { nombre: "comparar.reglas", basic: "no", pro: "si" },
  { nombre: "comparar.recordatorios", basic: "no", pro: "si" },
  { nombre: "comparar.reprogramaciones", basic: "no", pro: "si" },

  { grupo: "comparar.grupoClientes" },
  { nombre: "comparar.crm", nota: "comparar.crmNota", basic: "no", pro: "si" },
  { nombre: "comparar.facturacion", nota: "comparar.facturacionNota", basic: "no", pro: "si" },
  { nombre: "comparar.ia", nuevo: true, basic: "no", pro: "si" },

  { grupo: "comparar.grupoNegocio" },
  { nombre: "comparar.equipo", nota: "comparar.equipoNota", basic: "no", pro: "si" },
  { nombre: "comparar.inventario", basic: "no", pro: "si" },
  { nombre: "comparar.estadisticas", basic: "no", pro: "si" },
  { nombre: "comparar.sedes", basic: "no", pro: "si" },

  { grupo: "comparar.grupoSiempre" },
  { nombre: "comparar.movil", nota: "comparar.movilNota", basic: "si", pro: "si" },
  /* La fila de la promesa: con prueba dice cuántos días dura y, sin
     ella, lo que cuesta cada plan. Las dos versiones están escritas
     en el diccionario; aquí solo se elige. */
  {
    nombre: `comparar.promesa${OFERTA}`,
    basic: { texto: `comparar.promesaBasic${OFERTA}` },
    pro: { texto: `comparar.promesaPro${OFERTA}` },
  },
  { nombre: "comparar.tarjeta", basic: { texto: "comparar.tarjetaValor" }, pro: { texto: "comparar.tarjetaValor" } },
  { nombre: "comparar.permanencia", basic: { texto: "comparar.permanenciaValor" }, pro: { texto: "comparar.permanenciaValor" } },
];

/** Una celda de plan. La columna de Pro va resaltada (`hl`). */
function CeldaPlan({ valor, destacada }: { valor: Celda; destacada?: boolean }) {
  const { w } = useWebT();
  const hl = destacada ? " hl" : "";

  if (valor === "si") {
    return (
      <td className={`yes${hl}`}>
        <i className="i i-check" aria-label={w(clave("comparar.incluido"))} />
      </td>
    );
  }
  if (valor === "no") {
    return (
      <td className={`no${hl}`}>
        <i className="i i-minus" aria-label={w(clave("comparar.noIncluido"))} />
      </td>
    );
  }
  return (
    <td className={destacada ? "hl" : undefined}>
      {valor.fuerte ? <b>{w(clave(valor.texto), DIAS)}</b> : w(clave(valor.texto), DIAS)}
    </td>
  );
}

function Comparativa() {
  const { w } = useWebT();
  return (
    <section className="sec" id="comparar">
      <div className="wrap">
        <div className="sec-head sec-head--center">
          <h2 className="h-xl" data-split="">{w(clave("comparar.titulo"))}</h2>
        </div>
        <div className="compare-wrap" data-reveal="">
          <table className="compare">
            <caption className="sr-only">{w(clave("comparar.resumen"))}</caption>
            <colgroup><col /><col /><col /></colgroup>
            <thead>
              <tr>
                <th scope="col">{w(clave("comparar.funcionalidad"))}</th>
                <th scope="col">
                  {w(clave("comparar.basic"))}
                  <small>{w(claveOferta("comparar.basicPie"), DIAS)}</small>
                </th>
                <th scope="col" className="hl">
                  {w(clave("comparar.pro"))}
                  <small>{w(claveOferta("comparar.proPie"), DIAS)}</small>
                </th>
              </tr>
            </thead>
            <tbody>
              {FILAS.map((fila) =>
                "grupo" in fila ? (
                  <tr className="grp" key={fila.grupo}>
                    <td>{w(clave(fila.grupo))}</td>
                    <td />
                    <td className="hl" />
                  </tr>
                ) : (
                  <tr key={fila.nombre}>
                    <td>
                      {w(clave(fila.nombre), DIAS)}
                      {fila.nota ? <small>{w(clave(fila.nota))}</small> : null}
                      {fila.nuevo ? <> <span className="tag tag--lime">{w("comun.nav.nuevo")}</span></> : null}
                    </td>
                    <CeldaPlan valor={fila.basic} />
                    <CeldaPlan valor={fila.pro} destacada />
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Calculadora de ausencias (#calculadora)
   ------------------------------------------------------------
   El ancla tiene que seguir viva: la enlazan la cabecera y el pie
   (WEB.calculadora).

   Los topes de los tres mandos de porcentaje y citas son los del
   original. El del precio medio NO: sale de money.ts, porque
   cambia con la moneda, y el motor lo vuelve a poner en cuanto
   sabe desde qué país se está mirando la página.
============================================================ */
const CITAS = { min: 10, max: 400, paso: 5, inicial: 60 };
const AUSENCIAS = { min: 1, max: 30, paso: 1, inicial: 8 };
const RECUPERA = { min: 10, max: 70, paso: 5, inicial: 35 };

const ESPANA = pais("es");
const [TICKET_MIN, TICKET_MAX, TICKET_PASO, TICKET_INICIAL] = ESPANA.range;

function Calculadora() {
  const { w } = useWebT();
  /* El sufijo de los porcentajes lo lee el motor del data-unit, así
     que tiene que estar traducido: en español va con espacio delante
     del signo y en inglés, pegado. */
  const porciento = w(clave("calculadora.porciento"));
  /* El molde del importe antes de saber el país. El número viene de
     money.ts; el formato, del diccionario. */
  const importe = (valor: number) => w(clave("calculadora.importe"), { valor });

  return (
    <section className="sec" id="calculadora">
      <div className="wrap">
        <div className="sec-head sec-head--split">
          <h2 className="h-lg" data-split="">{w(clave("calculadora.titulo"))}</h2>
          <p className="lead" data-reveal="">{w(clave("calculadora.lead"))}</p>
        </div>

        <div
          className="roi"
          data-roi=""
          data-reveal="scale"
          role="group"
          aria-label={w(clave("calculadora.aria"))}
        >
          <div className="roi__form">
            <div className="field field--select">
              <div className="field__top">
                <label htmlFor="roi-pais">{w(clave("calculadora.pais"))}</label>
                <output data-out="moneda" htmlFor="roi-pais">{ESPANA.cur}</output>
              </div>
              {/* Un solo país: el motor vacía el desplegable y pone los
                  23 de money.ts con su moneda. Este es el que se ve si
                  el JavaScript no llega. */}
              <select className="input select" id="roi-pais" name="pais" data-money-select>
                <option value={ESPANA.code}>{w(clave("calculadora.paisPorDefecto"))}</option>
              </select>
            </div>

            <div className="field">
              <div className="field__top">
                <label htmlFor="roi-citas">{w(clave("calculadora.citas"))}</label>
                <output data-out="citas" htmlFor="roi-citas">{CITAS.inicial}</output>
              </div>
              <input
                type="range"
                id="roi-citas"
                name="citas"
                min={CITAS.min}
                max={CITAS.max}
                step={CITAS.paso}
                defaultValue={CITAS.inicial}
              />
            </div>

            <div className="field">
              <div className="field__top">
                <label htmlFor="roi-ticket">{w(clave("calculadora.ticket"))}</label>
                <output data-out="ticket" htmlFor="roi-ticket">{importe(TICKET_INICIAL)}</output>
              </div>
              <input
                type="range"
                id="roi-ticket"
                name="ticket"
                min={TICKET_MIN}
                max={TICKET_MAX}
                step={TICKET_PASO}
                defaultValue={TICKET_INICIAL}
                data-money=""
              />
            </div>

            <div className="field">
              <div className="field__top">
                <label htmlFor="roi-aus">{w(clave("calculadora.ausencias"))}</label>
                <output data-out="ausencias" htmlFor="roi-aus">{AUSENCIAS.inicial}{porciento}</output>
              </div>
              <input
                type="range"
                id="roi-aus"
                name="ausencias"
                min={AUSENCIAS.min}
                max={AUSENCIAS.max}
                step={AUSENCIAS.paso}
                defaultValue={AUSENCIAS.inicial}
                data-unit={porciento}
              />
            </div>

            <div className="field">
              <div className="field__top">
                <label htmlFor="roi-rec">{w(clave("calculadora.recupera"))}</label>
                <output data-out="recupera" htmlFor="roi-rec">{RECUPERA.inicial}{porciento}</output>
              </div>
              <input
                type="range"
                id="roi-rec"
                name="recupera"
                min={RECUPERA.min}
                max={RECUPERA.max}
                step={RECUPERA.paso}
                defaultValue={RECUPERA.inicial}
                data-unit={porciento}
              />
              <small>{w(clave("calculadora.recuperaNota"))}</small>
            </div>
          </div>

          {/* Las dos columnas en 3D: su altura son las variables
              --lostv y --backv que escribe el motor. */}
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
              <span>{w(clave("calculadora.pierdes"))}</span>
              <span>{w(clave("calculadora.recuperas"))}</span>
            </div>
          </div>

          <div className="roi__result" aria-live="polite">
            <h3>{w(clave("calculadora.hoyPierdes"))}</h3>
            <div className="roi__big" data-res="perdida">{importe(0)}</div>
            <h3>{w(clave("calculadora.puedesRecuperar"))}</h3>
            <div className="roi__big roi__big--mint" data-res="recupera">{importe(0)}</div>
            <p>
              {w(clave("calculadora.alMes"))}{" "}
              <b data-res="anual">{importe(0)}</b>{" "}
              {w(clave("calculadora.alAnio"))}
            </p>
            <small>{w(clave("calculadora.aviso"))}</small>
            <div className="roi__cta">
              <Link className="btn btn--primary" href={ALTA_PRO}>
                {w(claveOferta("pro.cta"), DIAS)}
              </Link>
              <button
                className="btn btn--ghost"
                type="button"
                data-assistant-flow="roi"
                data-assistant-label={w(clave("calculadora.ctaAsistenteEtiqueta"))}
              >
                {w(clave("calculadora.ctaAsistente"))}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Preguntas (#faq)
   ------------------------------------------------------------
   El acordeón lo monta el motor sobre .faq: añade el icono, los
   id y los aria, y abre y cierra. Aquí solo va el marcado.

   La primera y la tercera cambian con la promesa de la prueba, y
   no solo la respuesta: sin prueba, lo que alguien pregunta ya no
   es cuánto dura ni qué pasa al acabar, sino si el Basic es gratis
   de verdad y si le van a cobrar algo sin avisar.
============================================================ */
const PREGUNTAS: { q: string; a: string }[] = [
  { q: `faq.q1${OFERTA}`, a: `faq.a1${OFERTA}` },
  { q: "faq.q2", a: "faq.a2" },
  { q: `faq.q3${OFERTA}`, a: `faq.a3${OFERTA}` },
  { q: "faq.q4", a: "faq.a4" },
  { q: "faq.q5", a: "faq.a5" },
  { q: "faq.q6", a: "faq.a6" },
];

function Preguntas() {
  const { w } = useWebT();
  return (
    <section className="sec cx-faq" id="faq">
      <div className="wrap cx-faq__grid">
        <div className="cx-faq__head">
          <h2 className="h-xl" data-split="">{w(clave("faq.titulo"))}</h2>
          <p className="lead" data-reveal="">
            {w(clave("faq.dudas"))}{" "}
            <button
              className="link-arrow"
              type="button"
              data-assistant-flow="recomendar"
              data-assistant-label={w(clave("faq.recomendarEtiqueta"))}
            >
              {w(clave("faq.recomendar"))} <i className="i i-arrow-right" aria-hidden />
            </button>
          </p>
        </div>
        <div className="faq" data-reveal="">
          {PREGUNTAS.map(({ q, a }) => (
            <div className="faq__item" key={q}>
              <button className="faq__q" type="button">{w(clave(q), DIAS)}</button>
              <div className="faq__a"><div><p>{w(clave(a), DIAS)}</p></div></div>
            </div>
          ))}
          {/* La última lleva un enlace dentro de la respuesta, así que
              no entra en la lista de arriba. */}
          <div className="faq__item">
            <button className="faq__q" type="button">{w(clave("faq.q7"))}</button>
            <div className="faq__a"><div><p>
              {w(clave("faq.a7"))}{" "}
              <Link href={WEB.appEmpresas}>{w(clave("faq.a7Enlace"))}</Link>.
            </p></div></div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   La llamada a la acción que corona el pie
============================================================ */
function CtaPlanes() {
  const { w } = useWebT();
  return (
    <section className="f-cta" aria-labelledby="f-cta-title">
      <div className="wrap">
        <h2 className="f-cta__title" id="f-cta-title" data-split="">
          {w(claveOferta("cta.titulo"), DIAS)} <em>{w(clave("cta.tituloEm"))}</em>
        </h2>
        <p className="lead" data-reveal="">{w(claveOferta("cta.lead"), DIAS)}</p>
        <div className="f-cta__actions" data-reveal="" style={ritmo(1)}>
          <Link className="btn btn--primary btn--lg" href={ALTA_PRO}>
            {w(claveOferta("cta.pro"), DIAS)} <i className="i i-arrow-right" aria-hidden />
          </Link>
          <Link className="btn btn--ghost btn--lg" href={ALTA_BASIC}>
            {w(claveOferta("cta.basic"), DIAS)}
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Planes() {
  return (
    <PaginaWeb mundo="crm" pagina="planes" cta={<CtaPlanes />}>
      <Hero />
      <Comparativa />
      <Calculadora />
      <Preguntas />
    </PaginaWeb>
  );
}
