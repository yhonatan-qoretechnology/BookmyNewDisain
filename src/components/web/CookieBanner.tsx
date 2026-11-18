"use client";
/* ============================================================
   Aviso y preferencias de cookies
   ------------------------------------------------------------
   Dos capas, que es lo que piden el RGPD, el artículo 22.2 de la
   LSSI y la guía de la AEPD:

     1ª  «Rechazar todas» y «Aceptar todas» con el MISMO peso
         visual. Un botón de rechazo escondido, o que exija dos
         clics más que el de aceptar, no vale como consentimiento
         libre.
     2ª  Un panel con el consentimiento POR CATEGORÍAS, donde las
         técnicas no se pueden apagar porque no necesitan permiso.

   El anterior solo tenía dos botones («Solo esenciales» y
   «Aceptar todo») y ninguna categoría, mientras la página de
   cookies publicaba que sí las había. Publicar que das una opción
   que no das es peor que no darla.

   TIENE QUE CUADRAR CON LA POLÍTICA PUBLICADA
   src/i18n/dictionaries/web/cookies.es.ts es la tabla que la ley
   obliga a enseñar exacta: el nombre de esta cookie, su duración
   y sus categorías salen de aquí. Si cambia algo de este archivo,
   esa tabla cambia con él.

   El consentimiento se guarda en localStorage y no en una cookie
   de servidor a propósito: así no viaja en cada petición y no
   hace falta pedir permiso para guardarlo (es la elección del
   propio usuario, que entra en la excepción de las técnicas).
============================================================ */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useWebT } from "./useWebT";
import { WEB } from "@/lib/web/rutas";

/** Lo que publica la tabla del apartado 3 de la política de cookies. */
const CLAVE = "bookmy_consent";
/** Súbelo si cambian las categorías: se vuelve a pedir el consentimiento. */
const VERSION = 1;
/** Doce meses, que es lo que recomienda la AEPD como máximo. */
const CADUCIDAD = 365 * 24 * 60 * 60 * 1000;

export type Categoria = "necessary" | "functional" | "analytics" | "marketing";
const CATEGORIAS: { id: Categoria; fija?: boolean }[] = [
  { id: "necessary", fija: true },
  { id: "functional" },
  { id: "analytics" },
  { id: "marketing" },
];

type Elecciones = Partial<Record<Categoria, boolean>>;
type Guardado = { v: number; ts: number; choices: Elecciones };

const leer = (): Guardado | null => {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return null;
    const v = JSON.parse(crudo) as Guardado;
    /* Caducado o de otra versión: se vuelve a preguntar. */
    if (!v || v.v !== VERSION || Date.now() - v.ts > CADUCIDAD) return null;
    return v;
  } catch {
    return null;
  }
};

const escribir = (choices: Elecciones): Guardado => {
  const v: Guardado = { v: VERSION, ts: Date.now(), choices };
  try { localStorage.setItem(CLAVE, JSON.stringify(v)); } catch { /* modo privado: solo en memoria */ }
  return v;
};

interface Valor { abrir: () => void; permite: (c: Categoria) => boolean }
const Ctx = createContext<Valor>({ abrir: () => {}, permite: (c) => c === "necessary" });
export const useCookieBanner = () => useContext(Ctx);

export function CookieBannerProvider({ children }: { children: React.ReactNode }) {
  const { w } = useWebT();
  const [elegido, setElegido] = useState<Elecciones | null>(null);
  const [verAviso, setVerAviso] = useState(false);
  const [verPanel, setVerPanel] = useState(false);
  const [borrador, setBorrador] = useState<Elecciones>({});
  const panel = useRef<HTMLDivElement>(null);

  const permite = useCallback(
    (c: Categoria) => c === "necessary" || Boolean(elegido?.[c]),
    [elegido],
  );

  /* ── Lo que hay que hacer cada vez que cambia la decisión ──
     Desbloquear los scripts permitidos, avisar a Google Consent
     Mode si está, y disparar el evento que escuchan otras piezas
     (el asistente, por ejemplo, solo recuerda la conversación si
     se han aceptado las funcionales). */
  const aplicar = useCallback((choices: Elecciones) => {
    const ok = (c: Categoria) => c === "necessary" || Boolean(choices[c]);

    document.querySelectorAll<HTMLScriptElement>('script[type="text/plain"][data-consent]').forEach((viejo) => {
      const cat = viejo.dataset.consent as Categoria | undefined;
      if (!cat || !ok(cat)) return;
      const nuevo = document.createElement("script");
      Array.from(viejo.attributes).forEach((a) => {
        if (!["type", "data-consent", "data-src"].includes(a.name)) nuevo.setAttribute(a.name, a.value);
      });
      if (viejo.dataset.src) nuevo.src = viejo.dataset.src;
      else nuevo.textContent = viejo.textContent;
      viejo.replaceWith(nuevo);
    });

    const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
    if (typeof gtag === "function") {
      const g = (s: boolean) => (s ? "granted" : "denied");
      gtag("consent", "update", {
        analytics_storage: g(ok("analytics")),
        ad_storage: g(ok("marketing")),
        ad_user_data: g(ok("marketing")),
        ad_personalization: g(ok("marketing")),
        functionality_storage: g(ok("functional")),
      });
    }

    document.dispatchEvent(new CustomEvent("bookmy:consent", { detail: { ...choices } }));
  }, []);

  /* Al cargar: si ya había decisión se aplica; si no, se pregunta.
     El retardo es para no tapar la pantalla en el primer instante. */
  useEffect(() => {
    const guardado = leer();
    if (guardado) {
      setElegido(guardado.choices);
      aplicar(guardado.choices);
      return;
    }
    const id = window.setTimeout(() => setVerAviso(true), 900);
    return () => clearTimeout(id);
  }, [aplicar]);

  const decidir = useCallback((choices: Elecciones) => {
    escribir(choices);
    setElegido(choices);
    aplicar(choices);
    setVerAviso(false);
    setVerPanel(false);
  }, [aplicar]);

  const todas = () => Object.fromEntries(CATEGORIAS.map((c) => [c.id, true])) as Elecciones;
  const ninguna = () => Object.fromEntries(CATEGORIAS.map((c) => [c.id, !!c.fija])) as Elecciones;

  const abrir = useCallback(() => {
    setBorrador(leer()?.choices ?? ninguna());
    setVerPanel(true);
    setVerAviso(false);
  }, []);

  /* Cualquier botón del sitio con [data-cookie-settings] abre el panel.
     Se engancha aquí, en el documento, y no botón a botón: el pie y la
     página de cookies tienen cuatro repartidos, y antes NINGUNO hacía
     nada porque nadie escuchaba ese atributo. */
  useEffect(() => {
    const alPulsar = (e: MouseEvent) => {
      const destino = (e.target as HTMLElement | null)?.closest?.("[data-cookie-settings]");
      if (!destino) return;
      e.preventDefault();
      abrir();
    };
    document.addEventListener("click", alPulsar);
    return () => document.removeEventListener("click", alPulsar);
  }, [abrir]);

  /* Escape cierra el panel, como cualquier diálogo. */
  useEffect(() => {
    if (!verPanel) return;
    const alTeclear = (e: KeyboardEvent) => { if (e.key === "Escape") setVerPanel(false); };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [verPanel]);

  const politica = (
    <a href={WEB.cookies}>{w("cookie.politica")}</a>
  );

  return (
    <Ctx.Provider value={{ abrir, permite }}>
      {children}

      {verAviso && (
        <section className="cc is-visible" aria-label={w("cookie.etiqueta")}>
          <div className="cc__head">
            <span className="ib ib--sm" aria-hidden><i className="i i-cookie" /></span>
            <h2>{w("cookie.titulo")}</h2>
          </div>
          <p>{w("cookie.texto")} {politica}.</p>
          {/* Los dos con la misma clase y el mismo tamaño: es el requisito. */}
          <div className="cc__actions">
            <button type="button" className="btn btn--dark" onClick={() => decidir(ninguna())}>
              {w("cookie.rechazar")}
            </button>
            <button type="button" className="btn btn--dark" onClick={() => decidir(todas())}>
              {w("cookie.aceptar")}
            </button>
          </div>
          <button type="button" className="cc__config" onClick={abrir}>
            <i className="i i-sliders" aria-hidden />
            {w("cookie.configurar")}
          </button>
        </section>
      )}

      {verPanel && (
        <div className="cc-dialog" role="dialog" aria-modal="true" aria-labelledby="cc-title" ref={panel}>
          <div className="cc-dialog__head">
            <div>
              <h2 id="cc-title">{w("cookie.panelTitulo")}</h2>
              <p>{w("cookie.panelTexto")}</p>
            </div>
            <button type="button" className="cc-dialog__close" onClick={() => setVerPanel(false)} aria-label={w("cookie.cerrar")}>
              <i className="i i-x" aria-hidden />
            </button>
          </div>

          <div className="cc-dialog__body">
            {CATEGORIAS.map((c) => (
              <div className="cc-opt" key={c.id}>
                <div className="cc-opt__top">
                  {c.fija ? (
                    <>
                      <span>{w(`cookie.cats.${c.id}.nombre`)}</span>
                      <span className="cc-opt__always">{w("cookie.siempre")}</span>
                    </>
                  ) : (
                    <>
                      <label htmlFor={`cc-${c.id}`}>{w(`cookie.cats.${c.id}.nombre`)}</label>
                      <span className="switch">
                        <input
                          type="checkbox"
                          role="switch"
                          id={`cc-${c.id}`}
                          checked={Boolean(borrador[c.id])}
                          onChange={(e) => setBorrador((b) => ({ ...b, [c.id]: e.target.checked }))}
                        />
                        <span />
                      </span>
                    </>
                  )}
                </div>
                <p>{w(`cookie.cats.${c.id}.desc`)}</p>
              </div>
            ))}
            <p className="small muted" style={{ padding: "14px 0 6px" }}>
              {w("cookie.panelDetalle")} {politica}.
            </p>
          </div>

          <div className="cc-dialog__foot">
            <button type="button" className="btn btn--outline" onClick={() => decidir(ninguna())}>
              {w("cookie.rechazar")}
            </button>
            <button type="button" className="btn btn--outline" onClick={() => decidir(todas())}>
              {w("cookie.aceptar")}
            </button>
            <button type="button" className="btn btn--dark" onClick={() => decidir({ ...borrador, necessary: true })}>
              {w("cookie.guardar")}
            </button>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
