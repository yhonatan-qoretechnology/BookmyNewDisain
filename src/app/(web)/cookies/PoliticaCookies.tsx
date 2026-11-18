"use client";
/* ============================================================
   Política de cookies · el cuerpo de la pantalla
   ------------------------------------------------------------
   Viene de cookies.html de la web nueva. El marcado es el mismo
   del original, clase por clase y atributo por atributo, porque
   de ellos viven dos cosas:

     · data-split y data-reveal (con su --i), que es cómo aparece
       cada bloque al entrar en pantalla.
     · data-toc en el <nav class="legal__toc">, que es el índice
       lateral: src/lib/web/motor.ts busca dentro de él los
       enlaces a#href^="#", observa la <section> de cada ancla y
       va marcando con `is-active` el apartado que se está
       leyendo. Si se le cambia la estructura o se le quita un id,
       el índice deja de seguir la lectura.

   LOS ID DE LOS APARTADOS NO SE TOCAN
   Son los que enlaza el índice y los que puede tener guardados
   cualquiera que haya enlazado un apartado concreto de la
   política. Van en el orden del documento: que-son, tipos, lista,
   terceros, gestionar, consentimiento, cambios.

   LOS BOTONES DE COOKIES NO LLEVAN onClick
   Los tres (el del héroe, el del índice y el del apartado 5)
   llevan solo `data-cookie-settings`: los engancha el aviso de
   cookies, igual que en la web estática y que en el pie. Si se
   les pusiera un onClick habría dos formas de abrir lo mismo.

   ES UN TEXTO LEGAL: ni una frase está escrita aquí. Todas salen
   de src/i18n/dictionaries/web/cookies.es.ts (y .en.ts), portadas
   palabra por palabra del original. Aquí solo quedan los datos que
   no son prosa: el correo de contacto y las direcciones de las
   políticas de Google.

   El page.tsx de al lado es de servidor y solo pone los metadatos.
============================================================ */
import type { CSSProperties } from "react";
import Link from "next/link";
import PaginaWeb from "@/components/web/PaginaWeb";
import { useWebT } from "@/components/web/useWebT";
import { WEB } from "@/lib/web/rutas";
import { DIAS_DE_PRUEBA, SE_OFRECE_PRUEBA } from "@/lib/web/oferta";

/* TypeScript no admite propiedades personalizadas dentro de `style`,
   así que el molde se hace aquí una vez. */
const estilo = (v: Record<string, string | number>): CSSProperties => v as CSSProperties;

/* El correo del documento. Va una sola vez y se usa a la vez como
   texto del enlace y como destino del mailto: así no pueden acabar
   diciendo direcciones distintas. Es el mismo del original y no se
   cambia sin cambiar el documento. */
const CORREO = "contacto@bookmy.es";

/* Las políticas de Google, que son las que se aplican al reCAPTCHA
   de los formularios. Son enlaces de fuera de casa, no rutas de la
   web, así que no salen de WEB. */
const GOOGLE = {
  privacidad: "https://policies.google.com/privacy",
  condiciones: "https://policies.google.com/terms",
} as const;

/* El apartado de la política de privacidad al que apunta el párrafo
   de las tipografías. La ruta sale de WEB; lo que se le añade es el
   ancla de aquella página, que allí se conserva. */
const PRIVACIDAD_DESTINATARIOS = `${WEB.privacidad}#destinatarios`;

/* El índice lateral: el id de cada apartado y su entrada. Los
   enlaces son anclas de esta misma página (no rutas), así que van
   con <a href="#id"> y no con <Link>: es lo que lee el motor. */
const INDICE = [
  { id: "que-son", clave: "indice1" },
  { id: "tipos", clave: "indice2" },
  { id: "lista", clave: "indice3" },
  { id: "terceros", clave: "indice4" },
  { id: "gestionar", clave: "indice5" },
  { id: "consentimiento", clave: "indice6" },
  { id: "cambios", clave: "indice7" },
];

/* Las cuatro filas de la tabla de tipos de cookies (apartado 2). */
const TIPOS = [1, 2, 3, 4];

/* Las siete filas de la lista de cookies (apartado 3), en el orden
   del original. Es la tabla que la ley obliga a enseñar, así que se
   porta fila por fila y columna por columna.

   `hueco` son las dos últimas, que el documento deja sin rellenar:
   su nombre, su titular y su duración van en <mark class="fill">
   (el CSS las pinta en ámbar) porque son un hueco pendiente, no un
   dato. Las otras cinco llevan el nombre en <code>, que es un
   identificador técnico. */
const COOKIES: { n: number; hueco?: true }[] = [
  { n: 1 },
  { n: 2 },
  { n: 3 },
  { n: 4 },
  { n: 5 },
  { n: 6, hueco: true },
  { n: 7, hueco: true },
];

export default function PoliticaCookies() {
  const { w } = useWebT();

  /* La promesa de la prueba gratuita está apagada mientras el backend
     no la conceda y los cobros no funcionen (src/lib/web/oferta.ts).
     La llamada del pie la mencionaba, así que tiene dos versiones y
     aquí se elige una: los días nunca van escritos, los pone
     DIAS_DE_PRUEBA. El texto legal de arriba no promete nada, así que
     no pasa por aquí. */
  const segunOferta = (conPrueba: string, sinPrueba: string) =>
    SE_OFRECE_PRUEBA ? w(conPrueba, { dias: DIAS_DE_PRUEBA }) : w(sinPrueba);

  const textoCta = segunOferta("cookies.ctaConPrueba", "cookies.ctaSinPrueba");

  /* La llamada a la acción que corona el pie: la pone <PaginaWeb>. */
  const cta = (
    <section className="f-cta" aria-labelledby="f-cta-title">
      <div className="wrap">
        <h2 className="f-cta__title" id="f-cta-title" data-split>
          {w("cookies.ctaTitulo")} <em>{w("cookies.ctaTituloEm")}</em>
        </h2>
        <p className="lead" data-reveal>
          {segunOferta("cookies.ctaLeadConPrueba", "cookies.ctaLeadSinPrueba")}
        </p>
        <div className="f-cta__actions" data-reveal style={estilo({ "--i": 1 })}>
          <Link className="btn btn--primary btn--lg" href={WEB.crearCuenta}>
            {textoCta} <i className="i i-arrow-right" aria-hidden />
          </Link>
          <button className="btn btn--ghost btn--lg" type="button" data-assistant-open>
            {w("cookies.ctaDudas")}
          </button>
        </div>
      </div>
    </section>
  );

  return (
    <PaginaWeb mundo="crm" pagina="cookies" cta={cta}>
      {/* ── Héroe ─────────────────────────────────────────────── */}
      <section className="legal-hero" aria-labelledby="legal-title">
        <div className="wrap legal-hero__inner">
          <h1 className="h-hero legal-hero__title" id="legal-title" data-split>
            {w("cookies.heroTitulo")}
          </h1>
          <p className="lead" data-reveal style={estilo({ "--i": 3 })}>
            {w("cookies.heroLead")}
          </p>
          <div className="legal-hero__meta" data-reveal style={estilo({ "--i": 4 })}>
            <span className="tag">
              <i className="i i-clock" aria-hidden />
              {w("cookies.heroActualizado")}
            </span>
            <button className="btn btn--light btn--sm" type="button" data-cookie-settings>
              <i className="i i-sliders" aria-hidden />
              {w("cookies.heroConfigurar")}
            </button>
          </div>
        </div>
      </section>

      <div className="wrap legal">
        {/* ── El índice, que sigue la lectura ──────────────────── */}
        <nav className="legal__toc" aria-label={w("cookies.indiceAria")} data-toc>
          <p>{w("cookies.indiceTitulo")}</p>
          {INDICE.map(({ id, clave }) => (
            <a key={id} href={`#${id}`}>
              {w(`cookies.${clave}`)}
            </a>
          ))}
          <button className="btn btn--light btn--sm btn--block" type="button" data-cookie-settings>
            {w("cookies.indiceConfigurar")}
          </button>
        </nav>

        <article className="prose">
          {/* ── 1 · Qué son las cookies ───────────────────────── */}
          <section id="que-son">
            <h2>
              <span className="n">1</span>
              {w("cookies.queSonTitulo")}
            </h2>
            <p>{w("cookies.queSonParrafo1")}</p>
            <p>{w("cookies.queSonParrafo2")}</p>
          </section>

          {/* ── 2 · Tipos de cookies ──────────────────────────── */}
          <section id="tipos">
            <h2>
              <span className="n">2</span>
              {w("cookies.tiposTitulo")}
            </h2>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{w("cookies.tiposColCategoria")}</th>
                    <th>{w("cookies.tiposColParaQue")}</th>
                    <th>{w("cookies.tiposColConsentimiento")}</th>
                  </tr>
                </thead>
                <tbody>
                  {TIPOS.map((n) => (
                    <tr key={n}>
                      <td>
                        <b>{w(`cookies.tipo${n}Categoria`)}</b>
                      </td>
                      <td>{w(`cookies.tipo${n}ParaQue`)}</td>
                      <td>{w(`cookies.tipo${n}Consentimiento`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="note">
              <i className="i i-shield" aria-hidden />
              <span>{w("cookies.tiposNota")}</span>
            </div>
          </section>

          {/* ── 3 · Lista de cookies y almacenamiento ─────────── */}
          <section id="lista">
            <h2>
              <span className="n">3</span>
              {w("cookies.listaTitulo")}
            </h2>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{w("cookies.listaColNombre")}</th>
                    <th>{w("cookies.listaColTitular")}</th>
                    <th>{w("cookies.listaColFinalidad")}</th>
                    <th>{w("cookies.listaColDuracion")}</th>
                    <th>{w("cookies.listaColCategoria")}</th>
                  </tr>
                </thead>
                <tbody>
                  {COOKIES.map(({ n, hueco }) => (
                    <tr key={n}>
                      <td>
                        {hueco ? (
                          <mark className="fill">{w(`cookies.cookie${n}Nombre`)}</mark>
                        ) : (
                          <code>{w(`cookies.cookie${n}Nombre`)}</code>
                        )}
                      </td>
                      <td>
                        {hueco ? (
                          <mark className="fill">{w(`cookies.cookie${n}Titular`)}</mark>
                        ) : (
                          w(`cookies.cookie${n}Titular`)
                        )}
                      </td>
                      <td>{w(`cookies.cookie${n}Finalidad`)}</td>
                      <td>
                        {hueco ? (
                          <mark className="fill">{w(`cookies.cookie${n}Duracion`)}</mark>
                        ) : (
                          w(`cookies.cookie${n}Duracion`)
                        )}
                      </td>
                      <td>{w(`cookies.cookie${n}Categoria`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── 4 · Cookies y servicios de terceros ──────────── */}
          <section id="terceros">
            <h2>
              <span className="n">4</span>
              {w("cookies.tercerosTitulo")}
            </h2>
            <p>
              {w("cookies.terceros1A")}
              <a href={GOOGLE.privacidad} target="_blank" rel="noopener">
                {w("cookies.terceros1Privacidad")}
              </a>
              {w("cookies.terceros1B")}
              <a href={GOOGLE.condiciones} target="_blank" rel="noopener">
                {w("cookies.terceros1Condiciones")}
              </a>
              {w("cookies.terceros1C")}
            </p>
            <p>
              {w("cookies.terceros2A")}
              <Link href={PRIVACIDAD_DESTINATARIOS}>{w("cookies.terceros2Privacidad")}</Link>
              {w("cookies.terceros2B")}
            </p>
          </section>

          {/* ── 5 · Cómo gestionar tus preferencias ──────────── */}
          <section id="gestionar">
            <h2>
              <span className="n">5</span>
              {w("cookies.gestionarTitulo")}
            </h2>
            <p>
              {w("cookies.gestionar1A")}
              <b>{w("cookies.gestionar1Boton")}</b>
              {w("cookies.gestionar1B")}
            </p>
            {/* El botón va dentro del párrafo, como en el original: así
                queda en la línea de la lectura y no suelto al margen. */}
            <p>
              <button className="btn btn--light" type="button" data-cookie-settings>
                <i className="i i-sliders" aria-hidden />
                {w("cookies.gestionarBoton")}
              </button>
            </p>
            <p>{w("cookies.gestionar2")}</p>
          </section>

          {/* ── 6 · Tu consentimiento ────────────────────────── */}
          <section id="consentimiento">
            <h2>
              <span className="n">6</span>
              {w("cookies.consentimientoTitulo")}
            </h2>
            <ul>
              <li>
                {w("cookies.consentimiento1A")}
                <b>{w("cookies.consentimiento1Rechazar")}</b>
                {w("cookies.consentimiento1B")}
                <b>{w("cookies.consentimiento1Aceptar")}</b>
                {w("cookies.consentimiento1C")}
              </li>
              <li>
                {w("cookies.consentimiento2A")}
                <b>{w("cookies.consentimiento2Plazo")}</b>
                {w("cookies.consentimiento2B")}
              </li>
              <li>{w("cookies.consentimiento3")}</li>
            </ul>
          </section>

          {/* ── 7 · Cambios y contacto ───────────────────────── */}
          <section id="cambios">
            <h2>
              <span className="n">7</span>
              {w("cookies.cambiosTitulo")}
            </h2>
            <p>{w("cookies.cambios1")}</p>
            <p>
              {w("cookies.cambios2A")}
              <a href={`mailto:${CORREO}`}>{CORREO}</a>
              {w("cookies.cambios2B")}
              <Link href={WEB.privacidad}>{w("cookies.cambios2Privacidad")}</Link>
              {w("cookies.cambios2C")}
            </p>
          </section>
        </article>
      </div>
    </PaginaWeb>
  );
}
