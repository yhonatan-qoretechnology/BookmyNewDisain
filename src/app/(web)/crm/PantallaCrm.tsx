"use client";
/* ============================================================
   bookmy.es/crm — la puerta del CRM
   ------------------------------------------------------------
   Paso a Next de crm.html, la pantalla más grande del sitio. Las
   mismas secciones y en el mismo orden:

     1 · Héroe con el panel 3D que se ensambla al bajar
     2 · Manifiesto que se ilumina palabra a palabra
     3 · Negocios y ciudades (las dos cintas)
     4 · Módulos: el bento y la lista de «y además»
     5 · Así trabaja: las cuatro cartas que se apilan
     6 · Asistente IA: núcleo de partículas y chat
     7 · Sectores
     8 · Cifras
     9 · Testimonios
    10 · Planes
    11 · La app para empresas
    12 · Preguntas frecuentes
    13 · La llamada que corona el pie (va por `cta`)

   TRES REGLAS QUE ESTA PANTALLA NO SE SALTA
   · El marcado es el del original: las mismas clases de
     bookmy.css y los mismos atributos data-*, que son de donde
     vive el motor de animación (src/lib/web/motor.ts). Los
     `style="--i:…"` no son adorno: son el ritmo con el que
     entran las cosas, así que se conservan uno a uno.
   · Ni una frase escrita aquí: todo sale de crm.es.ts / crm.en.ts
     por w("crm.…"), también el texto de los paneles de ejemplo.
   · La prueba gratuita no se promete a mano. Los textos que
     hablaban de ella están dos veces en el diccionario y los
     elige SE_OFRECE_PRUEBA; los días llegan como {dias}.

   El componente es de cliente porque los textos salen del
   proveedor de idioma; los metadatos los exporta page.tsx, que
   es de servidor.
============================================================ */
import { Fragment, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import PaginaWeb from "@/components/web/PaginaWeb";
import { Tiendas } from "@/components/web/SiteFooter";
import { useWebT } from "@/components/web/useWebT";
import { WEB } from "@/lib/web/rutas";
import { DIAS_DE_PRUEBA, SE_OFRECE_PRUEBA } from "@/lib/web/oferta";

/* Las variables en línea del original. React no admite propiedades
   personalizadas en el tipo de `style`, así que pasan por aquí. */
const v = (vars: Record<string, string | number>) => vars as CSSProperties;

/** La clave del texto que toca: con la prueba prometida o sin ella. */
const segunPrueba = (clave: string) => `${clave}${SE_OFRECE_PRUEBA ? "ConPrueba" : "SinPrueba"}`;

/** Los días de prueba viajan como variable; nunca escritos en el texto. */
const DIAS = { dias: DIAS_DE_PRUEBA };

/* ============================================================
   Datos de las maquetas
   ------------------------------------------------------------
   Son listas de CLAVES, no de textos: el panel de ejemplo también
   está en los dos idiomas.
============================================================ */

/** El menú lateral del panel, con su icono. */
const MENU_PANEL: [string, string][] = [
  ["dashboard", "grid"],
  ["reservas", "calendar"],
  ["clientes", "users"],
  ["servicios", "scissors"],
  ["personal", "id-card"],
  ["calendario", "calendar-check"],
  ["resenas", "star"],
  ["facturacion", "receipt"],
  ["estadisticas", "bar-chart"],
  ["sedes", "map-pin"],
  ["stock", "package"],
  ["comunicacion", "message"],
  ["automatizaciones", "zap"],
];

const COLUMNAS = ["servicio", "cliente", "fecha", "hora", "duracion", "precio", "estado"];

/** Las cinco últimas reservas del panel del héroe. */
const RESERVAS = [
  {
    servicio: "crm.serv.manicuraSemi",
    avatar: "av",
    iniciales: "crm.gente.luciaIni",
    cliente: "crm.gente.lucia",
    fecha: "crm.panel.fecha.dia18",
    hora: "10:30",
    duracion: "crm.panel.duracion.m60",
    precio: "crm.importes.e25",
    estado: "status",
    texto: "crm.panel.estado.confirmada",
  },
  {
    servicio: "crm.serv.liftingPestanas",
    avatar: "av av--2",
    iniciales: "crm.gente.carmenIni",
    cliente: "crm.gente.carmen",
    fecha: "crm.panel.fecha.dia18",
    hora: "12:00",
    duracion: "crm.panel.duracion.m45",
    precio: "crm.importes.e40",
    estado: "status status--pending",
    texto: "crm.panel.estado.pendiente",
  },
  {
    servicio: "crm.serv.cejasHilo",
    avatar: "av av--3",
    iniciales: "crm.gente.martaIni",
    cliente: "crm.gente.marta",
    fecha: "crm.panel.fecha.dia18",
    hora: "13:15",
    duracion: "crm.panel.duracion.m15",
    precio: "crm.importes.e12",
    estado: "status status--done",
    texto: "crm.panel.estado.completada",
  },
  {
    servicio: "crm.serv.masajeRelajante",
    avatar: "av av--4",
    iniciales: "crm.gente.sofiaIni",
    cliente: "crm.gente.sofia",
    fecha: "crm.panel.fecha.dia18",
    hora: "17:00",
    duracion: "crm.panel.duracion.m60",
    precio: "crm.importes.e45",
    estado: "status",
    texto: "crm.panel.estado.confirmada",
  },
  {
    servicio: "crm.serv.cortePeinado",
    avatar: "av av--5",
    iniciales: "crm.gente.elenaIni",
    cliente: "crm.gente.elena",
    fecha: "crm.panel.fecha.dia19",
    hora: "09:30",
    duracion: "crm.panel.duracion.m50",
    precio: "crm.importes.e32",
    estado: "status status--cancel",
    texto: "crm.panel.estado.cancelada",
  },
];

/** Las cabeceras de los dos calendarios: los mismos cuatro días. */
const DIAS_SEMANA: [string, string][] = [
  ["lun", "17"],
  ["mar", "18"],
  ["mie", "19"],
  ["jue", "20"],
];

/** Una cita del calendario: la clase que la pinta y lo que dice. */
interface Cita {
  clase?: string;
  servicio?: string;
  quien?: string;
}
interface FilaSemana {
  hora: string;
  citas: Cita[];
}

/** El calendario de la tarjeta de reservas (el bento). */
const SEMANA_BENTO: FilaSemana[] = [
  {
    hora: "09:00",
    citas: [
      { servicio: "crm.serv.manicura", quien: "crm.gente.andrea" },
      { clase: "ev--c", servicio: "crm.serv.masaje", quien: "crm.gente.paula" },
      { clase: "ev--l", servicio: "crm.serv.cejas", quien: "crm.gente.andrea" },
      { clase: "ev--empty" },
    ],
  },
  {
    hora: "11:00",
    citas: [
      { clase: "ev--a", servicio: "crm.serv.pestanas", quien: "crm.gente.paula" },
      { clase: "ev--empty" },
      { servicio: "crm.serv.facial", quien: "crm.gente.irene" },
      { clase: "ev--c", servicio: "crm.serv.corte", quien: "crm.gente.irene" },
    ],
  },
  {
    hora: "16:30",
    citas: [
      { clase: "ev--c", servicio: "crm.serv.spa", quien: "crm.gente.paula" },
      { servicio: "crm.serv.manicura", quien: "crm.gente.andrea" },
      { clase: "ev--l", servicio: "crm.serv.unas", quien: "crm.gente.andrea" },
      { servicio: "crm.serv.masaje", quien: "crm.gente.irene" },
    ],
  },
  {
    hora: "18:00",
    citas: [
      { clase: "ev--l", servicio: "crm.serv.unas", quien: "crm.gente.clara" },
      { clase: "ev--a", servicio: "crm.serv.lifting", quien: "crm.gente.eva" },
      { clase: "ev--empty" },
      { clase: "ev--free", servicio: "crm.serv.hueco", quien: "crm.modulos.reservas.huecoNota" },
    ],
  },
];

/** El calendario de la primera carta apilada: el mismo, con clientas. */
const SEMANA_FLUJO: FilaSemana[] = [
  {
    hora: "09:00",
    citas: [
      { servicio: "crm.serv.manicura", quien: "crm.gente.luciaCorto" },
      { clase: "ev--c", servicio: "crm.serv.masaje", quien: "crm.gente.sofiaCorto" },
      { clase: "ev--l", servicio: "crm.serv.cejas", quien: "crm.gente.martaCorto" },
      { clase: "ev--empty" },
    ],
  },
  {
    hora: "10:30",
    citas: [
      { clase: "ev--a", servicio: "crm.serv.pestanas", quien: "crm.gente.carmenCorto" },
      { servicio: "crm.serv.facial", quien: "crm.gente.ana" },
      { clase: "ev--empty" },
      { clase: "ev--c", servicio: "crm.serv.corte", quien: "crm.gente.elenaCorto" },
    ],
  },
  {
    hora: "12:00",
    citas: [
      { clase: "ev--c", servicio: "crm.serv.spa", quien: "crm.gente.rosa" },
      { clase: "ev--l", servicio: "crm.serv.unas", quien: "crm.gente.nuria" },
      { servicio: "crm.serv.manicura", quien: "crm.gente.ines" },
      { clase: "ev--a", servicio: "crm.serv.masaje", quien: "crm.gente.laura" },
    ],
  },
  {
    hora: "18:00",
    citas: [
      { clase: "ev--l", servicio: "crm.serv.unas", quien: "crm.gente.clara" },
      { clase: "ev--empty" },
      { clase: "ev--a", servicio: "crm.serv.lifting", quien: "crm.gente.eva" },
      { clase: "ev--free", servicio: "crm.serv.hueco", quien: "crm.flujo.agenda.hueco18" },
    ],
  },
];

/** Las barras de la tarjeta de estadísticas del bento. */
const BARRAS_BENTO = ["42%", "58%", "50%", "74%", "66%", "88%", "100%"];

/** La lista de «y además, en el mismo panel». El 0 es «sin --i». */
const MAS_MODULOS: { clave: string; icono: string; ritmo: number; enlace?: string }[] = [
  { clave: "stock", icono: "package", ritmo: 0 },
  { clave: "servicios", icono: "scissors", ritmo: 1 },
  { clave: "calendario", icono: "calendar", ritmo: 2 },
  { clave: "resenas", icono: "star", ritmo: 3 },
  { clave: "comunicacion", icono: "message", ritmo: 4 },
  { clave: "automatizaciones", icono: "zap", ritmo: 0 },
  { clave: "roles", icono: "shield", ritmo: 1 },
  { clave: "app", icono: "smartphone", ritmo: 2 },
  { clave: "idioma", icono: "moon", ritmo: 3 },
  { clave: "asistente", icono: "sparkles", ritmo: 4, enlace: WEB.asistenteIa },
];

/** Los seis sectores, con su icono y cuántas etiquetas lleva cada uno. */
const SECTORES: { clave: string; icono: string; etiquetas: number }[] = [
  { clave: "estetica", icono: "flower", etiquetas: 4 },
  { clave: "peluqueria", icono: "scissors", etiquetas: 3 },
  { clave: "salud", icono: "stethoscope", etiquetas: 4 },
  { clave: "construccion", icono: "hammer", etiquetas: 3 },
  { clave: "tecnologia", icono: "cpu", etiquetas: 3 },
  { clave: "servicios", icono: "briefcase", etiquetas: 4 },
];

/** Los cuatro contadores de la banda de cifras. */
const CIFRAS: { clave: string; cuenta: string; decimales?: string; prefijo?: string; ritmo: number }[] = [
  { clave: "reservas", cuenta: "25", prefijo: "crm.cifras.reservasPrefijo", ritmo: 0 },
  { clave: "confirmadas", cuenta: "98", ritmo: 1 },
  { clave: "valoracion", cuenta: "4.9", decimales: "1", ritmo: 2 },
  { clave: "minutos", cuenta: "2", ritmo: 3 },
];

/** Los tres testimonios del carrusel. */
const VOCES = [1, 2, 3];

/* ============================================================
   El calendario de ejemplo, que sale dos veces
============================================================ */
function Semana({ filas }: { filas: FilaSemana[] }) {
  const { w } = useWebT();
  return (
    <div className="week" style={v({ "--cols": 4 })}>
      <div className="week__row week__head">
        <span />
        {DIAS_SEMANA.map(([dia, numero]) => (
          <span key={dia}>
            {w(`crm.dias.${dia}`)}
            <b>{numero}</b>
          </span>
        ))}
      </div>
      {filas.map((fila) => (
        <div className="week__row" key={fila.hora}>
          <span className="week__t">{fila.hora}</span>
          {fila.citas.map((cita, i) => (
            <span className={`ev${cita.clase ? ` ${cita.clase}` : ""}`} key={`${fila.hora}-${i}`}>
              {cita.servicio ? w(cita.servicio) : null}
              {cita.quien ? <small>{w(cita.quien)}</small> : null}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   1 · Héroe: el panel que se monta al hacer scroll
============================================================ */
function Heroe() {
  const { w } = useWebT();
  const negocio = w("crm.demo.negocio");

  return (
    <section className="cx-hero" data-scene="crm-hero" aria-labelledby="cx-title">
      <div className="cx-hero__stick">
        <div className="wrap cx-hero__copy">
          <h1 className="h-hero cx-hero__title" id="cx-title" data-split="">
            {w("crm.hero.titulo")} <span className="mint">{w("crm.hero.tituloVende")}</span>
          </h1>
          <p className="lead" data-reveal="" style={v({ "--i": 5 })}>{w("crm.hero.lead")}</p>
          <div className="cx-hero__cta" data-reveal="" style={v({ "--i": 6 })}>
            <Link className="btn btn--primary btn--lg" href={WEB.crearCuenta}>
              {w(segunPrueba("crm.hero.cta"), DIAS)} <i className="i i-arrow-right" aria-hidden />
            </Link>
            <Link className="btn btn--ghost btn--lg" href={WEB.calculadora}>{w("crm.hero.ctaCalculadora")}</Link>
          </div>
        </div>

        <div className="cx-hero__space">
          <div className="dash3d" data-dash3d="">
            <div className="dash3d__glow" aria-hidden />
            <figure className="dash ui-light" role="img" aria-label={w("crm.panel.alt")}>
              <div className="dash__bar">
                <span className="dash__dots"><i /><i /><i /></span>
                <span className="dash__url"><i className="i i-lock" />{w("crm.panel.url")}</span>
              </div>
              <div className="dash__body">
                <aside className="dash__side lz" style={v({ "--z": 40 })}>
                  <div className="dash__brand">
                    <span className="dash__logo">{w("crm.demo.inicial")}</span>
                    <div><b>{negocio}</b><small>{w("crm.demo.plataforma")}</small></div>
                  </div>
                  <span className="dash__role">{w("crm.panel.rol")}</span>
                  <div className="dash__nav">
                    {MENU_PANEL.map(([clave, icono], i) => (
                      <span key={clave} className={i === 0 ? "is-active" : undefined}>
                        <i className={`i i-${icono}`} />{w(`crm.panel.nav.${clave}`)}
                      </span>
                    ))}
                  </div>
                </aside>

                <div className="dash__main">
                  <div className="dash__top lz" style={v({ "--z": 30 })}>
                    <div><small>{w("crm.panel.miga")}</small><b>{w("crm.panel.titulo")}</b></div>
                    <div className="dash__tools">
                      <span className="dash__chip">{w("crm.panel.idioma")}</span>
                      <span className="dash__icon"><i className="i i-moon" /></span>
                      <span className="dash__icon"><i className="i i-bell" /><em>3</em></span>
                      <span className="dash__user">
                        <span className="av">{w("crm.panel.sedeUsuario")}</span>
                        <span><b>{w("crm.demo.sedeCentro")}</b><small>{negocio}</small></span>
                      </span>
                    </div>
                  </div>

                  <div className="dash__kpis">
                    <div className="kpi lz" style={v({ "--z": 150 })}>
                      <span className="kpi__ic"><i className="i i-user" /></span>
                      <small>{w("crm.panel.kpi.clientes")}</small>
                      <b>{w("crm.panel.kpi.clientesValor")}</b>
                      <em>{w("crm.panel.kpi.clientesPie")}</em>
                    </div>
                    <div className="kpi lz" style={v({ "--z": 210 })}>
                      <span className="kpi__ic kpi__ic--c"><i className="i i-bar-chart" /></span>
                      <small>{w("crm.panel.kpi.ingresos")}</small>
                      <b>{w("crm.importes.mes")}</b>
                      <em>{w("crm.panel.kpi.ingresosPie")}</em>
                    </div>
                    <div className="kpi lz" style={v({ "--z": 120 })}>
                      <span className="kpi__ic kpi__ic--r"><i className="i i-clock" /></span>
                      <small>{w("crm.panel.kpi.reservas")}</small>
                      <b>{w("crm.panel.kpi.reservasValor")}</b>
                      <em>{w("crm.panel.kpi.reservasPie")}</em>
                    </div>
                    <div className="kpi lz" style={v({ "--z": 180 })}>
                      <span className="kpi__ic kpi__ic--y"><i className="i i-star" /></span>
                      <small>{w("crm.panel.kpi.valoracion")}</small>
                      <b>{w("crm.panel.kpi.valoracionValor")}</b>
                      <em>{w("crm.panel.kpi.valoracionPie")}</em>
                    </div>
                  </div>

                  <div className="dash__panel lz" style={v({ "--z": 80 })}>
                    <div className="dash__ph">
                      <div>
                        <b>{w("crm.panel.ultimas.titulo")}</b>
                        <small>{w("crm.panel.ultimas.sub", { negocio })}</small>
                      </div>
                      <span className="dash__btn">{w("crm.panel.ultimas.boton")}</span>
                    </div>
                    <div className="dash__search">
                      <i className="i i-search" />{w("crm.panel.ultimas.buscar")}
                    </div>
                    <div className="dash__table">
                      <div className="tr th">
                        {COLUMNAS.map((columna) => (
                          <span key={columna}>{w(`crm.panel.col.${columna}`)}</span>
                        ))}
                      </div>
                      {RESERVAS.map((reserva, i) => (
                        <div className="tr" key={`${reserva.servicio}-${i}`}>
                          <span>{w(reserva.servicio)}</span>
                          <span className="cl">
                            <span className={reserva.avatar}>{w(reserva.iniciales)}</span>
                            {w(reserva.cliente)}
                          </span>
                          <span>{w(reserva.fecha)}</span>
                          <span>{reserva.hora}</span>
                          <span>{w(reserva.duracion)}</span>
                          <span>{w(reserva.precio)}</span>
                          <span><span className={reserva.estado}>{w(reserva.texto)}</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </figure>

            <div className="n3d n3d--1" style={v({ "--z": 260 })} aria-hidden>
              <div className="toast">
                <span className="ib"><i className="i i-calendar-check" /></span>
                <div>
                  <b>{w("crm.panel.aviso1.titulo")}</b>
                  {w("crm.panel.aviso1.texto", {
                    cliente: w("crm.gente.luciaCorto"),
                    servicio: w("crm.serv.manicura"),
                  })}
                </div>
                <time>{w("crm.panel.aviso1.cuando")}</time>
              </div>
            </div>
            <div className="n3d n3d--2" style={v({ "--z": 320 })} aria-hidden>
              <div className="toast">
                <span className="ib ib--lime"><i className="i i-sparkles" /></span>
                <div>
                  <b>{w("crm.panel.aviso2.titulo")}</b>
                  {w("crm.panel.aviso2.texto", {
                    importe: w("crm.importes.extra"),
                    cliente: w("crm.gente.carmenCorto"),
                  })}
                </div>
                <time>{w("crm.panel.aviso2.cuando")}</time>
              </div>
            </div>
            <div className="n3d n3d--3" style={v({ "--z": 220 })} aria-hidden>
              <div className="toast">
                <span className="ib ib--cyan"><i className="i i-credit-card" /></span>
                <div>
                  <b>{w("crm.panel.aviso3.titulo")}</b>
                  {w("crm.panel.aviso3.texto", {
                    importe: w("crm.importes.e45"),
                    cliente: w("crm.gente.sofiaCorto"),
                  })}
                </div>
                <time>{w("crm.panel.aviso3.cuando")}</time>
              </div>
            </div>
          </div>
        </div>

        <p className="cx-hero__caption" aria-hidden>
          {w("crm.hero.pie")} <span className="mint">{w("crm.hero.piePanel")}</span>
        </p>
      </div>
    </section>
  );
}

/* ============================================================
   2 · Manifiesto: se ilumina palabra a palabra
============================================================ */
function Manifiesto() {
  const { w } = useWebT();
  return (
    <section className="sec cx-statement">
      <div className="wrap">
        <p className="statement" data-scrub="">
          {w("crm.manifiesto.p1")} <em>{w("crm.manifiesto.em1")}</em> {w("crm.manifiesto.p2")}{" "}
          <em>{w("crm.manifiesto.em2")}</em>
        </p>
      </div>
    </section>
  );
}

/* ============================================================
   3 · Negocios y ciudades que ya trabajan con Bookmy
============================================================ */
function Confianza() {
  const { w } = useWebT();
  return (
    <section className="cx-trust" aria-label={w("crm.confianza.etiqueta")}>
      <div className="marquee marquee--xl" data-marquee="1">
        <div className="marquee__track">
          {/* Los nombres y los destellos son hermanos, no van envueltos: la
              cinta es un flex con `gap` y mide a sus hijos directos. */}
          {[1, 2, 3, 4, 5].map((n) => (
            <Fragment key={n}>
              <span className={`mq${n % 2 === 0 ? " mq--stroke" : ""}`}>{w(`crm.confianza.negocio${n}`)}</span>
              <i className="i i-sparkles mq-sep" aria-hidden />
            </Fragment>
          ))}
        </div>
      </div>
      <div className="marquee marquee--sm" data-marquee="-1">
        <div className="marquee__track">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <span className="mq-city" key={n}>
              <i className="i i-map-pin" aria-hidden />
              {w(`crm.confianza.ciudad${n}`)}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   4 · Módulos: el bento y la lista de «y además»
============================================================ */
function Modulos() {
  const { w } = useWebT();
  return (
    <section className="sec" id="modulos">
      <div className="wrap">
        <div className="sec-head">
          <h2 className="h-xl cx-inline" data-reveal="blur">
            {w("crm.modulos.titulo1")}{" "}
            <span className="pimg pimg--ui" aria-hidden>
              <i style={v({ "--h": "38%" })} />
              <i style={v({ "--h": "62%" })} />
              <i style={v({ "--h": "48%" })} />
              <i style={v({ "--h": "80%" })} />
              <i style={v({ "--h": "100%" })} />
            </span>{" "}
            {w("crm.modulos.titulo2")}
          </h2>
          <p className="lead" data-reveal="" style={v({ "--i": 1 })}>{w("crm.modulos.lead")}</p>
        </div>

        <div className="bento">
          {/* Reservas y calendario */}
          <article className="bc bc--a" data-tilt="" data-reveal="">
            <span className="glare" aria-hidden />
            <div className="bc__txt">
              <h3 className="h-md">{w("crm.modulos.reservas.titulo")}</h3>
              <p>{w("crm.modulos.reservas.texto")}</p>
            </div>
            <div className="bc__ui frag" aria-hidden>
              <div className="frag__head">
                <div>
                  <b>{w("crm.modulos.reservas.semana")}</b>
                  <small>{w("crm.modulos.reservas.sub", { sede: w("crm.demo.sedeCentro") })}</small>
                </div>
                <span className="live">{w("crm.etiquetas.enDirecto")}</span>
              </div>
              <Semana filas={SEMANA_BENTO} />
            </div>
          </article>

          {/* CRM de clientes */}
          <article className="bc bc--b" data-tilt="" data-reveal="" style={v({ "--i": 1 })}>
            <span className="glare" aria-hidden />
            <div className="bc__txt">
              <h3 className="h-md">{w("crm.modulos.clientes.titulo")}</h3>
              <p>{w("crm.modulos.clientes.texto")}</p>
            </div>
            <div className="bc__ui frag client" aria-hidden>
              <div className="client__top">
                <span className="av av--lg">{w("crm.gente.luciaIni")}</span>
                <div><b>{w("crm.gente.lucia")}</b><small>{w("crm.modulos.clientes.desde")}</small></div>
                <span className="tag">{w("crm.etiquetas.vip")}</span>
              </div>
              <div className="client__stats">
                <div><b>{w("crm.modulos.clientes.visitas")}</b><small>{w("crm.modulos.clientes.visitasPie")}</small></div>
                <div><b>{w("crm.importes.consumo")}</b><small>{w("crm.modulos.clientes.consumoPie")}</small></div>
                <div><b>{w("crm.modulos.clientes.frecuencia")}</b><small>{w("crm.modulos.clientes.frecuenciaPie")}</small></div>
              </div>
            </div>
          </article>

          {/* Facturación y pagos */}
          <article className="bc bc--c" data-tilt="" data-reveal="" style={v({ "--i": 2 })}>
            <span className="glare" aria-hidden />
            <div className="bc__txt">
              <h3 className="h-sm">{w("crm.modulos.facturacion.titulo")}</h3>
              <p>{w("crm.modulos.facturacion.texto")}</p>
            </div>
            <div className="bc__ui frag inv" aria-hidden>
              <div className="inv__row">
                <span>{w("crm.gente.lucia")}</span>
                <b>{w("crm.importes.e33")}</b>
                <span className="tag">{w("crm.etiquetas.online")}</span>
              </div>
              <div className="inv__row">
                <span>{w("crm.gente.sofia")}</span>
                <b>{w("crm.importes.e45")}</b>
                <span className="tag tag--lime">{w("crm.etiquetas.local")}</span>
              </div>
              <div className="inv__row">
                <span>{w("crm.gente.marta")}</span>
                <b>{w("crm.importes.e12")}</b>
                <span className="tag">{w("crm.etiquetas.online")}</span>
              </div>
            </div>
          </article>

          {/* Estadísticas */}
          <article className="bc bc--d" data-tilt="" data-reveal="" style={v({ "--i": 3 })}>
            <span className="glare" aria-hidden />
            <div className="bc__txt">
              <h3 className="h-sm">{w("crm.modulos.estadisticas.titulo")}</h3>
              <p>{w("crm.modulos.estadisticas.texto")}</p>
            </div>
            <div className="bc__ui frag" aria-hidden>
              <div className="bars">
                {BARRAS_BENTO.map((alto, i) => (
                  <i key={alto + i} style={v({ "--h": alto, "--i": i })} />
                ))}
              </div>
            </div>
          </article>

          {/* Equipo y sedes */}
          <article className="bc bc--e" data-tilt="" data-reveal="" style={v({ "--i": 1 })}>
            <span className="glare" aria-hidden />
            <div className="bc__txt">
              <h3 className="h-md">{w("crm.modulos.equipo.titulo")}</h3>
              <p>{w("crm.modulos.equipo.texto")}</p>
            </div>
            <div className="bc__ui bc__ui--split" aria-hidden>
              <div className="frag">
                <div className="frag__head">
                  <b>{w("crm.modulos.equipo.equipo")}</b>
                  <small>{w("crm.modulos.equipo.personas")}</small>
                </div>
                <div className="team">
                  <span>
                    <span className="av">{w("crm.gente.andreaIni")}</span>
                    {w("crm.gente.andrea")} <small>{w("crm.modulos.equipo.oficioUnas")}</small>
                  </span>
                  <span>
                    <span className="av av--2">{w("crm.gente.paulaIni")}</span>
                    {w("crm.gente.paula")} <small>{w("crm.modulos.equipo.oficioSpa")}</small>
                  </span>
                  <span>
                    <span className="av av--3">{w("crm.gente.ireneIni")}</span>
                    {w("crm.gente.irene")} <small>{w("crm.modulos.equipo.oficioEstetica")}</small>
                  </span>
                  <span>
                    <span className="av av--4">{w("crm.gente.direccionIni")}</span>
                    {w("crm.gente.direccion")}
                  </span>
                </div>
              </div>
              <div className="frag">
                <ul className="sedes">
                  <li className="is-on">
                    <i className="i i-map-pin" />
                    <b>{w("crm.demo.sedeCentro")}</b>
                    <small>{w("crm.modulos.equipo.sedeActiva")}</small>
                  </li>
                  <li>
                    <i className="i i-map-pin" />
                    <b>{w("crm.demo.sedePuerto")}</b>
                    <small>{w("crm.modulos.equipo.sedeReservas18")}</small>
                  </li>
                  <li>
                    <i className="i i-map-pin" />
                    <b>{w("crm.demo.sedePlaya")}</b>
                    <small>{w("crm.modulos.equipo.sedeReservas14")}</small>
                  </li>
                </ul>
              </div>
            </div>
          </article>
        </div>

        <div className="more">
          <h3 className="h-sm" data-reveal="">{w("crm.modulos.mas.titulo")}</h3>
          <ul className="more__list">
            {MAS_MODULOS.map(({ clave, icono, ritmo, enlace }) => (
              <li key={clave} data-reveal="" style={ritmo ? v({ "--i": ritmo }) : undefined}>
                <i className={`i i-${icono}`} aria-hidden />
                <b>
                  {enlace ? (
                    <Link href={enlace}>{w(`crm.modulos.mas.${clave}`)}</Link>
                  ) : (
                    w(`crm.modulos.mas.${clave}`)
                  )}
                </b>
                <span>{w(`crm.modulos.mas.${clave}Texto`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   5 · Así trabaja: cuatro cartas que se apilan
============================================================ */
function Flujo() {
  const { w } = useWebT();
  const sedeCentro = w("crm.demo.sedeCentro");

  return (
    <section className="sec cx-flow">
      <div className="wrap">
        <div className="sec-head sec-head--split">
          <h2 className="h-xl" data-split="">{w("crm.flujo.titulo")}</h2>
          <p className="lead" data-reveal="">{w("crm.flujo.lead")}</p>
        </div>

        <div className="stack" data-stack="">
          {/* La agenda que se llena sola */}
          <article className="stack__card" style={v({ "--i": 0, "--acc": "var(--mint-rgb)" })}>
            <div className="stack__txt">
              <h3 className="h-lg">{w("crm.flujo.agenda.titulo")}</h3>
              <p>{w("crm.flujo.agenda.texto")}</p>
              <ul className="checks">
                <li>{w("crm.flujo.agenda.check1")}</li>
                <li>{w("crm.flujo.agenda.check2")}</li>
                <li>{w("crm.flujo.agenda.check3")}</li>
              </ul>
            </div>
            <div className="stack__ui frag" aria-hidden>
              <div className="frag__head">
                <div>
                  <b>{w("crm.flujo.agenda.panel")}</b>
                  <small>{w("crm.flujo.agenda.panelSub", { sede: sedeCentro })}</small>
                </div>
                <span className="live">{w("crm.flujo.agenda.citasHoy")}</span>
              </div>
              <Semana filas={SEMANA_FLUJO} />
              <p className="ai-hint"><i className="i i-sparkles" />{w("crm.flujo.agenda.pista")}</p>
            </div>
          </article>

          {/* La ficha de cada cliente */}
          <article className="stack__card" style={v({ "--i": 1, "--acc": "79,212,230" })}>
            <div className="stack__txt">
              <h3 className="h-lg">{w("crm.flujo.ficha.titulo")}</h3>
              <p>{w("crm.flujo.ficha.texto")}</p>
              <ul className="checks">
                <li>{w("crm.flujo.ficha.check1")}</li>
                <li>{w("crm.flujo.ficha.check2")}</li>
                <li>{w("crm.flujo.ficha.check3")}</li>
              </ul>
            </div>
            <div className="stack__ui frag client" aria-hidden>
              <div className="client__top">
                <span className="av av--lg">{w("crm.gente.luciaIni")}</span>
                <div><b>{w("crm.gente.lucia")}</b><small>{w("crm.flujo.ficha.desde")}</small></div>
                <span className="tag">{w("crm.etiquetas.vip")}</span>
              </div>
              <div className="client__stats">
                <div><b>{w("crm.flujo.ficha.visitas")}</b><small>{w("crm.flujo.ficha.visitasPie")}</small></div>
                <div><b>{w("crm.importes.consumo")}</b><small>{w("crm.flujo.ficha.consumoPie")}</small></div>
                <div><b>{w("crm.flujo.ficha.frecuencia")}</b><small>{w("crm.flujo.ficha.frecuenciaPie")}</small></div>
              </div>
              <ul className="client__hist">
                <li>
                  <span>{w("crm.serv.manicuraSemi")}</span>
                  <small>{w("crm.panel.fecha.oct28")} · {w("crm.gente.andrea")}</small>
                  <b>{w("crm.importes.e25")}</b>
                </li>
                <li>
                  <span>{w("crm.serv.liftingPestanas")}</span>
                  <small>{w("crm.panel.fecha.oct07")} · {w("crm.gente.paula")}</small>
                  <b>{w("crm.importes.e40")}</b>
                </li>
                <li>
                  <span>{w("crm.serv.manicuraParafina")}</span>
                  <small>{w("crm.panel.fecha.sep16")} · {w("crm.gente.andrea")}</small>
                  <b>{w("crm.importes.e33")}</b>
                </li>
              </ul>
              <p className="ai-hint">
                <i className="i i-sparkles" />
                {w("crm.flujo.ficha.pista", { importe: w("crm.importes.extra") })}
              </p>
            </div>
          </article>

          {/* Los cobros */}
          <article className="stack__card" style={v({ "--i": 2, "--acc": "var(--lime-rgb)" })}>
            <div className="stack__txt">
              <h3 className="h-lg">{w("crm.flujo.cobros.titulo")}</h3>
              <p>{w("crm.flujo.cobros.texto")}</p>
              <ul className="checks">
                <li>{w("crm.flujo.cobros.check1")}</li>
                <li>{w("crm.flujo.cobros.check2")}</li>
                <li>{w("crm.flujo.cobros.check3")}</li>
              </ul>
            </div>
            <div className="stack__ui frag" aria-hidden>
              <div className="frag__head">
                <div>
                  <b>{w("crm.flujo.cobros.panel")}</b>
                  <small>{w("crm.flujo.cobros.panelSub")}</small>
                </div>
                <span className="tag">{w("crm.flujo.cobros.subida")}</span>
              </div>
              <p className="big-num">{w("crm.importes.mes")}</p>
              <p className="small muted" style={{ margin: "4px 0 14px" }}>{w("crm.flujo.cobros.ingresosPie")}</p>
              <div className="inv">
                <div className="inv__row">
                  <span>{w("crm.flujo.cobros.factura1")}<small>{w("crm.gente.lucia")}</small></span>
                  <b>{w("crm.importes.e33")}</b>
                  <span className="tag">{w("crm.etiquetas.online")}</span>
                </div>
                <div className="inv__row">
                  <span>{w("crm.flujo.cobros.factura2")}<small>{w("crm.gente.sofia")}</small></span>
                  <b>{w("crm.importes.e45")}</b>
                  <span className="tag tag--lime">{w("crm.etiquetas.enLocal")}</span>
                </div>
                <div className="inv__row">
                  <span>{w("crm.flujo.cobros.factura3")}<small>{w("crm.gente.carmen")}</small></span>
                  <b>{w("crm.importes.e40")}</b>
                  <span className="tag">{w("crm.etiquetas.online")}</span>
                </div>
                <div className="inv__row">
                  <span>{w("crm.flujo.cobros.factura4")}<small>{w("crm.gente.marta")}</small></span>
                  <b>{w("crm.importes.e12")}</b>
                  <span className="tag tag--lime">{w("crm.etiquetas.enLocal")}</span>
                </div>
              </div>
              <div style={{ marginTop: "14px" }}>
                <div className="frag__head" style={{ marginBottom: "8px" }}>
                  <small>{w("crm.flujo.cobros.pagosOnline")}</small>
                  <b>{w("crm.flujo.cobros.pagosOnlineValor")}</b>
                </div>
                <div className="meter-bar" style={v({ "--v": "64%" })}><span /></div>
              </div>
            </div>
          </article>

          {/* Los datos */}
          <article className="stack__card" style={v({ "--i": 3, "--acc": "255,191,87" })}>
            <div className="stack__txt">
              <h3 className="h-lg">{w("crm.flujo.datos.titulo")}</h3>
              <p>{w("crm.flujo.datos.texto")}</p>
              <ul className="checks">
                <li>{w("crm.flujo.datos.check1")}</li>
                <li>{w("crm.flujo.datos.check2")}</li>
                <li>{w("crm.flujo.datos.check3")}</li>
              </ul>
            </div>
            <div className="stack__ui frag" aria-hidden>
              <div className="frag__head">
                <div>
                  <b>{w("crm.flujo.datos.panel")}</b>
                  <small>{w("crm.flujo.datos.panelSub")}</small>
                </div>
                <span className="live">{w("crm.etiquetas.enTiempoReal")}</span>
              </div>
              <div className="stats-row">
                <div className="ring" style={v({ "--v": 78 })}>
                  <b>{w("crm.flujo.datos.ocupacion")}<small>{w("crm.flujo.datos.ocupacionPie")}</small></b>
                </div>
                <div className="stats-row__chart">
                  <div className="bars" style={{ height: "110px" }}>
                    <i style={v({ "--h": "56%", "--i": 0 })} />
                    <i style={v({ "--h": "70%", "--i": 1 })} />
                    <i style={v({ "--h": "64%", "--i": 2 })} />
                    <i style={v({ "--h": "92%", "--i": 3 })} />
                  </div>
                  <div className="bars-labels">
                    <span>{w("crm.flujo.datos.semana44")}</span>
                    <span>{w("crm.flujo.datos.semana45")}</span>
                    <span>{w("crm.flujo.datos.semana46")}</span>
                    <span>{w("crm.flujo.datos.semana47")}</span>
                  </div>
                </div>
              </div>
              <ul className="sedes" style={{ marginTop: "14px" }}>
                <li className="is-on">
                  <i className="i i-star" />
                  <b>{w("crm.flujo.datos.estrella", { servicio: w("crm.serv.manicuraSemi") })}</b>
                  <small>{w("crm.flujo.datos.estrellaPie")}</small>
                </li>
                <li>
                  <i className="i i-map-pin" />
                  <b>{w("crm.flujo.datos.mejorSede", { sede: sedeCentro })}</b>
                  <small>{w("crm.importes.sedeMes")}</small>
                </li>
              </ul>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   6 · Asistente IA: núcleo de partículas y chat flotante
============================================================ */
function AsistenteIa() {
  const { w } = useWebT();
  return (
    <section className="sec cx-ai" id="ia">
      <div className="cx-ai__core" aria-hidden>
        <canvas data-sculpture="core" data-size="1.6" data-spin=".22" data-extent="1.3" />
      </div>
      <div className="wrap cx-ai__grid">
        <div className="cx-ai__copy">
          <h2 className="h-lg cx-ai__title" data-split="">
            {w("crm.ia.titulo")} <span className="mint">{w("crm.ia.tituloComision")}</span>
          </h2>
          <p className="lead" data-reveal="">{w("crm.ia.lead")}</p>
          <ul className="caps" data-reveal="">
            <li>
              <i className="i i-clock" aria-hidden />
              <b>{w("crm.ia.cap1")}</b>
              <span>{w("crm.ia.cap1Texto")}</span>
            </li>
            <li>
              <i className="i i-calendar-check" aria-hidden />
              <b>{w("crm.ia.cap2")}</b>
              <span>{w("crm.ia.cap2Texto")}</span>
            </li>
            <li>
              <i className="i i-trending-up" aria-hidden />
              <b>{w("crm.ia.cap3")}</b>
              <span>{w("crm.ia.cap3Texto")}</span>
            </li>
            <li>
              <i className="i i-refresh" aria-hidden />
              <b>{w("crm.ia.cap4")}</b>
              <span>{w("crm.ia.cap4Texto")}</span>
            </li>
          </ul>
          <div className="cx-ai__cta" data-reveal="">
            <Link className="btn btn--primary btn--lg" href={WEB.asistenteIa}>
              {w("crm.ia.cta")} <i className="i i-arrow-right" aria-hidden />
            </Link>
            <button className="btn btn--ghost btn--lg" type="button" data-assistant-open="">
              {w("crm.ia.ctaHablar")}
            </button>
          </div>
        </div>

        <div className="cx-ai__stage" data-reveal="scale">
          <div className="chat3d" data-tilt="">
            <span className="glare" aria-hidden />
            <div className="chat" data-chat-demo="">
              <div className="chat__head">
                <span className="orb-av" aria-hidden />
                <div>
                  <b>{w("crm.ia.chatTitulo", { negocio: w("crm.demo.negocio") })}</b>
                  <small>{w("crm.ia.chatEstado")}</small>
                </div>
                <button className="chat__replay" type="button" data-chat-replay="">
                  <i className="i i-rotate-ccw" aria-hidden />
                  <span className="sr-only">{w("crm.ia.chatRepetir")}</span>
                </button>
              </div>
              <div className="chat__log">
                <p className="bubble">{w("crm.ia.chat1")}</p>
                <p className="bubble bubble--out">{w("crm.ia.chat2")}</p>
                <p className="bubble">{w("crm.ia.chat3")}</p>
                <p className="bubble bubble--out">
                  {w("crm.ia.chat4")}
                  <span className="bubble__note">
                    <i className="i i-sparkles" aria-hidden />
                    {w("crm.ia.chat4Nota")}
                  </span>
                </p>
                <p className="bubble">{w("crm.ia.chat5")}</p>
                <p className="bubble bubble--out">{w("crm.ia.chat6")}</p>
                <span className="typing" aria-hidden><i /><i /><i /></span>
              </div>
            </div>
          </div>
          <div className="cx-ai__toast toast" aria-hidden>
            <span className="ib ib--lime"><i className="i i-trending-up" /></span>
            <div><b>{w("crm.ia.toast")}</b>{w("crm.ia.toastPie")}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   7 · Sectores
============================================================ */
function Sectores() {
  const { w } = useWebT();
  return (
    <section className="sec cx-sectors">
      <div className="wrap">
        <div className="sec-head sec-head--split">
          <h2 className="h-xl" data-split="">{w("crm.sectores.titulo")}</h2>
          <p className="lead" data-reveal="">{w("crm.sectores.lead")}</p>
        </div>
        <ul className="sectors">
          {SECTORES.map(({ clave, icono, etiquetas }) => (
            <li className="sector" data-reveal="" key={clave}>
              <span className="sector__ic"><i className={`i i-${icono}`} aria-hidden /></span>
              <h3 className="sector__name">{w(`crm.sectores.${clave}`)}</h3>
              <div className="sector__body">
                <p>{w(`crm.sectores.${clave}Texto`)}</p>
                <span className="sector__tags">
                  {Array.from({ length: etiquetas }, (_, i) => (
                    <span key={i}>{w(`crm.sectores.${clave}Tag${i + 1}`)}</span>
                  ))}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ============================================================
   8 · Cifras
============================================================ */
function Cifras() {
  const { w } = useWebT();
  return (
    <section className="sec--tight cx-proof" aria-label={w("crm.cifras.etiqueta")}>
      <div className="wrap proof">
        {CIFRAS.map(({ clave, cuenta, decimales, prefijo, ritmo }) => (
          <div className="proof__item" data-reveal="" style={ritmo ? v({ "--i": ritmo }) : undefined} key={clave}>
            <b
              data-count={cuenta}
              data-decimals={decimales}
              data-prefix={prefijo ? w(prefijo) : undefined}
              data-suffix={w(`crm.cifras.${clave}Sufijo`)}
            >
              {w(`crm.cifras.${clave}`)}
            </b>
            <span>{w(`crm.cifras.${clave}Pie`)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   9 · Testimonios
============================================================ */
function Voces() {
  const { w } = useWebT();
  return (
    <section className="sec cx-voices">
      <div className="wrap">
        <h2 className="h-xl cx-voices__title" data-split="">{w("crm.voces.titulo")}</h2>
        <div className="voices" data-carousel="">
          <div className="voices__people" aria-hidden>
            {VOCES.map((n) => (
              <span className={`voices__av av av--${n}`} key={n}>{w(`crm.voces.voz${n}Ini`)}</span>
            ))}
          </div>
          <div className="voices__slides" aria-live="polite">
            {VOCES.map((n) => (
              <figure className="voice" key={n}>
                <blockquote>{w(`crm.voces.voz${n}`)}</blockquote>
                <figcaption>
                  <b>{w(`crm.voces.voz${n}Quien`)}</b>
                  <span>{w(`crm.voces.voz${n}Cargo`)}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="voices__nav">
            <button className="voices__btn" type="button" data-prev="" aria-label={w("crm.voces.anterior")}>
              <i className="i i-arrow-right flip" aria-hidden />
            </button>
            <span className="voices__count" aria-hidden><b data-current="">1</b> / {VOCES.length}</span>
            <button className="voices__btn" type="button" data-next="" aria-label={w("crm.voces.siguiente")}>
              <i className="i i-arrow-right" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   10 · Planes
============================================================ */
function Planes() {
  const { w } = useWebT();
  return (
    <section className="sec cx-plans" id="planes-resumen">
      <div className="wrap">
        <div className="sec-head sec-head--center">
          <h2 className="h-xl" data-split="">{w(segunPrueba("crm.planes.titulo"))}</h2>
          <p className="lead" data-reveal="">{w(segunPrueba("crm.planes.lead"), DIAS)}</p>
        </div>

        <div className="plans2">
          <article className="plan" data-tilt="" data-reveal="">
            <span className="glare" aria-hidden />
            <h3 className="h-md">{w("comun.nav.planBasic")}</h3>
            <p className="plan__desc">{w("crm.planes.basic.desc")}</p>
            <p className="plan__price">
              <b>{w(segunPrueba("crm.planes.basic.precio"), DIAS)}</b>
              <span>{w(segunPrueba("crm.planes.basic.precioPie"))}</span>
            </p>
            <ul className="checks">
              {[1, 2, 3, 4, 5].map((n) => <li key={n}>{w(`crm.planes.basic.check${n}`)}</li>)}
            </ul>
            <Link className="btn btn--light btn--lg btn--block" href={`${WEB.crearCuenta}?plan=basic`}>
              {w(segunPrueba("crm.planes.basic.cta"))}
            </Link>
            <p className="plan__note">{w(segunPrueba("crm.planes.basic.nota"), DIAS)}</p>
            <Link className="link-arrow plan__more" href={WEB.planBasic}>
              {w("crm.planes.verTodo")} <i className="i i-arrow-right" aria-hidden />
            </Link>
          </article>

          <article className="plan plan--pro" data-tilt="" data-reveal="" style={v({ "--i": 1 })}>
            <span className="glare" aria-hidden />
            <span className="tag tag--lime plan__badge">{w("comun.nav.masPopular")}</span>
            <h3 className="h-md">{w("comun.nav.planPro")}</h3>
            <p className="plan__desc">{w("crm.planes.pro.desc")}</p>
            <p className="plan__price">
              <b>{w(segunPrueba("crm.planes.pro.precio"), DIAS)}</b>
              <span>{w(segunPrueba("crm.planes.pro.precioPie"))}</span>
            </p>
            <ul className="checks">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <li key={n}>{w(`crm.planes.pro.check${n}`)}</li>)}
            </ul>
            <Link className="btn btn--primary btn--lg btn--block" href={`${WEB.crearCuenta}?plan=pro`}>
              {w(segunPrueba("crm.planes.pro.cta"))}
            </Link>
            <p className="plan__note">{w(segunPrueba("crm.planes.pro.nota"), DIAS)}</p>
            <Link className="link-arrow plan__more" href={WEB.planPro}>
              {w("crm.planes.verTodo")} <i className="i i-arrow-right" aria-hidden />
            </Link>
          </article>
        </div>

        <p className="cx-plans__more" data-reveal="">
          <Link className="link-arrow" href={WEB.planes}>
            {w("crm.planes.comparar")} <i className="i i-arrow-right" aria-hidden />
          </Link>
        </p>
      </div>
    </section>
  );
}

/* ============================================================
   11 · La app para empresas (se pinta con el verde de la app)
============================================================ */
function AppEmpresas() {
  const { w } = useWebT();
  return (
    <section className="sec cx-app t-app">
      <div className="wrap cx-app__grid">
        <div className="cx-app__copy">
          <h2 className="h-lg" data-split="">
            {w("crm.app.titulo")} <span className="mint">{w("crm.app.tituloClientes")}</span>
          </h2>
          <p className="lead" data-reveal="">{w("crm.app.lead")}</p>
          <ul className="checks checks--inline" data-reveal="">
            <li>{w("crm.app.check1")}</li>
            <li>{w("crm.app.check2")}</li>
            <li>{w("crm.app.check3")}</li>
            <li>{w("crm.app.check4")}</li>
          </ul>
          <div className="cx-app__stores" data-reveal=""><Tiendas /></div>
          <Link className="link-arrow" href={WEB.appEmpresas} data-reveal="">
            {w("crm.app.enlace")} <i className="i i-arrow-right" aria-hidden />
          </Link>
        </div>
        <div className="cx-app__visual" data-zoom="">
          <div className="cx-app__halo" aria-hidden />
          {/* Sin next/image a propósito: el tamaño se lo da bookmy.css */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/web/v2/img/app-phones-oscuro.webp"
            alt={w("crm.app.alt")}
            width={433}
            height={712}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   12 · Preguntas frecuentes
============================================================ */
function Preguntas() {
  const { w } = useWebT();

  /* El acordeón lo abre y lo cierra el motor por la clase .faq, igual
     que en la web estática: aquí solo va el marcado. */
  const preguntas: { pregunta: string; respuesta: ReactNode }[] = [
    { pregunta: w("crm.faq.q1"), respuesta: <p>{w("crm.faq.a1")}</p> },
    { pregunta: w("crm.faq.q2"), respuesta: <p>{w("crm.faq.a2")}</p> },
    { pregunta: w("crm.faq.q3"), respuesta: <p>{w(segunPrueba("crm.faq.a3"), DIAS)}</p> },
    { pregunta: w("crm.faq.q4"), respuesta: <p>{w("crm.faq.a4")}</p> },
    { pregunta: w("crm.faq.q5"), respuesta: <p>{w("crm.faq.a5")}</p> },
    { pregunta: w("crm.faq.q6"), respuesta: <p>{w("crm.faq.a6")}</p> },
    {
      pregunta: w("crm.faq.q7"),
      respuesta: (
        <p>
          {w("crm.faq.a7")} <Link href={WEB.asistenteIa}>{w("crm.faq.a7Enlace")}</Link>.
        </p>
      ),
    },
  ];

  return (
    <section className="sec cx-faq" id="faq">
      <div className="wrap cx-faq__grid">
        <div className="cx-faq__head">
          <h2 className="h-xl" data-split="">{w("crm.faq.titulo")}</h2>
          <p className="lead" data-reveal="">
            {w("crm.faq.lead")}{" "}
            <button className="link-arrow" type="button" data-assistant-open="">
              {w("crm.faq.leadBoton")} <i className="i i-arrow-right" aria-hidden />
            </button>
          </p>
        </div>
        <div className="faq" data-reveal="">
          {preguntas.map(({ pregunta, respuesta }) => (
            <div className="faq__item" key={pregunta}>
              <button className="faq__q" type="button">{pregunta}</button>
              <div className="faq__a"><div>{respuesta}</div></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   13 · La llamada que corona el pie
============================================================ */
function Llamada() {
  const { w } = useWebT();
  return (
    <section className="f-cta" aria-labelledby="f-cta-title">
      <div className="wrap">
        <h2 className="f-cta__title" id="f-cta-title" data-split="">
          {w("crm.cta.titulo")} <em>{w("crm.cta.tituloEm")}</em>
        </h2>
        <p className="lead" data-reveal="">{w(segunPrueba("crm.cta.lead"), DIAS)}</p>
        <div className="f-cta__actions" data-reveal="" style={v({ "--i": 1 })}>
          <Link className="btn btn--primary btn--lg" href={WEB.crearCuenta}>
            {w(segunPrueba("crm.cta.boton"), DIAS)} <i className="i i-arrow-right" aria-hidden />
          </Link>
          <button className="btn btn--ghost btn--lg" type="button" data-assistant-open="">
            {w("crm.cta.botonDudas")}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   La pantalla
============================================================ */
export default function PantallaCrm() {
  return (
    <PaginaWeb mundo="crm" pagina="crm" cta={<Llamada />}>
      <Heroe />
      <Manifiesto />
      <Confianza />
      <Modulos />
      <Flujo />
      <AsistenteIa />
      <Sectores />
      <Cifras />
      <Voces />
      <Planes />
      <AppEmpresas />
      <Preguntas />
    </PaginaWeb>
  );
}
