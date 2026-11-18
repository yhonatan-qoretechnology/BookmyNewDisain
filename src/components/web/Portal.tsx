"use client";
/* ============================================================
   El portal de la portada
   ------------------------------------------------------------
   La portada no vende: pregunta. Dos puertas —la app y el CRM— y
   el visitante dice a qué viene. No lleva ni cabecera ni pie de
   los normales: es una pantalla entera con su propia tipografía,
   su escultura de partículas y su campo de estrellas.

   EL CONTRATO CON EL MOTOR DEL PORTAL
   src/lib/web/intro.ts escribe `data-state`, `data-hover` y la
   clase `is-fast` sobre el nodo con [data-intro], y lee las
   puertas por su [data-choice]. Si se cambian esos atributos la
   portada se queda en su estado inicial, que el CSS pinta
   invisible: no es decoración, es el contrato.

   Las variables en línea (--i, --x, --y, --z, --k, --ry, --d) son
   la posición y el ritmo de cada tarjeta flotante. Vienen del
   diseño original y no se tocan: cambiarlas descoloca el cuadro.
============================================================ */
import { Fragment, useEffect, useRef, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWebT } from "./useWebT";
import Marca from "./Marca";
import portalEs from "@/i18n/dictionaries/web/portal.es";
import portalEn from "@/i18n/dictionaries/web/portal.en";
import { WEB } from "@/lib/web/rutas";

/* Las ocho tarjetas que flotan alrededor, en el orden del diseño.
   `clave` las ata a su texto del diccionario. */
const FLOTANTES = [
  { clave: "cita", clases: "floater--m", icono: "i-calendar-check", tono: "ib t-app",
    estilo: { "--i": 0, "--x": "6%", "--y": "17%", "--xm": "4%", "--ym": "14%", "--z": -40, "--k": 1.1, "--ry": "14deg", "--d": "9s" } },
  { clave: "cliente", clases: "floater--m", icono: "i-user-plus", tono: "ib ib--cyan",
    estilo: { "--i": 1, "--x": "75%", "--y": "13%", "--xm": "83%", "--ym": "17%", "--z": -160, "--k": 0.8, "--ry": "-16deg", "--d": "11s" } },
  { clave: "pago", clases: "floater--desk floater--m", icono: "i-credit-card", tono: "ib t-crm",
    estilo: { "--i": 2, "--x": "4%", "--y": "63%", "--xm": "84%", "--ym": "37%", "--z": 60, "--k": 1.4, "--ry": "18deg", "--d": "10s" } },
  { clave: "recordatorio", clases: "floater--desk floater--m", icono: "i-bell", tono: "ib ib--amber",
    estilo: { "--i": 3, "--x": "80%", "--y": "57%", "--xm": "5%", "--ym": "31%", "--z": 40, "--k": 1.3, "--ry": "-18deg", "--d": "8.5s" } },
  { clave: "resena", clases: "floater--wide floater--far", icono: "i-star", tono: "ib ib--amber",
    estilo: { "--i": 4, "--x": "9%", "--y": "44%", "--z": -340, "--k": 0.5, "--ry": "20deg", "--d": "12s", "--o": 0.7 } },
  { clave: "ingresos", clases: "floater--wide", icono: "i-trending-up", tono: "ib t-crm",
    estilo: { "--i": 5, "--x": "71%", "--y": "35%", "--z": -110, "--k": 0.9, "--ry": "-12deg", "--d": "10.5s" } },
  { clave: "asistente", clases: "floater--xl", icono: "i-sparkles", tono: "ib ib--solid t-crm",
    estilo: { "--i": 6, "--x": "2%", "--y": "87%", "--z": -200, "--k": 0.75, "--ry": "16deg", "--d": "9.5s" } },
  { clave: "stock", clases: "floater--xl", icono: "i-package", tono: "ib ib--rose",
    estilo: { "--i": 7, "--x": "82.5%", "--y": "85%", "--z": -60, "--k": 1.1, "--ry": "-14deg", "--d": "11.5s" } },
] as const;

export default function Portal() {
  const { w, locale } = useWebT();
  const t = locale === "en" ? portalEn : portalEs;
  const router = useRouter();
  const raiz = useRef<HTMLDivElement>(null);
  const estrellas = useRef<HTMLCanvasElement>(null);
  const escultura = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const nodo = raiz.current;
    if (!nodo) return;

    /* El fondo de la portada es el suyo, no el del resto de la web: va
       en el <body> porque el degradado tiene que llegar a los bordes
       aunque la pantalla sea más alta que el contenido. Se quita al
       salir para no teñir las demás páginas. */
    document.body.classList.add("intro-page");

    let pararPortal: (() => void) | null = null;
    let pararEstrellas: (() => void) | null = null;
    let pararEscultura: (() => void) | null = null;
    let vivo = true;

    Promise.all([import("@/lib/web/intro"), import("@/lib/web/particulas")])
      .then(([{ iniciarPortal }, { campoDeEstrellas, escultura: figura }]) => {
        if (!vivo) return;

        if (estrellas.current) pararEstrellas = campoDeEstrellas(estrellas.current, { cy: 0.46 });
        if (escultura.current) {
          const movil = window.innerWidth < 760;
          pararEscultura = figura(escultura.current, {
            shapes: ["logo", "phone", "bars"],
            extent: 1.2,
            swing: 0.38,
            size: movil ? 1.7 : 1.45,
            count: movil ? 950 : 1500,
          });
        }

        pararPortal = iniciarPortal(nodo, {
          /* El original recargaba el sitio entero con location.href. Aquí
             navega el router, que es lo que hace que la entrada de la
             página siguiente se vea en vez de un parpadeo en blanco. */
          alElegir: (destino) => router.push(destino),
          etiquetas: t.abriendo,
        });
      })
      .catch(() => {
        /* Sin el motor la portada se queda quieta pero entera: el CSS
           deja visibles las puertas, que es lo único que hay que poder
           pulsar. */
      });

    return () => {
      vivo = false;
      pararPortal?.();
      pararEscultura?.();
      pararEstrellas?.();
      document.body.classList.remove("intro-page");
    };
  }, [router, t.abriendo]);

  return (
    <div className="portal" data-intro data-state="boot" ref={raiz}>
      <canvas className="portal__stars" aria-hidden ref={estrellas} />
      <div className="portal__aura" aria-hidden><span /><span /><span /></div>

      <div className="portal__floaters" aria-hidden>
        {FLOTANTES.map((f) => (
          <div key={f.clave} className={`floater ${f.clases}`} style={f.estilo as CSSProperties}>
            <div className="floater__in">
              <span className={f.tono}><i className={`i ${f.icono}`} /></span>
              <span>
                <b>{t.flotantes[f.clave].titulo}</b>
                <small>{t.flotantes[f.clave].sub}</small>
              </span>
            </div>
          </div>
        ))}
      </div>

      <header className="portal__top">
        <Marca etiqueta={w("comun.marca.alt")} />
        <Link className="portal__login" href={WEB.login}>
          <i className="i i-log-in" aria-hidden />
          {t.entrarPanel}
        </Link>
      </header>

      <main className="portal__main" id="contenido">
        <div className="portal__stage" aria-hidden>
          <div className="portal__ring" />
          <canvas className="portal__sculpture" ref={escultura} />
        </div>

        {/* Cada palabra entra por su cuenta: por eso van en <span class="w">
            con su turno en --i, y no como una sola frase.

            El espacio va FUERA del <span>, entre uno y otro, igual que en
            el HTML original. Dentro no vale: el CSS hace los .w
            inline-block y un inline-block se come el espacio final, así
            que el titular salía con las palabras pegadas. */}
        <p className="portal__hello">
          {t.hola.map((palabra, i) => (
            <Fragment key={palabra}>
              <span className="w" style={{ "--i": i } as CSSProperties}>{palabra}</span>{" "}
            </Fragment>
          ))}
        </p>

        <h1 className="portal__title">
          {t.titulo.antes.map((palabra, i) => (
            <Fragment key={palabra}>
              <span className="w" style={{ "--i": i } as CSSProperties}>{palabra}</span>{" "}
            </Fragment>
          ))}
          <em className="w" style={{ "--i": t.titulo.antes.length } as CSSProperties}>{t.titulo.acento}</em>{" "}
          {t.titulo.despues.map((palabra, i) => (
            <Fragment key={palabra}>
              <span className="w" style={{ "--i": t.titulo.antes.length + 1 + i } as CSSProperties}>{palabra}</span>{" "}
            </Fragment>
          ))}
        </h1>

        <nav className="portal__choices" id="elige" aria-label={t.elige}>
          <Link className="gate t-app" href={WEB.app} data-choice="app" aria-keyshortcuts="A">
            <span className="gate__beam" aria-hidden />
            <span className="gate__glare" aria-hidden />
            <span className="gate__lens" aria-hidden><i className="i i-smartphone" /></span>
            <span className="gate__txt"><b>{t.puertas.app.nombre}</b><small>{t.puertas.app.sub}</small></span>
            <kbd className="gate__kbd" aria-hidden>A</kbd>
            <span className="gate__go" aria-hidden><i className="i i-arrow-right" /></span>
          </Link>
          <Link className="gate t-crm" href={WEB.crm} data-choice="crm" aria-keyshortcuts="C">
            <span className="gate__beam" aria-hidden />
            <span className="gate__glare" aria-hidden />
            <span className="gate__lens" aria-hidden><i className="i i-bar-chart" /></span>
            <span className="gate__txt"><b>{t.puertas.crm.nombre}</b><small>{t.puertas.crm.sub}</small></span>
            <kbd className="gate__kbd" aria-hidden>C</kbd>
            <span className="gate__go" aria-hidden><i className="i i-arrow-right" /></span>
          </Link>
        </nav>

        {/* El motor escribe aquí «Abriendo la app…» al elegir, para que
            un lector de pantalla sepa que algo está pasando. */}
        <p className="portal__status" aria-live="polite" />
      </main>

      <footer className="portal__foot">
        <span>© {new Date().getFullYear()} Bookmy</span>
        <Link href={WEB.planes}>{t.pie.planes}</Link>
        <Link href={WEB.quienesSomos}>{t.pie.quienesSomos}</Link>
        <Link href={WEB.privacidad}>{t.pie.privacidad}</Link>
        <Link href={WEB.cookies}>{t.pie.cookies}</Link>
        <button type="button" data-cookie-settings>{t.pie.configurarCookies}</button>
      </footer>

      <div className="portal__flash" aria-hidden />
    </div>
  );
}
