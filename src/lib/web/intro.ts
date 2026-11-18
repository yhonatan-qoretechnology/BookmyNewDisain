/* ============================================================
   Portada del portal: «¿Qué quieres descubrir?»
   ------------------------------------------------------------
   Esto es el MOTOR de la portada de la web: los estados de la
   entrada, las dos puertas (la app y el CRM), el seguimiento del
   puntero y el destello con el que se sale hacia la página
   elegida. El marcado lo monta React; aquí no se crea ni un
   nodo.

   Trabaja sobre los mismos atributos y clases que ya mira la
   hoja de estilos (public/web/v2/bookmy.css). La hoja viene tal
   cual del sitio estático y no se toca, así que estos nombres
   son contrato, no gusto:

     · [data-intro]        la raíz del portal
     · [data-state]        boot → ready → leaving
     · [data-hover]        app | crm (tiñe el aura y el título)
     · .is-fast            entrada corta, de 0,3 s
     · .gate.is-picked     la puerta elegida se queda; la otra se va
     · --px / --py         desplazamiento de los chips del fondo
     · --rx --ry --mx --my inclinación y brillo de cada puerta

   La versión original vivía en páginas que se recargaban
   enteras: podía dejar listeners sueltos porque el navegador se
   los llevaba al navegar. Aquí es una SPA y la portada se monta
   y se desmonta muchas veces en la misma pestaña, de donde salen
   las dos reglas que rigen el archivo entero:

     1. nada de window/document fuera de iniciarPortal, porque
        Next evalúa este módulo también en el servidor;
     2. todo lo que se engancha se guarda para poder soltarlo, y
        de eso se encarga la función de parada. Un bucle de
        animación olvidado no se nota en una visita, pero se
        acumula una vez por cada entrada a la portada.
============================================================ */

import {
  campoDeEstrellas,
  escultura,
  movimientoReducido,
  punteroFino,
  puntero,
  registrarBucle,
  type ControlCampo,
  type ControlEscultura,
} from "@/lib/web/particulas";
import { WEB, type Mundo } from "@/lib/web/rutas";

declare global {
  interface Window {
    /** API de la portada, tal como la exponía la web estática. */
    BookmyIntro?: { choose: (tipo: Mundo) => void };
  }
}

export interface OpcionesPortal {
  /**
   * Qué hacer cuando el visitante elige una puerta. El original
   * hacía location.href y recargaba el sitio; aquí lo normal es
   * que React navegue con el router y no se pierda la SPA. Si no
   * se pasa nada, se recarga como antes.
   */
  alElegir?: (destino: string) => void;
  /**
   * Si el visitante llega desde otra página de la web se le
   * ahorra la entrada larga (clase .is-fast). El original lo
   * deducía del referrer, que en una SPA ya no cambia al navegar
   * entre rutas: pásalo desde React cuando lo sepas.
   */
  vieneDeLaWeb?: boolean;
  /**
   * Lo que se anuncia en voz alta (aria-live) al elegir una puerta.
   * Es texto de pantalla y la web es bilingüe, así que viene
   * traducido desde React; sin él se queda el español del original.
   */
  etiquetas?: { app?: string; crm?: string; generica?: string };
}

/** Figura que toma la escultura según la puerta señalada. */
const FIGURAS: Record<string, string> = { app: "phone", crm: "bars" };

/** Lo que se lee en voz alta (aria-live) al elegir, si React no lo traduce. */
const ETIQUETA_ES: Record<string, string> = { app: "Abriendo la app…", crm: "Abriendo el CRM…" };
const ETIQUETA_GENERICA_ES = "Abriendo…";

/**
 * Destinos de respaldo para los atajos de teclado, por si la
 * puerta no trae href. Lo normal es que gane el href del enlace,
 * que es el que conoce las rutas de verdad de la app. El original
 * traía aquí "app.html" y "crm.html"; en Next son estas rutas.
 */
const RUTAS: Record<string, string> = { app: WEB.app, crm: WEB.crm };

/**
 * Portales ya en marcha, por nodo raíz. Arrancar dos veces sobre
 * el mismo nodo (un efecto que se repite, el modo estricto de
 * React en desarrollo) para el primero antes de montar el
 * segundo, para no duplicar listeners ni bucles.
 */
const ACTIVOS = new WeakMap<HTMLElement, () => void>();

/**
 * Arranca la portada sobre `raiz` (el nodo con [data-intro], o
 * cualquier contenedor suyo) y devuelve la función de parada, que
 * suelta todo y deja el marcado como estaba.
 */
export function iniciarPortal(raiz: HTMLElement, opciones: OpcionesPortal = {}): () => void {
  // Por si alguien lo llama durante el render del servidor: sin
  // DOM no hay nada que animar y tampoco nada que limpiar.
  if (typeof window === "undefined") return () => {};

  // Vale tanto la raíz del portal como un contenedor suyo, que es
  // lo que suele tener a mano un componente de React.
  const encontrado = raiz.matches("[data-intro]") ? raiz : raiz.querySelector<HTMLElement>("[data-intro]");
  if (!encontrado) return () => {};
  const portal: HTMLElement = encontrado;

  // Idempotencia: si ya había un portal vivo en este nodo, se para.
  ACTIVOS.get(portal)?.();

  // Los dos medios se consultan aquí, no al cargar el módulo: en el
  // servidor no hay matchMedia.
  const quieto = movimientoReducido();
  const fino = punteroFino();

  const puertas = Array.from(portal.querySelectorAll<HTMLElement>(".gate"));
  const estado = portal.querySelector<HTMLElement>(".portal__status");
  const flotantes = portal.querySelector<HTMLElement>(".portal__floaters");

  /* Cómo estaba el marcado antes de que lo tocáramos, para poder
     devolverlo igual al desmontar. */
  const estadoPrevio = portal.dataset.state;
  const hoverPrevio = portal.dataset.hover;
  const teniaRapido = portal.classList.contains("is-fast");
  const textoPrevio = estado ? estado.textContent : null;
  const apiPrevia = window.BookmyIntro;

  /* Registro de todo lo que hay que soltar --------------------- */
  const limpiezas: Array<() => void> = [];
  const temporizadores = new Set<number>();
  let parado = false;

  function enNodo<K extends keyof HTMLElementEventMap>(
    nodo: HTMLElement,
    tipo: K,
    fn: (e: HTMLElementEventMap[K]) => void,
    opc?: AddEventListenerOptions,
  ): void {
    nodo.addEventListener(tipo, fn, opc);
    limpiezas.push(() => { nodo.removeEventListener(tipo, fn, opc); });
  }

  function enVentana<K extends keyof WindowEventMap>(
    tipo: K,
    fn: (e: WindowEventMap[K]) => void,
    opc?: AddEventListenerOptions,
  ): void {
    window.addEventListener(tipo, fn, opc);
    limpiezas.push(() => { window.removeEventListener(tipo, fn, opc); });
  }

  function enDocumento<K extends keyof DocumentEventMap>(
    tipo: K,
    fn: (e: DocumentEventMap[K]) => void,
    opc?: AddEventListenerOptions,
  ): void {
    document.addEventListener(tipo, fn, opc);
    limpiezas.push(() => { document.removeEventListener(tipo, fn, opc); });
  }

  /** setTimeout que se apunta solo, para que la parada lo cancele. */
  function tras(ms: number, fn: () => void): number {
    const id = window.setTimeout(() => {
      temporizadores.delete(id);
      fn();
    }, ms);
    temporizadores.add(id);
    return id;
  }

  function cancelar(id: number): void {
    if (!id) return;
    window.clearTimeout(id);
    temporizadores.delete(id);
  }

  /* El año del pie ---------------------------------------------
     Lo normal es que React ya lo pinte; se deja porque el marcado
     original lo traía vacío y así no hay un «2026» caducado en
     cuanto cambie el año. */
  portal.querySelectorAll<HTMLElement>("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  /* Si viene de otra página de la web, entra sin hacerle esperar */
  const vieneDeLaWeb = opciones.vieneDeLaWeb ?? ((): boolean => {
    try {
      return Boolean(document.referrer) && new URL(document.referrer).origin === window.location.origin;
    } catch {
      return false;
    }
  })();
  if (vieneDeLaWeb) portal.classList.add("is-fast");

  /* Escena: estrellas + escultura ------------------------------ */
  let estrellas: ControlCampo | null = null;
  let nube: ControlEscultura | null = null;
  try {
    const lienzoEstrellas = portal.querySelector<HTMLCanvasElement>(".portal__stars");
    const lienzoFigura = portal.querySelector<HTMLCanvasElement>(".portal__sculpture");
    if (lienzoEstrellas) estrellas = campoDeEstrellas(lienzoEstrellas, { cy: 0.46 });
    if (lienzoFigura) {
      // Menos puntos y algo más grandes en el móvil: ahí la
      // escultura se ve pequeña y el canvas cuesta más.
      const movil = window.innerWidth < 700;
      nube = escultura(lienzoFigura, {
        shapes: ["logo", "phone", "bars"],
        extent: 1.2,
        swing: 0.38,
        size: movil ? 1.7 : 1.45,
        count: movil ? 950 : 1500,
      });
    }
  } catch {
    /* Sin partículas la portada sigue funcionando: solo pierde la escultura. */
  }

  /* Los chips del fondo siguen al puntero según su profundidad --
     Va en el bucle compartido del motor de partículas, que ya
     suaviza el puntero, se para fuera de pantalla y se duerme con
     la pestaña. Lo que devuelve registrarBucle es justo la suelta
     que hay que guardar. */
  if (fino && !quieto && flotantes) {
    const chips = flotantes;
    limpiezas.push(registrarBucle(() => {
      chips.style.setProperty("--px", (puntero.x * -30).toFixed(2));
      chips.style.setProperty("--py", (puntero.y * -20).toFixed(2));
    }, chips));
  }

  /* Dos cuadros de espera antes de arrancar la entrada: el
     primero deja que el navegador pinte el estado "boot" y el
     segundo dispara las transiciones. Con uno solo el navegador
     junta los dos estilos y no se ve nada. */
  let cuadroListo = requestAnimationFrame(() => {
    cuadroListo = requestAnimationFrame(() => {
      portal.dataset.state = "ready";
    });
  });

  /* Pasar por encima: la escultura cambia de forma ------------- */
  let temporizadorHover = 0;
  let ocupado = false;

  function senalar(tipo: string | null): void {
    if (ocupado) return;
    cancelar(temporizadorHover);
    // Entrar es casi inmediato (40 ms) y salir espera un poco
    // (240 ms): así pasar el ratón de una puerta a la otra no
    // devuelve la escultura al logo por el camino.
    temporizadorHover = tras(tipo ? 40 : 240, () => {
      if (tipo) portal.dataset.hover = tipo; else delete portal.dataset.hover;
      nube?.cambiarA(FIGURAS[tipo ?? ""] || "logo");
      tintar(tipo);
    });
  }

  /* Cada portal lleva el color de su producto (clases .t-app y .t-crm):
     las partículas leen las variables CSS del propio elemento. */
  function tintar(tipo: string | null): void {
    const puerta = tipo ? puertas.find((p) => p.dataset.choice === tipo) ?? null : null;
    nube?.tintar(puerta);
    estrellas?.tintar(puerta);
  }

  puertas.forEach((puerta) => {
    const tipo = puerta.dataset.choice ?? "";

    enNodo(puerta, "pointerenter", (e) => {
      // En táctil no hay «pasar por encima»: el toque ya elige.
      if (e.pointerType !== "touch") senalar(tipo);
    });
    enNodo(puerta, "pointerleave", () => { senalar(null); });
    enNodo(puerta, "focus", () => { senalar(tipo); });
    enNodo(puerta, "blur", () => { senalar(null); });

    // Inclinación 3D y brillo que siguen al cursor
    if (fino && !quieto) {
      enNodo(puerta, "pointermove", (e) => {
        const r = puerta.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        puerta.style.setProperty("--rx", `${((0.5 - y) * 16).toFixed(2)}deg`);
        puerta.style.setProperty("--ry", `${((x - 0.5) * 10).toFixed(2)}deg`);
        puerta.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
        puerta.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
      });
      enNodo(puerta, "pointerleave", () => {
        puerta.style.setProperty("--rx", "0deg");
        puerta.style.setProperty("--ry", "0deg");
      });
    }

    enNodo(puerta, "click", (e) => {
      // Con Ctrl, Cmd, Shift o Alt (o con el botón del medio) se
      // deja al navegador abrir el enlace en otra pestaña.
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      elegir(tipo, puerta.getAttribute("href"));
    });
  });

  /* Elegir: estallido + salto a la velocidad de la luz --------- */
  function navegar(destino: string): void {
    if (opciones.alElegir) opciones.alElegir(destino);
    else window.location.href = destino;
  }

  function destinoDe(tipo: string): string | null {
    const puerta = puertas.find((p) => p.dataset.choice === tipo);
    return puerta?.getAttribute("href") || RUTAS[tipo] || null;
  }

  function elegir(tipo: string, destino: string | null = destinoDe(tipo)): void {
    if (ocupado || !destino) return;
    ocupado = true;
    cancelar(temporizadorHover);
    if (estado) {
      estado.textContent =
        opciones.etiquetas?.[tipo as "app" | "crm"] ??
        ETIQUETA_ES[tipo] ??
        opciones.etiquetas?.generica ??
        ETIQUETA_GENERICA_ES;
    }
    puertas.forEach((p) => { p.classList.toggle("is-picked", p.dataset.choice === tipo); });
    // Con «reducir movimiento» no hay estallido ni salto: se va directo.
    if (quieto || !nube) {
      navegar(destino);
      return;
    }
    portal.dataset.hover = tipo;
    nube.cambiarA(FIGURAS[tipo] || "logo");
    tintar(tipo);
    // 280 ms para que la escultura acabe de formar la figura
    // elegida; el estallido y el salto duran hasta 1250 ms, que es
    // cuando se cambia de página.
    tras(280, () => {
      nube?.estallar();
      estrellas?.salto(2.6);
      portal.dataset.state = "leaving";
    });
    tras(1250, () => { navegar(destino); });
  }

  /* Atajos de teclado -----------------------------------------
     El listener va al documento porque no hay nada enfocado al
     entrar. Por eso mismo TIENE que irse en la parada: si no,
     seguiría robando la A y la C en el resto del panel. */
  enDocumento("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    // Si está escribiendo en algo, las letras son suyas.
    if (e.target instanceof Element && e.target.closest("input, textarea, select, dialog, [contenteditable]")) return;
    const k = e.key.toLowerCase();
    if (k === "a") elegir("app");
    if (k === "c") elegir("crm");
  });

  /* Volver atrás desde otra página (caché del navegador) -------
     Sigue haciendo falta: la portada puede salir al sitio público
     con una navegación de verdad y volver desde la caché del
     navegador, con el DOM congelado a mitad del salto. */
  enVentana("pageshow", (e) => {
    if (!e.persisted) return;
    ocupado = false;
    if (estado) estado.textContent = "";
    delete portal.dataset.hover;
    portal.classList.add("is-fast");
    portal.dataset.state = "ready";
    puertas.forEach((p) => { p.classList.remove("is-picked"); });
    estrellas?.salto(0);
    nube?.reiniciar();
    nube?.cambiarA("logo");
    tintar(null);
  });

  /* La misma API que tenía la web estática, para poder elegir
     desde fuera: window.BookmyIntro.choose('app' | 'crm'). */
  const api = { choose: (tipo: Mundo) => { elegir(tipo); } };
  window.BookmyIntro = api;

  function parar(): void {
    if (parado) return;
    parado = true;
    ACTIVOS.delete(portal);

    // Listeners, observadores y bucles
    limpiezas.splice(0).forEach((soltar) => { soltar(); });
    temporizadores.forEach((id) => { window.clearTimeout(id); });
    temporizadores.clear();
    cancelAnimationFrame(cuadroListo);
    estrellas?.parar();
    nube?.parar();
    estrellas = null;
    nube = null;

    // Solo se retira la API si sigue siendo la nuestra: si otro
    // portal ya la sustituyó, la suya manda.
    if (window.BookmyIntro === api) {
      if (apiPrevia === undefined) delete window.BookmyIntro;
      else window.BookmyIntro = apiPrevia;
    }

    // Y el marcado, como estaba: si React vuelve a montar la
    // portada no debe encontrarse un data-state="leaving" ni una
    // puerta elegida de la visita anterior.
    if (estadoPrevio === undefined) delete portal.dataset.state; else portal.dataset.state = estadoPrevio;
    if (hoverPrevio === undefined) delete portal.dataset.hover; else portal.dataset.hover = hoverPrevio;
    if (!teniaRapido) portal.classList.remove("is-fast");
    if (estado) estado.textContent = textoPrevio;
    puertas.forEach((p) => {
      p.classList.remove("is-picked");
      ["--rx", "--ry", "--mx", "--my"].forEach((v) => { p.style.removeProperty(v); });
    });
    flotantes?.style.removeProperty("--px");
    flotantes?.style.removeProperty("--py");
  }

  ACTIVOS.set(portal, parar);
  return parar;
}
