"use client";
/* ============================================================
   /app · la app para personas
   ------------------------------------------------------------
   El marcado de app.html de la web nueva, hecho componentes. El
   texto no está aquí: sale de src/i18n/dictionaries/web/app.es.ts
   y app.en.ts con w("app.…"), que es lo que hace que la pantalla
   sea bilingüe de verdad.

   POR QUÉ ESTO ES UN COMPONENTE DE CLIENTE Y LA PÁGINA NO
   `page.tsx` es de servidor porque tiene que exportar `metadata`,
   que en un componente de cliente Next no admite. Aquí dentro ya
   se puede usar el hook de traducción.

   LO QUE AQUÍ NO SE PROGRAMA
   Nada de lo que se mueve. El teléfono que gira con el puntero, la
   escena fijada de los cinco pasos, el conmutador de día y noche,
   el desplegable de las preguntas y las apariciones al entrar en
   pantalla los lleva el motor (src/lib/web/motor.ts) leyendo los
   atributos data-* de este marcado: data-pointer, data-scene,
   data-steps, data-step, data-theme-demo, data-mode-btn, data-tilt,
   data-split, data-reveal y las clases .faq. Si se renombra uno de
   esos atributos o se cambia el anidamiento, la página se queda
   quieta; el aspecto lo pone public/web/v2/bookmy.css, que tampoco
   se toca.

   Los `style={{ "--i": n }}` no son decoración: son el turno de
   cada pieza en la animación de entrada. Van copiados del
   original.
============================================================ */
import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import PaginaWeb from "@/components/web/PaginaWeb";
import { Tiendas } from "@/components/web/SiteFooter";
import { useWebT } from "@/components/web/useWebT";
import { FUERA, WEB } from "@/lib/web/rutas";
import { DIAS_DE_PRUEBA, SE_OFRECE_PRUEBA } from "@/lib/web/oferta";
import { formatearDinero, pais, paisProbable } from "@/lib/web/money";

const IMG = "/web/v2/img";

/** El turno de una pieza en la animación de entrada (`--i` del original). */
const ritmo = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * El importe de ejemplo de los avisos de cobro, en la moneda del
 * visitante. En el original estaba escrito a mano («33,00 €»), que a
 * quien mira desde Bogotá o desde Lima no le dice nada.
 *
 * Arranca en España, que es lo que pinta el servidor, y se corrige al
 * montar: si el país se adivinara durante el render, el HTML del
 * servidor y el del cliente no coincidirían y React se quejaría.
 */
function usePrecioDeEjemplo(): string {
  const [codigo, setCodigo] = useState("es");
  useEffect(() => setCodigo(paisProbable()), []);
  /* chips[1] es el precio de ejemplo medio de cada país (money.ts). */
  return formatearDinero(pais(codigo).chips[1], codigo);
}

/* ── Las seis capas que dan grosor al teléfono al girar ─────── */
function CapasDelTelefono() {
  return (
    <>
      {[6, 5, 4, 3, 2, 1].map((k) => (
        <span key={k} className="phone3d__layer" style={{ "--k": k } as CSSProperties} />
      ))}
    </>
  );
}

/* ============================================================
   1 · Héroe: el teléfono 3D con una órbita de avisos
============================================================ */
const ORBITA = [
  { clave: "orbita1", icono: "i-calendar-check", ib: "ib", k: 0, y: "-150px" },
  { clave: "orbita2", icono: "i-bell", ib: "ib ib--amber", k: 1, y: "40px" },
  { clave: "orbita3", icono: "i-shield", ib: "ib ib--lime", k: 2, y: "190px" },
] as const;

function Hero() {
  const { w } = useWebT();

  return (
    <section className="ap-hero" data-pointer>
      <div className="wrap ap-hero__copy">
        <h1 className="h-hero ap-hero__title" data-split>
          {w("app.hero.titulo")} <span className="mint">{w("app.hero.tituloMint")}</span>
        </h1>
        <p className="lead" data-reveal style={ritmo(5)}>{w("app.hero.lead")}</p>
        <div className="ap-hero__stores" data-reveal style={ritmo(6)}>
          <Tiendas centradas />
        </div>
      </div>

      <div className="ap-hero__stage" data-reveal="rise" style={ritmo(3)}>
        <div className="ap-hero__halo" aria-hidden />
        <div className="ap-hero__rig">
          <div className="phone3d" role="img" aria-label={w("app.hero.telefonoAlt")}>
            <CapasDelTelefono />
            <div className="phone3d__front">
              <div className="phone3d__screen">
                {/* La primera imagen de la pantalla va sin `lazy`: es lo que
                    se ve al entrar y con carga diferida parpadearía. */}
                <img
                  className="is-on"
                  src={`${IMG}/app-reserva.webp`}
                  alt=""
                  width={600}
                  height={1395}
                  fetchPriority="high"
                  decoding="async"
                />
              </div>
            </div>
            <span className="phone3d__island" aria-hidden />
            <span className="phone3d__shine" aria-hidden />
          </div>

          <div className="orbit3d" aria-hidden>
            <div className="orbit3d__ring">
              {ORBITA.map((o) => (
                <div
                  key={o.clave}
                  className="orbit3d__arm"
                  style={{ "--k": o.k, "--y": o.y } as CSSProperties}
                >
                  <div className="orbit3d__face">
                    <div className="orbit3d__chip toast">
                      <span className={o.ib}><i className={`i ${o.icono}`} aria-hidden /></span>
                      <div>
                        <b>{w(`app.hero.${o.clave}`)}</b>
                        {w(`app.hero.${o.clave}Sub`)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   2 · Cinco pasos: escena fijada, el teléfono gira y cambia de
       pantalla. El `data-step` de cada pieza es lo que empareja
       el texto, la captura y el aviso; lo enciende el motor.
============================================================ */
const PASOS = [
  { clave: "descarga", img: "app-bienvenida.webp", alto: 1299, icono: "i-download", ib: "ib", x: "-210px", y: "120px", z: "120px" },
  { clave: "entrar", img: "app-login.webp", alto: 1299, icono: "i-user-check", ib: "ib ib--cyan", x: "170px", y: "200px", z: "140px" },
  { clave: "elegir", img: "app-reserva.webp", alto: 1395, icono: "i-calendar-clock", ib: "ib", x: "-230px", y: "300px", z: "160px" },
  { clave: "pagar", img: "app-pago.webp", alto: 1395, icono: "i-credit-card", ib: "ib ib--lime", x: "160px", y: "380px", z: "150px" },
  { clave: "confirmar", img: "app-confirmada.webp", alto: 1395, icono: "i-check", ib: "ib ib--solid", x: "-200px", y: "440px", z: "170px" },
] as const;

function Pasos({ precio }: { precio: string }) {
  const { w } = useWebT();

  return (
    <section className="ap-steps" id="pasos" data-scene="app-steps" data-steps="5">
      <div className="ap-steps__stick">
        <div className="wrap ap-steps__grid">
          <div className="ap-steps__copy">
            <h2 className="h-lg ap-steps__title" data-split>{w("app.pasos.titulo")}</h2>

            <ol className="ap-steps__list">
              {PASOS.map((p, i) => (
                <li key={p.clave} className={i === 0 ? "ap-step is-on" : "ap-step"} data-step={i}>
                  {/* Esta captura solo se ve en móvil, donde la escena
                      fijada no existe y cada paso lleva la suya al lado. */}
                  <img
                    className="ap-step__img"
                    src={`${IMG}/${p.img}`}
                    alt={w(`app.pasos.${p.clave}.alt`)}
                    width={600}
                    height={p.alto}
                    loading="lazy"
                    decoding="async"
                  />
                  <h3 className="h-md">{w(`app.pasos.${p.clave}.titulo`)}</h3>
                  <p>{w(`app.pasos.${p.clave}.texto`)}</p>
                  <ul className="checks checks--inline">
                    <li>{w(`app.pasos.${p.clave}.check1`)}</li>
                    <li>{w(`app.pasos.${p.clave}.check2`)}</li>
                  </ul>
                </li>
              ))}
            </ol>

            <div className="ap-steps__rail" aria-hidden>
              <span className="ap-steps__fill" />
              {PASOS.map((p, i) => (
                <i key={p.clave} data-step={i} className={i === 0 ? "is-on" : undefined} />
              ))}
            </div>
          </div>

          {/* El escenario es decorativo: lo que cuenta el paso ya está
              escrito a la izquierda, así que aquí no hay nada que leer. */}
          <div className="ap-steps__stage" aria-hidden>
            <div className="ap-steps__halo" />
            <div className="ap-steps__rig">
              <div className="phone3d phone3d--lg">
                <CapasDelTelefono />
                <div className="phone3d__front">
                  <div className="phone3d__screen">
                    {PASOS.map((p, i) => (
                      <img
                        key={p.clave}
                        data-step={i}
                        className={i === 0 ? "is-on" : undefined}
                        src={`${IMG}/${p.img}`}
                        alt=""
                        width={600}
                        height={p.alto}
                        loading="lazy"
                        decoding="async"
                      />
                    ))}
                  </div>
                </div>
                <span className="phone3d__island" />
                <span className="phone3d__shine" />
              </div>

              {PASOS.map((p, i) => (
                <div
                  key={p.clave}
                  className={i === 0 ? "ap-chip toast is-on" : "ap-chip toast"}
                  data-step={i}
                  style={{ "--x": p.x, "--y": p.y, "--z": p.z } as CSSProperties}
                >
                  <span className={p.ib}><i className={`i ${p.icono}`} aria-hidden /></span>
                  <div>
                    <b>{w(`app.pasos.${p.clave}.chip`)}</b>
                    {w(`app.pasos.${p.clave}.chipSub`, { precio })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   3 · Las ocho ventajas
============================================================ */
const VENTAJAS = [
  { clave: "centro", icono: "i-map-pin" },
  { clave: "especialista", icono: "i-user-check" },
  { clave: "huecos", icono: "i-calendar-clock" },
  { clave: "pago", icono: "i-wallet" },
  { clave: "confirmacion", icono: "i-badge-check" },
  { clave: "recordatorios", icono: "i-bell" },
  { clave: "cambios", icono: "i-refresh" },
  { clave: "historial", icono: "i-star" },
] as const;

function Ventajas() {
  const { w } = useWebT();

  return (
    <section className="sec ap-feats-sec">
      <div className="wrap">
        <div className="sec-head sec-head--split">
          <h2 className="h-xl" data-split>
            {w("app.ventajas.titulo")} <span className="stroke">{w("app.ventajas.tituloStroke")}</span>
          </h2>
          <p className="lead" data-reveal>{w("app.ventajas.lead")}</p>
        </div>

        <ul className="ap-feats">
          {VENTAJAS.map((v, i) => {
            /* Las tarjetas aparecen por filas de cuatro: la primera de
               cada fila sin retraso y las otras tres detrás. */
            const turno = i % 4;
            return (
              <li
                key={v.clave}
                className="feat"
                data-tilt
                data-reveal
                style={turno ? ritmo(turno) : undefined}
              >
                <span className="glare" aria-hidden />
                <span className="feat__lens"><i className={`i ${v.icono}`} aria-hidden /></span>
                <h3 className="h-sm">{w(`app.ventajas.${v.clave}Titulo`)}</h3>
                <p>{w(`app.ventajas.${v.clave}Texto`)}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ============================================================
   4 · Día y noche: el conmutador que cambia la escena. Los dos
       botones no llevan onClick: los engancha el motor por
       data-theme-demo / data-mode-btn, que es también quien
       mueve el `data-mode` del que depende todo el CSS.
============================================================ */
function DiaYNoche() {
  const { w } = useWebT();

  return (
    <section className="sec ap-theme" data-theme-demo data-mode="dark">
      <div className="ap-theme__sky" aria-hidden />
      <div className="wrap ap-theme__grid">
        <div className="ap-theme__copy">
          <h2 className="h-xl" data-split>
            {w("app.tema.titulo")} <span className="mint">{w("app.tema.tituloMint")}</span>
          </h2>
          <p className="lead" data-reveal>{w("app.tema.lead")}</p>

          <div className="modes" role="group" aria-label={w("app.tema.grupoEtiqueta")} data-reveal>
            <button type="button" data-mode-btn="light" aria-pressed={false}>
              <i className="i i-sun" aria-hidden />
              {w("app.tema.claro")}
            </button>
            <button type="button" data-mode-btn="dark" aria-pressed>
              <i className="i i-moon" aria-hidden />
              {w("app.tema.oscuro")}
            </button>
            <span className="modes__ind" aria-hidden />
          </div>

          <ul className="checks" data-reveal>
            <li>{w("app.tema.check1")}</li>
            <li>{w("app.tema.check2")}</li>
            <li>{w("app.tema.check3")}</li>
          </ul>
        </div>

        <div className="ap-theme__stage" data-tilt="9">
          <span className="glare" aria-hidden />
          <img
            className="ap-theme__img ap-theme__img--light"
            src={`${IMG}/app-phones-claro.webp`}
            alt={w("app.tema.altClaro")}
            width={731}
            height={836}
            loading="lazy"
            decoding="async"
          />
          <img
            className="ap-theme__img ap-theme__img--dark"
            src={`${IMG}/app-phones-oscuro.webp`}
            alt={w("app.tema.altOscuro")}
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
   5 · ¿Tienes un negocio? El puente al mundo de las empresas.

   AQUÍ ESTÁ LA PROMESA DE LA PRUEBA GRATUITA DE ESTA PANTALLA
   Es el único sitio de la página que le habla a un negocio, así
   que es el único que podría prometerle la prueba de Pro. Y no se
   escribe: la decide SE_OFRECE_PRUEBA (src/lib/web/oferta.ts).
   Hoy está en false —el backend no concede ninguna prueba y los
   cobros todavía no funcionan—, así que se enseña el texto SIN
   prueba. Los días nunca van a mano: salen de DIAS_DE_PRUEBA.
============================================================ */
const AVISOS = [
  { clave: "feedReserva", icono: "i-calendar-check", ib: "ib", tag: "tag" },
  { clave: "feedPago", icono: "i-credit-card", ib: "ib ib--lime", tag: "tag tag--lime" },
  { clave: "feedAviso", icono: "i-bell", ib: "ib ib--amber", tag: "tag" },
  { clave: "feedCliente", icono: "i-users", ib: "ib ib--cyan", tag: "tag" },
] as const;

function Negocio({ precio }: { precio: string }) {
  const { w } = useWebT();

  const entrada = SE_OFRECE_PRUEBA
    ? w("app.negocio.leadConPrueba", { dias: DIAS_DE_PRUEBA })
    : w("app.negocio.leadSinPrueba");

  return (
    <section className="sec ap-biz">
      <div className="wrap ap-biz__grid">
        <div className="ap-biz__copy">
          <h2 className="h-lg" data-split>
            {w("app.negocio.titulo")} <span className="mint">{w("app.negocio.tituloMint")}</span>
          </h2>
          <p className="lead" data-reveal>{entrada}</p>
          <div className="ap-biz__cta" data-reveal>
            <Link className="btn btn--primary btn--lg" href={WEB.appEmpresas}>
              {w("app.negocio.ctaEmpresas")} <i className="i i-arrow-right" aria-hidden />
            </Link>
            <Link className="btn btn--ghost btn--lg" href={WEB.crearCuenta}>
              {w("app.negocio.ctaRegistrar")}
            </Link>
          </div>
        </div>

        <div className="ap-biz__flow" aria-hidden>
          <div className="beam">
            <span className="beam__node"><i className="i i-smartphone" aria-hidden />{w("app.negocio.beamApp")}</span>
            <span className="beam__line"><i /><i /><i /><i /></span>
            <span className="beam__node beam__node--crm t-crm">
              <i className="i i-grid" aria-hidden />
              {w("app.negocio.beamNegocio")}
            </span>
          </div>

          <div className="feed">
            {AVISOS.map((a, i) => (
              <div key={a.clave} className="toast" data-reveal style={i ? ritmo(i) : undefined}>
                <span className={a.ib}><i className={`i ${a.icono}`} aria-hidden /></span>
                <div>
                  <b>{w(`app.negocio.${a.clave}Titulo`)}</b>
                  {w(`app.negocio.${a.clave}Sub`, { precio })}
                </div>
                <span className={a.tag}>{w(`app.negocio.${a.clave}Tag`)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   6 · Preguntas frecuentes. El desplegable, los identificadores
       y el icono «+» los pone el motor sobre .faq / .faq__item;
       el botón del asistente no lleva onClick porque lo engancha
       el propio asistente por data-assistant-open.
============================================================ */
const PREGUNTAS = ["gratis", "reservar", "profesional", "confirmada", "pagar", "cambiar", "social"] as const;

function Preguntas() {
  const { w } = useWebT();

  return (
    <section className="sec cx-faq" id="faq">
      <div className="wrap cx-faq__grid">
        <div className="cx-faq__head">
          <h2 className="h-xl" data-split>{w("app.faq.titulo")}</h2>
          <p className="lead" data-reveal>
            {w("app.faq.otraPregunta")}{" "}
            <button className="link-arrow" type="button" data-assistant-open>
              {w("app.faq.asistente")} <i className="i i-arrow-right" aria-hidden />
            </button>
          </p>
        </div>

        <div className="faq" data-reveal>
          {PREGUNTAS.map((p) => (
            <div className="faq__item" key={p}>
              <button className="faq__q" type="button">{w(`app.faq.${p}Q`)}</button>
              <div className="faq__a"><div><p>{w(`app.faq.${p}A`)}</p></div></div>
            </div>
          ))}

          {/* La del APK lleva el enlace de descarga dentro de la
              respuesta, así que el texto va en tres trozos. */}
          <div className="faq__item">
            <button className="faq__q" type="button">{w("app.faq.apkQ")}</button>
            <div className="faq__a">
              <div>
                <p>
                  {w("app.faq.apkA1")}{" "}
                  <a href={FUERA.apk} download type="application/vnd.android.package-archive">
                    {w("app.faq.apkEnlace")}
                  </a>{" "}
                  {w("app.faq.apkA2")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   El bloque que corona el pie. El id="descargar" NO es decorativo:
   es el ancla que enlazan el botón «Descargar» de la cabecera, el
   pie del desplegable de la app y el menú de móvil. Si desaparece,
   esos tres enlaces dejan de llevar a ningún sitio.
============================================================ */
function BloqueDescarga() {
  const { w } = useWebT();

  return (
    <section className="f-cta" id="descargar" aria-labelledby="f-cta-title">
      <div className="wrap">
        <h2 className="f-cta__title" id="f-cta-title" data-split>
          {w("app.cta.titulo")} <em>{w("app.cta.tituloEm")}</em>
        </h2>
        <p className="lead" data-reveal>{w("app.cta.lead")}</p>
        <div className="f-cta__actions" data-reveal style={ritmo(1)}>
          <Tiendas centradas />
        </div>
      </div>
    </section>
  );
}

export default function PantallaApp() {
  const precio = usePrecioDeEjemplo();

  return (
    <PaginaWeb mundo="app" pagina="app" cta={<BloqueDescarga />}>
      <Hero />
      <Pasos precio={precio} />
      <Ventajas />
      <DiaYNoche />
      <Negocio precio={precio} />
      <Preguntas />
    </PaginaWeb>
  );
}
