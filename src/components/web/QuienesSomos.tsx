"use client";
/* ============================================================
   Quiénes somos · /quienes-somos
   ------------------------------------------------------------
   Paso a Next de quienes-somos.html de la web nueva. El árbol es
   el del original clase por clase, porque public/web/v2/bookmy.css
   se copió tal cual: aquí no se "mejora" el marcado, se calca.

   NO HAY NI UN useState NI UN useEffect, Y ES A PROPÓSITO
   Lo que se mueve en esta pantalla —el globo de partículas, las
   frases que aparecen palabra a palabra, los contadores, el
   carrusel de testimonios y la inclinación de las tarjetas— lo
   lleva el motor (src/lib/web/motor.ts) leyendo los atributos
   data-* del marcado, igual que hacía js/site.js. Si se le cambia
   un data-sculpture, un data-split o un data-count, la página se
   queda quieta. El componente es cliente solo porque necesita el
   diccionario (useWebT) y el `cta` que baja a <PaginaWeb>.

   LA PRUEBA GRATUITA
   El original cerraba prometiendo «7 días gratis». Esa promesa
   pasa por SE_OFRECE_PRUEBA (src/lib/web/oferta.ts), que hoy está
   en false: el backend no concede la prueba y los cobros no
   funcionan. Los días nunca se escriben a mano, van como {dias}.
============================================================ */
import Link from "next/link";
import type { CSSProperties } from "react";
import PaginaWeb from "@/components/web/PaginaWeb";
import { useWebT } from "@/components/web/useWebT";
import { FUERA, WEB } from "@/lib/web/rutas";
import { DIAS_DE_PRUEBA, SE_OFRECE_PRUEBA } from "@/lib/web/oferta";

/** El `style="--i:3"` del original: el turno de cada bloque al aparecer. */
const turno = (i: number) => ({ "--i": i }) as CSSProperties;

/* Los datos de contacto que se enseñan tal cual. No pasan por el
   diccionario porque no se traducen; el teléfono es el mismo número
   de FUERA.whatsapp y el usuario, el de FUERA.instagram. */
const CORREO = "contacto@bookmy.es";
const TELEFONO = "+34 651 026 700";
const INSTAGRAM = "@appbookmy";

/* Las tres chinchetas del globo, en el formato que espera el motor:
   Málaga (Costa del Sol), Bogotá y Medellín. */
const CHINCHETAS = '[{"lat":36.6,"lon":-4.6},{"lat":4.7,"lon":-74.1},{"lat":6.2,"lon":-75.6}]';

/* Los seis principios, con el icono de icons.css y las claves de su
   texto. Van en una tabla para que las dos filas de tres salgan de
   un map y el `--i` del escalonado se calcule solo. */
const PRINCIPIOS = [
  { icono: "i-sparkles", titulo: "principioSimplicidadTitulo", texto: "principioSimplicidadTexto" },
  { icono: "i-handshake", titulo: "principioCercaniaTitulo", texto: "principioCercaniaTexto" },
  { icono: "i-bar-chart", titulo: "principioDatosTitulo", texto: "principioDatosTexto" },
  { icono: "i-lock", titulo: "principioPrivacidadTitulo", texto: "principioPrivacidadTexto" },
  { icono: "i-refresh", titulo: "principioMejoraTitulo", texto: "principioMejoraTexto" },
  { icono: "i-cpu", titulo: "principioIaTitulo", texto: "principioIaTexto" },
];

/* Las ciudades donde ya hay negocios. Son nombres propios: no se
   traducen, así que viven aquí y no en el diccionario. */
const CIUDADES_ES = ["Benalmádena", "Fuengirola", "Marbella", "Málaga", "Torremolinos"];
const CIUDADES_CO = ["Bogotá", "Medellín"];

/* Los testimonios: el nombre y las iniciales del avatar son datos, la
   cita y el cargo salen del diccionario. El carrusel (data-carousel)
   empareja cada `.voices__av` con su `.voice` por orden. */
const VOCES = [
  { avatar: "av--1", iniciales: "AD", nombre: "Antonella Dávila", cita: "voz1Cita", cargo: "voz1Cargo" },
  { avatar: "av--2", iniciales: "JC", nombre: "Johan Castillo", cita: "voz2Cita", cargo: "voz2Cargo" },
];

export default function QuienesSomos() {
  const { w } = useWebT();

  /* La llamada a la acción que corona el pie: es la de esta pantalla,
     así que la pone la pantalla y no <SiteFooter>. */
  const cta = (
    <section className="f-cta" aria-labelledby="f-cta-title">
      <div className="wrap">
        <h2 className="f-cta__title" id="f-cta-title" data-split>
          {w("quienesSomos.ctaTitulo")} <em>{w("quienesSomos.ctaTituloEm")}</em>
        </h2>
        <p className="lead" data-reveal>
          {SE_OFRECE_PRUEBA
            ? w("quienesSomos.ctaLeadConPrueba", { dias: DIAS_DE_PRUEBA })
            : w("quienesSomos.ctaLeadSinPrueba")}
        </p>
        <div className="f-cta__actions" data-reveal style={turno(1)}>
          <Link className="btn btn--primary btn--lg" href={WEB.crearCuenta}>
            {SE_OFRECE_PRUEBA
              ? w("quienesSomos.ctaBotonConPrueba", { dias: DIAS_DE_PRUEBA })
              : w("quienesSomos.ctaBotonSinPrueba")}{" "}
            <i className="i i-arrow-right" aria-hidden />
          </Link>
          {/* Sin onClick: lo engancha el asistente por data-assistant-ask,
              igual que en la web estática. */}
          <button className="btn btn--ghost btn--lg" type="button" data-assistant-ask={w("quienesSomos.ctaPregunta")}>
            {w("quienesSomos.ctaSecundario")}
          </button>
        </div>
      </div>
    </section>
  );

  return (
    <PaginaWeb mundo="crm" pagina="quienes-somos" cta={cta}>
      {/* ── Héroe: globo de partículas con España y Colombia ── */}
      <section className="ph-hero qs-hero" aria-labelledby="qs-title">
        <div className="wrap ph-hero__grid">
          <div className="ph-hero__copy">
            <h1 className="h-hero ph-hero__title qs-hero__title" id="qs-title" data-split>
              {w("quienesSomos.heroTitulo")} <span className="mint">{w("quienesSomos.heroTituloMint")}</span>
            </h1>
            <p className="lead" data-reveal style={turno(4)}>{w("quienesSomos.heroLead")}</p>
            <div className="qs-places" data-reveal style={turno(5)}>
              <span><i className="i i-map-pin" aria-hidden />{w("quienesSomos.heroEspana")}</span>
              <span><i className="i i-map-pin" aria-hidden />{w("quienesSomos.heroColombia")}</span>
            </div>
          </div>
          <div className="ph-hero__stage qs-globe" aria-hidden>
            <div className="qs-globe__halo" />
            <canvas
              data-sculpture="globe"
              data-size="1.35"
              data-spin=".16"
              data-swing=".5"
              data-turn="-.87"
              data-tilt=".18"
              data-extent="1.3"
              data-count="1900"
              data-markers={CHINCHETAS}
            />
            <div className="qs-globe__ring" />
          </div>
        </div>
      </section>

      {/* ── Historia ───────────────────────────────────────── */}
      <section className="sec">
        <div className="wrap qs-story">
          <h2 className="h-lg qs-story__title" data-split>
            {w("quienesSomos.historiaTitulo")} <span className="mint">{w("quienesSomos.historiaTituloMint")}</span>
          </h2>
          <div className="qs-story__body">
            <p className="statement statement--md" data-scrub>{w("quienesSomos.historiaStatement")}</p>
            <p className="lead" data-reveal>{w("quienesSomos.historiaParrafo1")}</p>
            <p className="lead" data-reveal>{w("quienesSomos.historiaParrafo2")}</p>
          </div>
        </div>
      </section>

      {/* ── Misión y visión ────────────────────────────────── */}
      <section className="sec sec--tight">
        <div className="wrap mv">
          <article className="mv__card" data-tilt="5" data-reveal>
            <span className="glare" aria-hidden />
            <span className="feat__lens" aria-hidden><i className="i i-target" /></span>
            <h2 className="h-sm">{w("quienesSomos.misionTitulo")}</h2>
            <p>{w("quienesSomos.misionTexto")}</p>
          </article>
          <article className="mv__card mv__card--b" data-tilt="5" data-reveal style={turno(1)}>
            <span className="glare" aria-hidden />
            <span className="feat__lens" aria-hidden><i className="i i-compass" /></span>
            <h2 className="h-sm">{w("quienesSomos.visionTitulo")}</h2>
            <p>{w("quienesSomos.visionTexto")}</p>
          </article>
        </div>
      </section>

      {/* ── Principios ─────────────────────────────────────── */}
      <section className="sec">
        <div className="wrap">
          <div className="sec-head sec-head--split">
            <h2 className="h-xl" data-split>{w("quienesSomos.principiosTitulo")}</h2>
          </div>
          <ul className="ap-feats ap-feats--3">
            {PRINCIPIOS.map((p, i) => (
              /* El escalonado se reinicia en cada fila de tres, como en
                 el original: sin --i, --i:1, --i:2, sin --i… */
              <li
                className="feat"
                key={p.titulo}
                data-tilt=""
                data-reveal
                style={i % 3 ? turno(i % 3) : undefined}
              >
                <span className="glare" aria-hidden />
                <span className="feat__lens"><i className={`i ${p.icono}`} aria-hidden /></span>
                <h3 className="h-sm">{w(`quienesSomos.${p.titulo}`)}</h3>
                <p>{w(`quienesSomos.${p.texto}`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Cifras ─────────────────────────────────────────────
          El número que lleva el marcado es lo que se ve antes de
          que el contador arranque y lo único que se ve sin
          JavaScript; el motor lo reescribe desde data-count. */}
      <section className="sec--tight cx-proof" aria-label={w("quienesSomos.cifrasEtiqueta")}>
        <div className="wrap proof">
          <div className="proof__item" data-reveal>
            <b data-count="25" data-prefix="+" data-suffix="K">{w("quienesSomos.cifraReservas")}</b>
            <span>{w("quienesSomos.cifraReservasTexto")}</span>
          </div>
          <div className="proof__item" data-reveal style={turno(1)}>
            <b data-count="98" data-suffix={w("quienesSomos.cifraConfirmadasSufijo")}>
              {w("quienesSomos.cifraConfirmadas")}
            </b>
            <span>{w("quienesSomos.cifraConfirmadasTexto")}</span>
          </div>
          <div className="proof__item" data-reveal style={turno(2)}>
            <b data-count="4.9" data-decimals="1" data-suffix="★">{w("quienesSomos.cifraValoracion")}</b>
            <span>{w("quienesSomos.cifraValoracionTexto")}</span>
          </div>
          <div className="proof__item" data-reveal style={turno(3)}>
            <b data-count="7">{w("quienesSomos.cifraCiudades")}</b>
            <span>{w("quienesSomos.cifraCiudadesTexto")}</span>
          </div>
        </div>
      </section>

      {/* ── Dónde estamos ──────────────────────────────────── */}
      <section className="sec">
        <div className="wrap">
          <div className="sec-head sec-head--split">
            <h2 className="h-xl" data-split>
              {w("quienesSomos.dondeTitulo")} <span className="mint">{w("quienesSomos.dondeTituloMint")}</span>
            </h2>
            <p className="lead" data-reveal>{w("quienesSomos.dondeLead")}</p>
          </div>
          <div className="where">
            <article className="where__card" data-reveal>
              <div className="where__head">
                <h3 className="h-md">{w("quienesSomos.dondeEspana")}</h3>
                <span>{w("quienesSomos.dondeEspanaZona")}</span>
              </div>
              <ul className="where__list">
                {CIUDADES_ES.map((ciudad) => <li key={ciudad}>{ciudad}</li>)}
              </ul>
            </article>
            <article className="where__card" data-reveal style={turno(1)}>
              <div className="where__head">
                <h3 className="h-md">{w("quienesSomos.dondeColombia")}</h3>
                <span>{w("quienesSomos.dondeColombiaZona")}</span>
              </div>
              <ul className="where__list">
                {CIUDADES_CO.map((ciudad) => <li key={ciudad}>{ciudad}</li>)}
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* ── Testimonios ────────────────────────────────────── */}
      <section className="sec cx-voices">
        <div className="wrap">
          <h2 className="h-xl cx-voices__title" data-split>{w("quienesSomos.vocesTitulo")}</h2>
          <div className="voices" data-carousel>
            <div className="voices__people" aria-hidden>
              {VOCES.map((v) => (
                <span className={`voices__av av ${v.avatar}`} key={v.iniciales}>{v.iniciales}</span>
              ))}
            </div>
            <div className="voices__slides" aria-live="polite">
              {VOCES.map((v) => (
                <figure className="voice" key={v.iniciales}>
                  <blockquote>{w(`quienesSomos.${v.cita}`)}</blockquote>
                  <figcaption>
                    <b>{v.nombre}</b>
                    <span>{w(`quienesSomos.${v.cargo}`)}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <div className="voices__nav">
              <button className="voices__btn" type="button" data-prev aria-label={w("quienesSomos.vozAnterior")}>
                <i className="i i-arrow-right flip" aria-hidden />
              </button>
              <span className="voices__count" aria-hidden><b data-current>1</b> / {VOCES.length}</span>
              <button className="voices__btn" type="button" data-next aria-label={w("quienesSomos.vozSiguiente")}>
                <i className="i i-arrow-right" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contacto ───────────────────────────────────────── */}
      <section className="sec" id="contacto">
        <div className="wrap">
          <div className="sec-head sec-head--split">
            <h2 className="h-xl" data-split>{w("quienesSomos.contactoTitulo")}</h2>
            <p className="lead" data-reveal>{w("quienesSomos.contactoLead")}</p>
          </div>
          <ul className="contact">
            <li data-reveal>
              <a className="contact__card" href={`mailto:${CORREO}`} data-tilt="">
                <span className="glare" aria-hidden />
                <i className="i i-mail" aria-hidden />
                <h3 className="h-sm">{w("quienesSomos.contactoEmail")}</h3>
                <span>{CORREO}</span>
                <i className="i i-arrow-up-right contact__go" aria-hidden />
              </a>
            </li>
            <li data-reveal style={turno(1)}>
              <a className="contact__card" href={FUERA.whatsapp} target="_blank" rel="noopener" data-tilt="">
                <span className="glare" aria-hidden />
                <i className="i i-message-circle" aria-hidden />
                <h3 className="h-sm">{w("quienesSomos.contactoWhatsapp")}</h3>
                <span>{TELEFONO}</span>
                <i className="i i-arrow-up-right contact__go" aria-hidden />
              </a>
            </li>
            <li data-reveal style={turno(2)}>
              <a className="contact__card" href={FUERA.instagram} target="_blank" rel="noopener" data-tilt="">
                <span className="glare" aria-hidden />
                <i className="i i-heart" aria-hidden />
                <h3 className="h-sm">{w("quienesSomos.contactoInstagram")}</h3>
                <span>{INSTAGRAM}</span>
                <i className="i i-arrow-up-right contact__go" aria-hidden />
              </a>
            </li>
            <li data-reveal style={turno(3)}>
              {/* El original salía a https://bookmy.es/login; aquí el panel
                  es una ruta de la misma aplicación. */}
              <Link className="contact__card" href={WEB.login} data-tilt="">
                <span className="glare" aria-hidden />
                <i className="i i-log-in" aria-hidden />
                <h3 className="h-sm">{w("quienesSomos.contactoAcceso")}</h3>
                <span>{w("comun.nav.entrarPanel")}</span>
                <i className="i i-arrow-up-right contact__go" aria-hidden />
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </PaginaWeb>
  );
}
