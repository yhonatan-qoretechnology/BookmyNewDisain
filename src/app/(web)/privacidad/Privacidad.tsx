"use client";
/* ============================================================
   /privacidad — la política de privacidad
   ------------------------------------------------------------
   Paso a Next de privacidad.html del diseño 2.0. El árbol es el
   del original clase por clase y atributo por atributo: la
   portada (.legal-hero), el índice lateral y los doce apartados
   numerados dentro de un <article class="prose">.

   EL ÍNDICE LATERAL NO ES DECORACIÓN
   El <nav class="legal__toc" data-toc> con enlaces «#id» es de
   donde vive el seguidor de lectura: src/lib/web/motor.ts busca
   ese data-toc, empareja cada enlace con la <section> de ese id y
   le pone `is-active` según bajas. Si se le cambia la estructura
   o se pierde un id, el índice deja de seguir la lectura.

   LOS id DE LOS APARTADOS SON PARTE DEL CONTRATO
   Además del índice, hay dos sitios que enlazan a
   /privacidad#asistente (el apartado 5): la pantalla
   /asistente-ia y el propio chat, por `privacidadAsistente` en
   src/lib/web/asistente/guion.ts. Renombrar ese id rompe los dos.

   ESTO ES UN TEXTO LEGAL, NO MARKETING
   Todas las frases salen de privacidad.es.ts / privacidad.en.ts,
   donde el español está portado palabra por palabra del original
   (ver la cabecera de ese archivo). Aquí no se escribe ni una, y
   lo único que hay escrito a mano son DATOS que no se traducen: el
   correo, el teléfono y la dirección de la AEPD.

   LOS HUECOS EN ÁMBAR SON DEL ORIGINAL
   Los <mark class="fill"> con texto entre corchetes son los datos
   de la empresa que todavía faltan (razón social, NIF, domicilio,
   correo del DPD) y la duda sobre el papel de Qore Technology. El
   diseño los pinta en ámbar justo para que canten: no son un
   despiste del paso a Next.

   Es de cliente porque el texto sale del hook useWebT y porque
   <PaginaWeb> arranca el motor; los metadatos los exporta el
   page.tsx de al lado, que es de servidor.
============================================================ */
import type { CSSProperties } from "react";
import Link from "next/link";
import PaginaWeb from "@/components/web/PaginaWeb";
import { useWebT } from "@/components/web/useWebT";
import { FUERA, WEB } from "@/lib/web/rutas";
import { DIAS_DE_PRUEBA, SE_OFRECE_PRUEBA } from "@/lib/web/oferta";

/** El `style="--i:3"` del original: el turno en el que entra cada bloque. */
const ritmo = (i: number) => ({ "--i": i }) as CSSProperties;

/* Datos de contacto del responsable. No pasan por el diccionario
   porque no se traducen: el correo es el mismo de todo el sitio y el
   teléfono es el número de FUERA.whatsapp escrito para leerlo. */
const CORREO = "contacto@bookmy.es";
const TELEFONO = "+34 651 026 700";

/* La autoridad de control ante la que se reclama. El texto del
   enlace es el dominio, así que tampoco se traduce. */
const AEPD = "https://www.aepd.es";
const AEPD_DOMINIO = "www.aepd.es";

/** Los doce apartados, en orden: el id de cada <section> es también
    la clave de su título y la de su línea en el índice. */
const APARTADOS = [
  "responsable",
  "alcance",
  "datos",
  "finalidades",
  "asistente",
  "destinatarios",
  "transferencias",
  "conservacion",
  "derechos",
  "menores",
  "seguridad",
  "cambios",
] as const;

/* Los puntos del apartado 2. El del CRM mencionaba la prueba de
   siete días, así que su texto tiene dos versiones (ver oferta.ts). */
const ALCANCE: { clave: string; prueba?: boolean }[] = [
  { clave: "web" },
  { clave: "crm", prueba: true },
  { clave: "app" },
  { clave: "cliente" },
];

/** Los seis tipos de dato del apartado 3. */
const DATOS = ["contacto", "negocio", "uso", "tecnicos", "chat", "pago"];

/** Los cuatro puntos del asistente (apartado 5). */
const ASISTENTE = ["que", "donde", "ia", "derechos"];

/** Los siete derechos del apartado 9. */
const DERECHOS = [
  "acceso",
  "rectificacion",
  "supresion",
  "oposicion",
  "limitacion",
  "portabilidad",
  "consentimiento",
];

export default function Privacidad() {
  const { w } = useWebT();
  /* Atajo para no arrastrar "privacidad." por doscientas líneas. */
  const txt = (clave: string, vars?: Record<string, string | number>) => w(`privacidad.${clave}`, vars);
  /** Los textos que van por parejas: con la prueba prometida o sin ella. */
  const promesa = (clave: string) =>
    txt(`${clave}${SE_OFRECE_PRUEBA ? "ConPrueba" : "SinPrueba"}`, { dias: DIAS_DE_PRUEBA });

  /* El correo de ejercicio de derechos lleva el asunto ya puesto, como
     en el original. Va traducido porque la misma frase del apartado 9
     pide usar ese asunto, y los dos tienen que decir lo mismo. */
  const asunto = txt("asunto");
  const correoDerechos = `mailto:${CORREO}?subject=${encodeURIComponent(asunto)}`;

  /* La llamada a la acción que corona el pie: es la de esta pantalla,
     así que la pone la pantalla y no <SiteFooter>. */
  const cta = (
    <section className="f-cta" aria-labelledby="f-cta-title">
      <div className="wrap">
        <h2 className="f-cta__title" id="f-cta-title" data-split>
          {txt("cta.titulo")} <em>{txt("cta.tituloEm")}</em>
        </h2>
        <p className="lead" data-reveal>{promesa("cta.lead")}</p>
        <div className="f-cta__actions" data-reveal style={ritmo(1)}>
          <Link className="btn btn--primary btn--lg" href={WEB.crearCuenta}>
            {promesa("cta.boton")} <i className="i i-arrow-right" aria-hidden />
          </Link>
          {/* Sin onClick: lo engancha el asistente por data-assistant-open,
              igual que en la web estática. */}
          <button className="btn btn--ghost btn--lg" type="button" data-assistant-open>
            {txt("cta.botonDudas")}
          </button>
        </div>
      </div>
    </section>
  );

  return (
    <PaginaWeb mundo="crm" pagina="privacidad" cta={cta}>
      {/* ── Portada ───────────────────────────────────────────── */}
      <section className="legal-hero" aria-labelledby="legal-title">
        <div className="wrap legal-hero__inner">
          <h1 className="h-hero legal-hero__title" id="legal-title" data-split>
            {txt("hero.titulo")}
          </h1>
          <p className="lead" data-reveal style={ritmo(3)}>{txt("hero.lead")}</p>
          <div className="legal-hero__meta" data-reveal style={ritmo(4)}>
            <span className="tag"><i className="i i-clock" aria-hidden />{txt("hero.actualizado")}</span>
            <span className="tag"><i className="i i-shield" aria-hidden />{txt("hero.normativa")}</span>
          </div>
        </div>
      </section>

      <div className="wrap legal">
        {/* ── Índice lateral: lo va marcando el motor al bajar ── */}
        <nav className="legal__toc" aria-label={txt("indice.etiqueta")} data-toc>
          <p>{txt("indice.titulo")}</p>
          {APARTADOS.map((id) => (
            <a key={id} href={`#${id}`}>{txt(`indice.${id}`)}</a>
          ))}
          <a className="btn btn--outline btn--sm btn--block" href={correoDerechos}>
            {txt("indice.escribenos")}
          </a>
        </nav>

        <article className="prose">
          {/* ── 1 · Responsable ──────────────────────────────── */}
          <section id="responsable">
            <h2><span className="n">1</span>{txt("responsable.titulo")}</h2>
            <p>{txt("responsable.intro")}</p>
            <div className="table-wrap">
              <table className="table">
                <tbody>
                  <tr>
                    <th scope="row">{txt("responsable.filaTitular")}</th>
                    <td>
                      <mark className="fill">{txt("responsable.titularPendiente")}</mark>
                      {txt("responsable.titularResto")}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">{txt("responsable.filaNif")}</th>
                    <td><mark className="fill">{txt("responsable.nifPendiente")}</mark></td>
                  </tr>
                  <tr>
                    <th scope="row">{txt("responsable.filaDomicilio")}</th>
                    <td><mark className="fill">{txt("responsable.domicilioPendiente")}</mark></td>
                  </tr>
                  <tr>
                    <th scope="row">{txt("responsable.filaEmail")}</th>
                    <td><a href={`mailto:${CORREO}`}>{CORREO}</a></td>
                  </tr>
                  <tr>
                    <th scope="row">{txt("responsable.filaWhatsapp")}</th>
                    <td><a href={FUERA.whatsapp}>{TELEFONO}</a></td>
                  </tr>
                  <tr>
                    <th scope="row">{txt("responsable.filaDpd")}</th>
                    <td><mark className="fill">{txt("responsable.dpdPendiente")}</mark></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ── 2 · A quién se aplica ────────────────────────── */}
          <section id="alcance">
            <h2><span className="n">2</span>{txt("alcance.titulo")}</h2>
            <p>{txt("alcance.intro")}</p>
            <ul>
              {ALCANCE.map(({ clave, prueba }) => (
                <li key={clave}>
                  <b>{txt(`alcance.${clave}Fuerte`)}</b>
                  {prueba ? promesa(`alcance.${clave}Resto`) : txt(`alcance.${clave}Resto`)}
                </li>
              ))}
            </ul>
          </section>

          {/* ── 3 · Qué datos tratamos ───────────────────────── */}
          <section id="datos">
            <h2><span className="n">3</span>{txt("datos.titulo")}</h2>
            <ul>
              {DATOS.map((clave) => (
                <li key={clave}>
                  <b>{txt(`datos.${clave}Fuerte`)}</b>
                  {txt(`datos.${clave}Resto`)}
                </li>
              ))}
            </ul>
            <p>{txt("datos.nota")}</p>
          </section>

          {/* ── 4 · Finalidades y bases legales ────────────────
              Las ocho filas van escritas una a una, y no en un
              map, porque dos no son como las demás: la del alta
              tiene las dos versiones de la prueba y la de cookies
              lleva un enlace dentro de la celda. */}
          <section id="finalidades">
            <h2><span className="n">4</span>{txt("finalidades.titulo")}</h2>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{txt("finalidades.columnaFinalidad")}</th>
                    <th>{txt("finalidades.columnaBase")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{txt("finalidades.cuentaFin")}</td>
                    <td>{txt("finalidades.cuentaBase")}</td>
                  </tr>
                  <tr>
                    <td>{txt("finalidades.avisosFin")}</td>
                    <td>{txt("finalidades.avisosBase")}</td>
                  </tr>
                  <tr>
                    <td>{promesa("finalidades.altaFin")}</td>
                    <td>{txt("finalidades.altaBase")}</td>
                  </tr>
                  <tr>
                    <td>{txt("finalidades.soporteFin")}</td>
                    <td>{txt("finalidades.soporteBase")}</td>
                  </tr>
                  <tr>
                    <td>{txt("finalidades.facturarFin")}</td>
                    <td>{txt("finalidades.facturarBase")}</td>
                  </tr>
                  <tr>
                    <td>{txt("finalidades.newsletterFin")}</td>
                    <td>{txt("finalidades.newsletterBase")}</td>
                  </tr>
                  <tr>
                    <td>{txt("finalidades.protegerFin")}</td>
                    <td>{txt("finalidades.protegerBase")}</td>
                  </tr>
                  <tr>
                    <td>{txt("finalidades.cookiesFin")}</td>
                    <td>
                      {txt("finalidades.cookiesBaseA")}
                      <Link href={WEB.cookies}>{txt("finalidades.cookiesEnlace")}</Link>
                      {txt("finalidades.cookiesBaseB")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>{txt("finalidades.nota")}</p>
          </section>

          {/* ── 5 · El asistente virtual ──────────────────────
              OJO: este id lo enlazan /asistente-ia y el chat. */}
          <section id="asistente">
            <h2><span className="n">5</span>{txt("asistente.titulo")}</h2>
            <p>{txt("asistente.intro")}</p>
            <ul>
              {ASISTENTE.map((clave) => (
                <li key={clave}>
                  <b>{txt(`asistente.${clave}Fuerte`)}</b>
                  {txt(`asistente.${clave}Resto`)}
                </li>
              ))}
            </ul>
          </section>

          {/* ── 6 · Con quién compartimos ─────────────────────
              Los ocho puntos van escritos uno a uno porque el de
              Qore Technology lleva dentro el hueco en ámbar. */}
          <section id="destinatarios">
            <h2><span className="n">6</span>{txt("destinatarios.titulo")}</h2>
            <p>{txt("destinatarios.intro")}</p>
            <ul>
              <li>{txt("destinatarios.infraestructura")}</li>
              <li>
                {txt("destinatarios.qoreA")}
                <mark className="fill">{txt("destinatarios.qorePendiente")}</mark>
                {txt("destinatarios.qoreB")}
              </li>
              <li>{txt("destinatarios.pagos")}</li>
              <li>{txt("destinatarios.analitica")}</li>
              <li>{txt("destinatarios.ia")}</li>
              <li>{txt("destinatarios.recaptcha")}</li>
              <li>{txt("destinatarios.tipografias")}</li>
              <li>{txt("destinatarios.autoridades")}</li>
            </ul>
          </section>

          {/* ── 7 · Transferencias internacionales ───────────── */}
          <section id="transferencias">
            <h2><span className="n">7</span>{txt("transferencias.titulo")}</h2>
            <p>{txt("transferencias.texto")}</p>
          </section>

          {/* ── 8 · Cuánto tiempo los guardamos ───────────────
              Los cinco plazos van uno a uno porque el de cookies
              enlaza a la otra política. */}
          <section id="conservacion">
            <h2><span className="n">8</span>{txt("conservacion.titulo")}</h2>
            <ul>
              <li>
                <b>{txt("conservacion.cuentaFuerte")}</b>
                {txt("conservacion.cuentaResto")}
              </li>
              <li>
                <b>{txt("conservacion.facturacionFuerte")}</b>
                {txt("conservacion.facturacionResto")}
              </li>
              <li>
                <b>{txt("conservacion.solicitudesFuerte")}</b>
                {txt("conservacion.solicitudesResto")}
              </li>
              <li>
                <b>{txt("conservacion.newsletterFuerte")}</b>
                {txt("conservacion.newsletterResto")}
              </li>
              <li>
                <b>{txt("conservacion.cookiesFuerte")}</b>
                {txt("conservacion.cookiesRestoA")}
                <Link href={WEB.cookies}>{txt("conservacion.cookiesEnlace")}</Link>
                {txt("conservacion.cookiesRestoB")}
              </li>
            </ul>
            <p>{txt("conservacion.nota")}</p>
          </section>

          {/* ── 9 · Tus derechos ─────────────────────────────── */}
          <section id="derechos">
            <h2><span className="n">9</span>{txt("derechos.titulo")}</h2>
            <p>{txt("derechos.intro")}</p>
            <ul>
              {DERECHOS.map((clave) => (
                <li key={clave}>
                  <b>{txt(`derechos.${clave}Fuerte`)}</b>
                  {txt(`derechos.${clave}Resto`)}
                </li>
              ))}
            </ul>
            <p>
              {txt("derechos.contactoA")}
              <a href={correoDerechos}>{CORREO}</a>
              {txt("derechos.contactoB", { asunto })}
            </p>
            <p>
              {txt("derechos.reclamacionA")}
              <a href={AEPD} target="_blank" rel="noopener">{AEPD_DOMINIO}</a>
              {txt("derechos.reclamacionB")}
            </p>
          </section>

          {/* ── 10 · Menores ─────────────────────────────────── */}
          <section id="menores">
            <h2><span className="n">10</span>{txt("menores.titulo")}</h2>
            <p>{txt("menores.texto")}</p>
          </section>

          {/* ── 11 · Seguridad ───────────────────────────────── */}
          <section id="seguridad">
            <h2><span className="n">11</span>{txt("seguridad.titulo")}</h2>
            <p>{txt("seguridad.texto")}</p>
          </section>

          {/* ── 12 · Cambios ─────────────────────────────────── */}
          <section id="cambios">
            <h2><span className="n">12</span>{txt("cambios.titulo")}</h2>
            <p>{txt("cambios.texto")}</p>
            <div className="note">
              <i className="i i-info" aria-hidden />
              <span>
                {txt("cambios.notaA")}
                <a href={`mailto:${CORREO}`}>{CORREO}</a>
                {txt("cambios.notaB")}
              </span>
            </div>
          </section>
        </article>
      </div>
    </PaginaWeb>
  );
}
