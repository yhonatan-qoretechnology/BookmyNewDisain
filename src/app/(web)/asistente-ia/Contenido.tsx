"use client";
/* ============================================================
   /asistente-ia · el cuerpo de la pantalla
   ------------------------------------------------------------
   Puerto de asistente-ia.html. Va aparte de page.tsx porque ahí
   vive el `metadata` de Next, que solo puede exportarlo un
   componente de servidor, y todo el texto de aquí sale de
   useWebT, que es un hook de cliente.

   ESTA PÁGINA NO ES EL ASISTENTE
   Solo lo explica. El widget que conversa de verdad es
   components/web/Asistente, y se abre con los botones que llevan
   `data-assistant-open`: ese atributo es todo el enganche, no hay
   ningún onClick, igual que en el pie. Así esta pantalla no
   necesita conocerlo ni montarlo.

   LO QUE NO SE PUEDE TOCAR DEL MARCADO
   Las clases son las de public/web/v2/bookmy.css y los atributos
   data-* son los que lee el motor (src/lib/web/motor.ts):

     data-split      parte el titular en palabras y las entra
     data-reveal     entrada al aparecer; ="scale" entra creciendo
     data-tilt       la tarjeta se inclina con el puntero
     data-sculpture  la nube de partículas del héroe (+ size,
                     spin, extent y tilt, que son sus mandos)
     data-chat-demo  escribe la conversación sola, mensaje a
                     mensaje; data-annots la ata a la lista de
                     anotaciones por id y cada data-annot dice
                     cuál se enciende; data-chat-replay la repite

   Los style="--i:N" son el ritmo: cada hermano entra un poco más
   tarde. Se conservan uno a uno, también donde el original no los
   pone (ahí no va atributo, no va --i:0).
============================================================ */
import type { CSSProperties } from "react";
import Link from "next/link";
import PaginaWeb from "@/components/web/PaginaWeb";
import { useWebT } from "@/components/web/useWebT";
import { WEB } from "@/lib/web/rutas";
import { DIAS_DE_PRUEBA, SE_OFRECE_PRUEBA } from "@/lib/web/oferta";
import { formatearDinero } from "@/lib/web/money";

/** El style="--i:N" del original, que es el ritmo de la animación. */
const ritmo = (n: number) => ({ "--i": n }) as CSSProperties;

/** Un elemento de lista: su grupo de claves, su icono y su turno. */
type Bloque = { clave: string; icono: string; paso?: number };

/* Las cuatro anotaciones que se encienden al compás del chat. El
   orden es el que cuenta: data-annot de cada mensaje es su índice. */
const ANOTACIONES: Bloque[] = [
  { clave: "nota1", icono: "i-user-check" },
  { clave: "nota2", icono: "i-calendar-clock" },
  { clave: "nota3", icono: "i-trending-up" },
  { clave: "nota4", icono: "i-badge-check" },
];

/* Los ocho trabajos. El ritmo se reinicia en el quinto porque la
   rejilla los enseña en dos filas de cuatro. */
const TRABAJOS: Bloque[] = [
  { clave: "t1", icono: "i-clock" },
  { clave: "t2", icono: "i-calendar-check", paso: 1 },
  { clave: "t3", icono: "i-gift", paso: 2 },
  { clave: "t4", icono: "i-calendar-clock", paso: 3 },
  { clave: "t5", icono: "i-refresh" },
  { clave: "t6", icono: "i-star", paso: 1 },
  { clave: "t7", icono: "i-bar-chart", paso: 2 },
  { clave: "t8", icono: "i-headphones", paso: 3 },
];

/** Las cinco paradas del recorrido de un cliente. */
const TUBERIA: Bloque[] = [
  { clave: "p1", icono: "i-target" },
  { clave: "p2", icono: "i-calendar-check" },
  { clave: "p3", icono: "i-trending-up" },
  { clave: "p4", icono: "i-heart" },
  { clave: "p5", icono: "i-refresh" },
];

/** Las tres conversaciones de muestra. `asistente` es la burbuja propia. */
type Convo = Bloque & { variante?: string; mensajes: { clave: string; asistente: boolean }[] };

const CONVOS: Convo[] = [
  {
    clave: "c1",
    icono: "i-refresh",
    mensajes: [
      { clave: "c1Asistente", asistente: true },
      { clave: "c1Cliente", asistente: false },
    ],
  },
  {
    clave: "c2",
    icono: "i-calendar-clock",
    variante: " ib--amber",
    paso: 1,
    mensajes: [
      { clave: "c2Asistente", asistente: true },
      { clave: "c2Cliente", asistente: false },
    ],
  },
  {
    /* Esta empieza al contrario: pregunta el dueño y responde el asistente. */
    clave: "c3",
    icono: "i-bar-chart",
    variante: " ib--lime",
    paso: 2,
    mensajes: [
      { clave: "c3Cliente", asistente: false },
      { clave: "c3Asistente", asistente: true },
    ],
  },
];

/** La comparación. `chatbot` es si un chatbot cualquiera también lo hace. */
const FILAS: { clave: string; chatbot: boolean }[] = [
  { clave: "f1", chatbot: true },
  { clave: "f2", chatbot: true },
  { clave: "f3", chatbot: false },
  { clave: "f4", chatbot: false },
  { clave: "f5", chatbot: false },
  { clave: "f6", chatbot: false },
  { clave: "f7", chatbot: false },
  { clave: "f8", chatbot: true },
];

/** Las cuatro garantías de control y confianza. */
const GARANTIAS: Bloque[] = [
  { clave: "g1", icono: "i-sliders" },
  { clave: "g2", icono: "i-eye", paso: 1 },
  { clave: "g3", icono: "i-lock", paso: 2 },
  { clave: "g4", icono: "i-handshake", paso: 3 },
];

/** Los tres pasos de la puesta en marcha. */
const PUESTA_EN_MARCHA: Bloque[] = [
  { clave: "s1", icono: "i-list-checks" },
  { clave: "s2", icono: "i-sliders", paso: 1 },
  { clave: "s3", icono: "i-rocket", paso: 2 },
];

/* ============================================================
   Los importes del ejemplo
   ------------------------------------------------------------
   El original escribía «8 €», «33 €» y «7.820 €» a mano. Aquí los
   números viven arriba y el formato lo pone money.ts, así que no
   hay un euro suelto dentro de una frase traducida.

   El total NO se escribe: es la manicura más el extra. Así los dos
   mensajes de la conversación siempre cuadran entre sí, que es de
   lo que iba el ejemplo.

   El país es España a propósito y no el del visitante: la
   conversación es de un estudio español con nombre y empleadas, no
   la cuenta de quien está mirando la página.
============================================================ */
const PAIS_DEL_EJEMPLO = "es";
const PRECIO_MANICURA = 25;
const PRECIO_DEL_EXTRA = 8;
const FACTURADO_EN_EL_MES = 7820;

/* Con prueba o sin ella, el mismo sitio dice dos cosas distintas.
   Lo decide SE_OFRECE_PRUEBA (src/lib/web/oferta.ts), que hoy está
   apagado porque el alta no concede ninguna prueba y los cobros no
   funcionan todavía. El enlace también cambia: sin prueba no tiene
   sentido llevar al alta con el plan Pro ya elegido. */
const PROMESA = SE_OFRECE_PRUEBA
  ? {
      alta: `${WEB.crearCuenta}?plan=pro`,
      heroCta: "asistenteIa.hero.ctaConPrueba",
      ctaLead: "asistenteIa.cta.leadConPrueba",
      ctaBoton: "asistenteIa.cta.botonConPrueba",
    }
  : {
      alta: WEB.crearCuenta,
      heroCta: "asistenteIa.hero.ctaSinPrueba",
      ctaLead: "asistenteIa.cta.leadSinPrueba",
      ctaBoton: "asistenteIa.cta.botonSinPrueba",
    };

export default function Contenido() {
  const { w } = useWebT();
  const dias = { dias: DIAS_DE_PRUEBA };

  const precio = formatearDinero(PRECIO_DEL_EXTRA, PAIS_DEL_EJEMPLO);
  const total = formatearDinero(PRECIO_MANICURA + PRECIO_DEL_EXTRA, PAIS_DEL_EJEMPLO);
  const importe = formatearDinero(FACTURADO_EN_EL_MES, PAIS_DEL_EJEMPLO);

  /* El cierre que corona el pie: distinto en cada pantalla, así que
     lo pone la pantalla y no SiteFooter. */
  const cta = (
    <section className="f-cta" aria-labelledby="f-cta-title">
      <div className="wrap">
        <h2 className="f-cta__title" id="f-cta-title" data-split>
          {w("asistenteIa.cta.titulo1")} <em>{w("asistenteIa.cta.titulo2")}</em>
        </h2>
        <p className="lead" data-reveal>{w(PROMESA.ctaLead, dias)}</p>
        <div className="f-cta__actions" data-reveal style={ritmo(1)}>
          <Link className="btn btn--primary btn--lg" href={PROMESA.alta}>
            {w(PROMESA.ctaBoton, dias)} <i className="i i-arrow-right" aria-hidden />
          </Link>
          <button className="btn btn--ghost btn--lg" type="button" data-assistant-open>
            {w("asistenteIa.cta.botonAsistente")}
          </button>
        </div>
      </div>
    </section>
  );

  return (
    <PaginaWeb mundo="crm" pagina="asistente-ia" cta={cta}>
      {/* ── 1 · Héroe: núcleo de partículas ─────────────────── */}
      <section className="ia-hero" aria-labelledby="ia-title">
        <div className="ia-hero__core" aria-hidden>
          <canvas data-sculpture="core" data-size="1.7" data-spin=".18" data-extent="1.22" data-tilt=".35" />
        </div>
        <div className="wrap ia-hero__copy">
          <h1 className="h-hero ia-hero__title" id="ia-title" data-split>
            {w("asistenteIa.hero.titulo1")} <span className="mint">{w("asistenteIa.hero.titulo2")}</span>
          </h1>
          <p className="lead" data-reveal style={ritmo(4)}>{w("asistenteIa.hero.lead")}</p>
          <div className="ia-hero__cta" data-reveal style={ritmo(5)}>
            <Link className="btn btn--primary btn--lg" href={PROMESA.alta}>
              {w(PROMESA.heroCta, dias)} <i className="i i-arrow-right" aria-hidden />
            </Link>
            <button className="btn btn--ghost btn--lg" type="button" data-assistant-open>
              {w("asistenteIa.hero.ctaAsistente")}
            </button>
          </div>
        </div>
      </section>

      {/* ── 2 · Así trabaja: conversación con anotaciones ───── */}
      <section className="sec">
        <div className="wrap ia-demo">
          <div className="ia-demo__copy">
            <h2 className="h-lg" data-split>
              {w("asistenteIa.demo.titulo1")} <span className="mint">{w("asistenteIa.demo.titulo2")}</span>
            </h2>
            <p className="lead" data-reveal>{w("asistenteIa.demo.lead")}</p>
            <ol className="annots" id="annot-demo" data-reveal>
              {ANOTACIONES.map((a) => (
                <li key={a.clave}>
                  <i className={`i ${a.icono}`} aria-hidden />
                  <div>
                    <b>{w(`asistenteIa.demo.${a.clave}Titulo`)}</b>
                    <p>{w(`asistenteIa.demo.${a.clave}Texto`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="ia-demo__stage" data-reveal="scale">
            <div className="chat3d" data-tilt>
              <span className="glare" aria-hidden />
              <div
                className="chat chat--tall"
                data-chat-demo
                data-annots="annot-demo"
                aria-label={w("asistenteIa.demo.chatEtiqueta")}
              >
                <div className="chat__head">
                  <span className="orb-av" aria-hidden />
                  <div>
                    <b>{w("asistenteIa.demo.chatNegocio")}</b>
                    <small>{w("asistenteIa.demo.chatEstado")}</small>
                  </div>
                  <button className="chat__replay" type="button" data-chat-replay>
                    <i className="i i-rotate-ccw" aria-hidden />
                    <span className="sr-only">{w("asistenteIa.demo.chatRepetir")}</span>
                  </button>
                </div>
                <div className="chat__log">
                  <p className="bubble">{w("asistenteIa.demo.msg1")}</p>
                  <p className="bubble bubble--out" data-annot="0">
                    {w("asistenteIa.demo.msg2")}
                    <span className="bubble__note">
                      <i className="i i-user-check" aria-hidden />
                      {w("asistenteIa.demo.msg2Nota")}
                    </span>
                  </p>
                  <p className="bubble">{w("asistenteIa.demo.msg3")}</p>
                  <p className="bubble bubble--out" data-annot="1">{w("asistenteIa.demo.msg4")}</p>
                  <p className="bubble">{w("asistenteIa.demo.msg5")}</p>
                  <p className="bubble bubble--out" data-annot="2">
                    {w("asistenteIa.demo.msg6", { precio })}
                    <span className="bubble__note">
                      <i className="i i-sparkles" aria-hidden />
                      {w("asistenteIa.demo.msg6Nota")}
                    </span>
                  </p>
                  <p className="bubble">{w("asistenteIa.demo.msg7")}</p>
                  <p className="bubble bubble--out" data-annot="3">
                    {w("asistenteIa.demo.msg8", { total })}
                    <span className="bubble__note">
                      <i className="i i-bell" aria-hidden />
                      {w("asistenteIa.demo.msg8Nota")}
                    </span>
                  </p>
                  <span className="typing" aria-hidden><i /><i /><i /></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 · Ocho trabajos ───────────────────────────────── */}
      <section className="sec">
        <div className="wrap">
          <div className="sec-head sec-head--split">
            <h2 className="h-xl" data-split>{w("asistenteIa.trabajos.titulo")}</h2>
            <p className="lead" data-reveal>{w("asistenteIa.trabajos.lead")}</p>
          </div>
          <ul className="ap-feats">
            {TRABAJOS.map((t) => (
              <li
                className="feat"
                key={t.clave}
                data-tilt
                data-reveal
                style={t.paso === undefined ? undefined : ritmo(t.paso)}
              >
                <span className="glare" aria-hidden />
                <span className="feat__lens"><i className={`i ${t.icono}`} aria-hidden /></span>
                <h3 className="h-sm">{w(`asistenteIa.trabajos.${t.clave}Titulo`)}</h3>
                <p>{w(`asistenteIa.trabajos.${t.clave}Texto`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 4 · Cómo vende: la tubería y tres conversaciones ── */}
      <section className="sec">
        <div className="wrap">
          <div className="sec-head sec-head--center">
            <h2 className="h-lg" data-split>
              {w("asistenteIa.flujo.titulo1")} <span className="mint">{w("asistenteIa.flujo.titulo2")}</span>
            </h2>
          </div>
          <ol className="pipe" data-reveal>
            {TUBERIA.map((p) => (
              <li key={p.clave}>
                <span className="pipe__node"><i className={`i ${p.icono}`} aria-hidden /></span>
                <b>{w(`asistenteIa.flujo.${p.clave}Titulo`)}</b>
                <p>{w(`asistenteIa.flujo.${p.clave}Texto`)}</p>
              </li>
            ))}
          </ol>
          <div className="convos">
            {CONVOS.map((c) => (
              <figure
                className="convo"
                key={c.clave}
                data-tilt
                data-reveal
                style={c.paso === undefined ? undefined : ritmo(c.paso)}
              >
                <span className="glare" aria-hidden />
                <figcaption>
                  <span className={`ib ib--sm${c.variante ?? ""}`}><i className={`i ${c.icono}`} aria-hidden /></span>
                  {w(`asistenteIa.flujo.${c.clave}Titulo`)}
                </figcaption>
                {c.mensajes.map((m) => (
                  <p className={m.asistente ? "bubble bubble--out" : "bubble"} key={m.clave}>
                    {w(`asistenteIa.flujo.${m.clave}`, { importe })}
                  </p>
                ))}
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5 · La diferencia con un chatbot ────────────────── */}
      <section className="sec">
        <div className="wrap">
          <div className="sec-head sec-head--center">
            <h2 className="h-xl" data-split>
              {w("asistenteIa.diferencia.titulo1")}{" "}
              <span className="mint">{w("asistenteIa.diferencia.titulo2")}</span>
            </h2>
          </div>
          <div className="compare-wrap" data-reveal>
            <table className="compare">
              <caption className="sr-only">{w("asistenteIa.diferencia.resumen")}</caption>
              <colgroup><col /><col /><col /></colgroup>
              <thead>
                <tr>
                  <th scope="col">{w("asistenteIa.diferencia.colTrabajo")}</th>
                  <th scope="col">{w("asistenteIa.diferencia.colChatbot")}</th>
                  <th scope="col" className="hl">{w("asistenteIa.diferencia.colBookmy")}</th>
                </tr>
              </thead>
              <tbody>
                {FILAS.map((f) => (
                  <tr key={f.clave}>
                    <td>{w(`asistenteIa.diferencia.${f.clave}`)}</td>
                    {f.chatbot ? (
                      <td className="yes"><i className="i i-check" aria-label={w("asistenteIa.diferencia.si")} /></td>
                    ) : (
                      <td className="no"><i className="i i-minus" aria-label={w("asistenteIa.diferencia.no")} /></td>
                    )}
                    <td className="yes hl"><i className="i i-check" aria-label={w("asistenteIa.diferencia.si")} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 6 · Control y confianza ─────────────────────────── */}
      <section className="sec">
        <div className="wrap">
          <div className="sec-head sec-head--split">
            <h2 className="h-lg" data-split>{w("asistenteIa.control.titulo")}</h2>
            <p className="lead" data-reveal>{w("asistenteIa.control.lead")}</p>
          </div>
          <ul className="who__grid">
            {GARANTIAS.map((g) => (
              <li key={g.clave} data-reveal style={g.paso === undefined ? undefined : ritmo(g.paso)}>
                <i className={`i ${g.icono}`} aria-hidden />
                <h3 className="h-sm">{w(`asistenteIa.control.${g.clave}Titulo`)}</h3>
                <p>{w(`asistenteIa.control.${g.clave}Texto`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 7 · Puesta en marcha ────────────────────────────── */}
      <section className="sec">
        <div className="wrap">
          <div className="sec-head sec-head--center">
            <h2 className="h-xl" data-split>{w("asistenteIa.pasos.titulo")}</h2>
          </div>
          <ol className="trio">
            {PUESTA_EN_MARCHA.map((s) => (
              <li
                className="trio__item"
                key={s.clave}
                data-reveal
                style={s.paso === undefined ? undefined : ritmo(s.paso)}
              >
                <span className="trio__ic" aria-hidden><i className={`i ${s.icono}`} /></span>
                <h3 className="h-md">{w(`asistenteIa.pasos.${s.clave}Titulo`)}</h3>
                <p>{w(`asistenteIa.pasos.${s.clave}Texto`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </PaginaWeb>
  );
}
