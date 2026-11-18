/* ============================================================
   Motor de la web pública (diseño Inmersivo 3D)
   ------------------------------------------------------------
   Port de js/site.js del sitio estático. Sin librerías: un solo
   bucle por fotograma para todo lo que depende del scroll
   (escenas fijadas, cartas apiladas, palabras que se iluminan,
   imágenes que crecen y se apagan, marquesinas con inercia y
   cabecera que se esconde al bajar).

   Atributos que entiende, los mismos que en el sitio original:
     data-reveal[="fade|scale|blur"]  aparece al entrar en pantalla
     data-split                       titular que sube palabra a palabra
     data-scrub                       párrafo que se ilumina con el scroll
     data-scene="nombre"              escena fijada; expone --p (0..1)
     data-stack                       cartas que se apilan
     data-zoom                        crece al entrar y se apaga al salir
     data-tilt                        inclinación 3D que sigue al puntero
     data-pointer                     expone --px y --py (-1..1)
     data-marquee="1|-1"              cinta infinita (dirección)
     data-carousel                    testimonios con flechas
     data-count, data-tabs, .faq, data-roi, data-chat-demo,
     data-newsletter, data-toc, data-dd, data-mobile-menu,
     data-money, data-money-select, data-theme-demo, data-year
     canvas[data-sculpture]           escultura de partículas

   ------------------------------------------------------------
   TRES COSAS QUE AQUÍ NO SON COMO EN EL SITIO ESTÁTICO:

   1. SE DESMONTA. Allí cada página se recargaba entera; aquí la
      landing se monta y se desmonta muchas veces en la misma
      pestaña. `iniciarMotor` devuelve la función que lo apaga:
      cada listener, cada rAF, cada observer, cada temporizador
      y cada cambio en el DOM se anotan para poder deshacerlos.
      Una fuga aquí es un bucle de animación corriendo para
      siempre por cada visita.

   2. NO TOCA EL DOM EN EL SERVIDOR. Next evalúa este módulo
      también en el servidor, así que en el cuerpo del archivo no
      hay ni window, ni document, ni matchMedia: todo vive dentro
      de la función de arranque.

   3. LOS TEXTOS LLEGAN DE FUERA. La web es bilingüe, así que las
      cadenas visibles que el original escribía a pelo salen por
      `opciones.textos` (ver TextosMotor). El español es el valor
      por defecto para que arrancar sin opciones siga dando la
      misma web.
============================================================ */
import { PAISES, esGenerico, formatearDinero, pais, paisProbable } from "./money";

/* ============================================================
   1 · Textos y opciones
============================================================ */

/**
 * Todo lo que el motor escribe en pantalla desde JavaScript.
 * Lo que no está aquí viene del marcado (los `data-prefix`,
 * `data-suffix` y `data-unit` de la calculadora y los contadores)
 * o de money.ts (los nombres de país y de moneda).
 */
export interface TextosMotor {
  /** aria-label del botón del menú móvil cuando está cerrado. */
  menuAbrir: string;
  /** aria-label del mismo botón cuando está abierto. */
  menuCerrar: string;
  /** Locale de Intl para los contadores (data-count). */
  localeNumeros: string;
  /**
   * Cada opción del desplegable de países de la calculadora.
   *
   * Recibe el país ENTERO y no su nombre ya compuesto: los nombres de
   * money.ts están en español, y la web es bilingüe. Con el `code` y el
   * `cur` a mano, quien traduce puede pedirle a Intl el nombre del país
   * y el de la moneda en el idioma que toque (ver nombrePais y
   * nombreMoneda en money.ts).
   *
   * `generico` marca los dos códigos que no son países de verdad ("eu"
   * y "usd"): ahí el original no añade el nombre de la moneda, porque
   * ya va en el propio nombre.
   */
  etiquetaPais: (datos: { code: string; cur: string; nombre: string; moneda: string | null; generico: boolean }) => string;
  /** Newsletter: el alta ha entrado. */
  newsletterHecho: string;
  /** Newsletter: el endpoint ha fallado. */
  newsletterFallo: string;
  /** Newsletter sin endpoint: se abre el correo del visitante. */
  newsletterPorCorreo: string;
  /** Asunto del correo de alta. */
  newsletterAsunto: string;
  /** Cuerpo del correo de alta. */
  newsletterCuerpo: (correo: string) => string;
}

/** Los textos del original, tal cual. Sirven de respaldo y de plantilla. */
export const TEXTOS_MOTOR_ES: TextosMotor = {
  menuAbrir: "Abrir menú",
  menuCerrar: "Cerrar menú",
  localeNumeros: "es-ES",
  etiquetaPais: ({ nombre, moneda }) => (moneda ? `${nombre} · ${moneda}` : nombre),
  newsletterHecho: "¡Listo! Te hemos apuntado a la newsletter.",
  newsletterFallo: "No se ha podido enviar. Inténtalo de nuevo en un momento.",
  newsletterPorCorreo: "Abrimos tu correo para confirmar el alta.",
  newsletterAsunto: "Alta en la newsletter",
  newsletterCuerpo: (correo) => `Hola, quiero recibir la newsletter de Bookmy en este correo: ${correo}`,
};

/* ------------------------------------------------------------
   Las partículas son otro módulo: src/lib/web/particulas.ts.
   De ahí solo se importan los TIPOS (import type: no viaja nada
   al navegador), y el módulo en sí llega por `opciones`. Así el
   motor no obliga a cargar los kilobytes del canvas en las
   páginas que no lo usan, pero TypeScript comprueba igual que
   las llamadas cuadran con las firmas de verdad.
------------------------------------------------------------ */
import type {
  ControlCampo,
  ControlEscultura,
  MarcadorGlobo,
  OpcionesCampo,
  OpcionesEscultura,
  Puntero,
} from "./particulas";

/**
 * Lo que el motor usa de particulas.ts: cuatro exportaciones de las
 * suyas. Se cumple pasando el módulo entero.
 */
export interface MotorParticulas {
  /** Campo de estrellas de un lienzo de fondo. */
  campoDeEstrellas: (lienzo: HTMLCanvasElement, opciones?: OpcionesCampo) => ControlCampo;
  /** Escultura de un canvas[data-sculpture]. */
  escultura: (lienzo: HTMLCanvasElement, opciones?: OpcionesEscultura) => ControlEscultura;
  /** Apunta una función al bucle compartido y devuelve la suelta. */
  registrarBucle: (fn: (dt: number, t: number) => void, nodo?: Element | null) => () => void;
  /** Puntero suavizado, de -1 a 1. Objeto vivo: se lee en cada fotograma. */
  puntero: Puntero;
}

export interface OpcionesMotor {
  /** Los textos ya traducidos. Lo que falte se queda en español. */
  textos?: Partial<TextosMotor>;
  /**
   * El módulo de partículas (`import * as particulas from "@/lib/web/particulas"`).
   * Sin él la web funciona igual, pero sin esculturas, sin inclinación del
   * héroe y sin los elementos que siguen al puntero, y el bucle del scroll
   * se abre aquí en vez de compartirse.
   */
  particulas?: MotorParticulas | null;
  /**
   * Arrancar también el campo de estrellas de `.bg__stars`, como hacía
   * site.js. Por defecto NO: en Next ese lienzo vive en el marco común
   * (FondoWeb) para que las estrellas no se reinicien al navegar, y es ese
   * componente el que lo enciende. Ponerlo a true con FondoWeb montado
   * pintaría dos campos sobre el mismo canvas.
   */
  fondoEstrellas?: boolean;
  /** Destinatario del mailto de la newsletter cuando el formulario no tiene endpoint. */
  correoNewsletter?: string;
}

/* ============================================================
   2 · Utilidades puras (no tocan el DOM: pueden vivir aquí)
============================================================ */

const limitar = (v: number, a = 0, b = 1): number => Math.min(b, Math.max(a, v));
const suave = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const suaveFinal = (t: number): number => 1 - Math.pow(1 - t, 3);

/* Motores ya en marcha, por nodo raíz. Arrancar dos veces sobre el mismo
   nodo (un efecto que se repite, el modo estricto de React en desarrollo)
   para el primero antes de montar el segundo, para no duplicar listeners
   ni bucles. Es un WeakMap para no retener nodos que React ya tiró. */
const ENCENDIDOS = new WeakMap<Node, () => void>();

/* Contador de ids de las preguntas frecuentes. Es de módulo a propósito:
   así dos landings montadas a la vez no se pisan los ids. */
let secuenciaFaq = 0;

/* ------------------------------------------------------------
   Diario de cambios en el DOM
   ------------------------------------------------------------
   El marcado lo pinta React, así que todo lo que el motor
   cambia por detrás (clases, variables CSS, atributos, textos)
   queda anotado con su valor anterior para devolverlo al
   desmontar. Sin esto, al salir de la landing se quedarían
   pegados estados como `is-open` o un `--zo: 0.2` que deja un
   bloque invisible.
------------------------------------------------------------ */
interface Diario {
  clase: (el: Element, nombre: string, activa: boolean) => void;
  estilo: (el: HTMLElement, propiedad: string, valor: string) => void;
  atributo: (el: Element, nombre: string, valor: string | null) => void;
  texto: (el: Element, valor: string) => void;
  html: (el: Element, valor: string) => void;
  valor: (el: HTMLInputElement | HTMLSelectElement, v: string) => void;
  /** Guarda el contenido actual sin cambiarlo (para quien reordena nodos a mano). */
  guardarContenido: (el: Element) => void;
  /** Guarda el valor actual sin cambiarlo (antes de vaciar un desplegable). */
  guardarValor: (el: HTMLInputElement | HTMLSelectElement) => void;
  deshacer: () => void;
}

function crearDiario(): Diario {
  const clases = new Map<Element, Map<string, boolean>>();
  const estilos = new Map<HTMLElement, Map<string, string>>();
  const atributos = new Map<Element, Map<string, string | null>>();
  const contenidos = new Map<Element, string>();
  const valores = new Map<HTMLInputElement | HTMLSelectElement, string>();

  return {
    clase(el, nombre, activa) {
      let previas = clases.get(el);
      if (!previas) {
        previas = new Map<string, boolean>();
        clases.set(el, previas);
      }
      if (!previas.has(nombre)) previas.set(nombre, el.classList.contains(nombre));
      el.classList.toggle(nombre, activa);
    },

    estilo(el, propiedad, valor) {
      let previos = estilos.get(el);
      if (!previos) {
        previos = new Map<string, string>();
        estilos.set(el, previos);
      }
      if (!previos.has(propiedad)) previos.set(propiedad, el.style.getPropertyValue(propiedad));
      // Cadena vacía = quitar la declaración, que es lo que hace el original
      // cuando escribe '' en style.visibility o llama a removeProperty.
      if (valor === "") el.style.removeProperty(propiedad);
      else el.style.setProperty(propiedad, valor);
    },

    atributo(el, nombre, valor) {
      let previos = atributos.get(el);
      if (!previos) {
        previos = new Map<string, string | null>();
        atributos.set(el, previos);
      }
      if (!previos.has(nombre)) previos.set(nombre, el.getAttribute(nombre));
      if (valor === null) el.removeAttribute(nombre);
      else el.setAttribute(nombre, valor);
    },

    texto(el, valor) {
      if (!contenidos.has(el)) contenidos.set(el, el.innerHTML);
      el.textContent = valor;
    },

    html(el, valor) {
      if (!contenidos.has(el)) contenidos.set(el, el.innerHTML);
      el.innerHTML = valor;
    },

    valor(el, v) {
      if (!valores.has(el)) valores.set(el, el.value);
      el.value = v;
    },

    guardarContenido(el) {
      if (!contenidos.has(el)) contenidos.set(el, el.innerHTML);
    },

    guardarValor(el) {
      if (!valores.has(el)) valores.set(el, el.value);
    },

    deshacer() {
      clases.forEach((previas, el) => {
        previas.forEach((estaba, nombre) => el.classList.toggle(nombre, estaba));
      });
      estilos.forEach((previos, el) => {
        previos.forEach((antes, propiedad) => {
          if (antes === "") el.style.removeProperty(propiedad);
          else el.style.setProperty(propiedad, antes);
        });
      });
      atributos.forEach((previos, el) => {
        previos.forEach((antes, nombre) => {
          if (antes === null) el.removeAttribute(nombre);
          else el.setAttribute(nombre, antes);
        });
      });
      // El contenido antes que los valores: un <select> no puede recuperar su
      // selección hasta que han vuelto sus <option>.
      contenidos.forEach((antes, el) => {
        el.innerHTML = antes;
      });
      valores.forEach((antes, el) => {
        el.value = antes;
      });
      clases.clear();
      estilos.clear();
      atributos.clear();
      valores.clear();
      contenidos.clear();
    },
  };
}

/* Eventos que sabemos escuchar. Juntamos los tres mapas del DOM porque el
   motor escucha en window (resize, load, pageshow), en document (click) y
   en elementos (pointermove, touchstart, submit...). */
type MapaEventos = WindowEventMap & DocumentEventMap & HTMLElementEventMap;

/* El canvas de una escultura guarda sus mandos para que el resto de la
   página pueda pedirle cambios, igual que en el sitio estático. */
interface LienzoConEscultura extends HTMLCanvasElement {
  bmSculpture?: ControlEscultura;
}

/* ============================================================
   3 · El motor
============================================================ */

/**
 * Arranca el motor sobre el árbol que se le pase (por defecto, el
 * documento entero) y devuelve la función que lo apaga.
 *
 * Solo en cliente: si se llama en el servidor devuelve una función
 * vacía sin tocar nada.
 */
export function iniciarMotor(
  raiz?: HTMLElement | Document,
  opciones: OpcionesMotor = {},
): () => void {
  if (typeof window === "undefined") return () => {};

  const nodo: HTMLElement | Document = raiz ?? document;
  const doc: Document = nodo instanceof Document ? nodo : nodo.ownerDocument;
  const ambito: ParentNode = nodo;

  // Si ya había un motor en este nodo, se para antes de montar el nuevo:
  // así deja el DOM como estaba y no quedan dos juegos de listeners.
  ENCENDIDOS.get(nodo)?.();

  const textos: TextosMotor = { ...TEXTOS_MOTOR_ES, ...opciones.textos };
  const correoNewsletter = opciones.correoNewsletter ?? "contacto@bookmy.es";

  /* --- Contabilidad del desmontaje ---------------------------------- */
  const limpiezas: Array<() => void> = [];
  const diario = crearDiario();
  let vivo = true;

  const alSalir = (fn: () => void): void => {
    limpiezas.push(fn);
  };

  function escuchar<K extends keyof MapaEventos>(
    objetivo: EventTarget,
    tipo: K,
    fn: (ev: MapaEventos[K]) => void,
    opcionesEscucha?: AddEventListenerOptions,
  ): void {
    // El DOM tipa el oyente como EventListener; el puente es este cast.
    const manejador = fn as EventListener;
    objetivo.addEventListener(tipo, manejador, opcionesEscucha);
    alSalir(() => objetivo.removeEventListener(tipo, manejador, opcionesEscucha));
  }

  const temporizadores = new Set<number>();
  const esperar = (fn: () => void, ms: number): number => {
    const id = window.setTimeout(() => {
      temporizadores.delete(id);
      if (vivo) fn();
    }, ms);
    temporizadores.add(id);
    return id;
  };
  const olvidar = (id: number): void => {
    window.clearTimeout(id);
    temporizadores.delete(id);
  };
  alSalir(() => {
    temporizadores.forEach((id) => window.clearTimeout(id));
    temporizadores.clear();
  });

  const fotogramas = new Set<number>();
  const pedirFotograma = (fn: (t: number) => void): number => {
    const id = window.requestAnimationFrame((t) => {
      fotogramas.delete(id);
      if (vivo) fn(t);
    });
    fotogramas.add(id);
    return id;
  };
  alSalir(() => {
    fotogramas.forEach((id) => window.cancelAnimationFrame(id));
    fotogramas.clear();
  });

  const observar = (io: IntersectionObserver): IntersectionObserver => {
    alSalir(() => io.disconnect());
    return io;
  };

  /* --- Atajos -------------------------------------------------------- */
  const uno = <T extends Element = HTMLElement>(sel: string, ctx: ParentNode = ambito): T | null =>
    ctx.querySelector<T>(sel);
  const todos = <T extends Element = HTMLElement>(sel: string, ctx: ParentNode = ambito): T[] =>
    Array.from(ctx.querySelectorAll<T>(sel));

  /* Un id dentro de la raíz y, si no está, en todo el documento. El
     original solo miraba el documento; buscar primero dentro importa
     cuando la SPA tiene dos landings montadas a la vez. */
  const porId = (id: string | null | undefined): HTMLElement | null => {
    if (!id) return null;
    const dentro = uno<HTMLElement>(`#${CSS.escape(id)}`);
    return dentro ?? doc.getElementById(id);
  };

  const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fino = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const P: MotorParticulas | null = opciones.particulas ?? null;

  const raizHtml = doc.documentElement;
  // `.js` es la clase que esconde lo que luego aparece; `site-ready` avisa
  // de que el motor llegó. Al desmontar hay que quitar `.js` o la landing
  // siguiente se queda con medio contenido en opacidad 0.
  diario.clase(raizHtml, "js", true);
  diario.clase(raizHtml, "site-ready", true);

  todos("[data-year]").forEach((el) => {
    diario.texto(el, String(new Date().getFullYear()));
  });

  /* ============================================================
     Fondo y esculturas de partículas
  ============================================================ */
  if (P) {
    // El campo del fondo solo si nos lo piden: en Next lo normal es que lo
    // lleve FondoWeb (ver OpcionesMotor.fondoEstrellas).
    if (opciones.fondoEstrellas) {
      const fondo = uno<HTMLCanvasElement>(".bg__stars");
      if (fondo) {
        try {
          const campo = P.campoDeEstrellas(fondo, {
            count: window.innerWidth < 700 ? 70 : 150,
            speed: 0.03,
          });
          alSalir(campo);
        } catch {
          /* sin fondo */
        }
      }
    }

    todos<HTMLCanvasElement>("canvas[data-sculpture]").forEach((cv) => {
      try {
        const d = cv.dataset;
        // Las marcas del globo se filtran una por una: vienen de un atributo
        // del marcado y un JSON torcido no debe tumbar la escultura.
        let marcas: MarcadorGlobo[] = [];
        try {
          const leido: unknown = d.markers ? JSON.parse(d.markers) : [];
          if (Array.isArray(leido)) {
            marcas = leido.filter((m): m is MarcadorGlobo => {
              if (typeof m !== "object" || m === null) return false;
              const punto = m as Partial<MarcadorGlobo>;
              return typeof punto.lat === "number" && typeof punto.lon === "number";
            });
          }
        } catch {
          marcas = [];
        }

        const mandos = P.escultura(cv, {
          shapes: (d.sculpture ?? "").split(","),
          spin: d.spin ? Number(d.spin) : 0.3,
          swing: d.swing !== undefined ? Number(d.swing) : 0,
          extent: d.extent ? Number(d.extent) : 1.35,
          size: d.size ? Number(d.size) : 1.2,
          tilt: d.tilt ? Number(d.tilt) : 0.25,
          count: d.count ? Number(d.count) : undefined,
          repel: d.repel !== "false",
          markers: marcas,
        });
        // Los mandos se cuelgan del propio canvas, como en el sitio estático,
        // para que cualquiera pueda pedirle un cambio de figura.
        const lienzo = cv as LienzoConEscultura;
        lienzo.bmSculpture = mandos;
        alSalir(() => {
          mandos();
          delete lienzo.bmSculpture;
        });
        if (d.turn) mandos.turn(Number(d.turn));
      } catch {
        /* sin escultura */
      }
    });
  }

  /* ============================================================
     Cabecera: se esconde al bajar y vuelve al subir
  ============================================================ */
  const cabecera = uno(".site-header");
  const hayMenuDesplegado = (): boolean => Boolean(uno(".nav__dd.is-open"));
  let ultimaY = window.scrollY;

  function pintarCabecera(y: number): void {
    if (!cabecera) return;
    const dy = y - ultimaY;
    if (
      y < 140
      || doc.body.classList.contains("menu-open")
      || hayMenuDesplegado()
      || cabecera.contains(doc.activeElement)
    ) {
      diario.clase(cabecera, "is-hidden", false);
    } else if (dy > 6) diario.clase(cabecera, "is-hidden", true);
    else if (dy < -6) diario.clase(cabecera, "is-hidden", false);
    if (Math.abs(dy) > 6 || y < 140) ultimaY = y;
  }

  if (cabecera) {
    escuchar(cabecera, "focusin", () => diario.clase(cabecera, "is-hidden", false));
  }

  /* ============================================================
     Menú móvil
  ============================================================ */
  const botonMenu = uno(".nav__toggle");
  const menu = uno("[data-mobile-menu]");
  if (botonMenu && menu) {
    const listaMenu = uno(".mobile-menu__nav", menu);
    if (listaMenu) {
      Array.from(listaMenu.children).forEach((el, i) => {
        if (el instanceof HTMLElement) diario.estilo(el, "--i", String(i));
      });
    }

    const ponerMenu = (abierto: boolean): void => {
      diario.clase(doc.body, "menu-open", abierto);
      diario.clase(doc.body, "is-locked", abierto);
      diario.atributo(botonMenu, "aria-expanded", String(abierto));
      diario.atributo(botonMenu, "aria-label", abierto ? textos.menuCerrar : textos.menuAbrir);
      diario.atributo(menu, "inert", abierto ? null : "");
      diario.atributo(menu, "aria-hidden", String(!abierto));
      if (abierto && cabecera) diario.clase(cabecera, "is-hidden", false);
    };

    ponerMenu(false);
    escuchar(botonMenu, "click", () => ponerMenu(!doc.body.classList.contains("menu-open")));
    escuchar(menu, "click", (e) => {
      const destino = e.target;
      if (destino instanceof Element && destino.closest("a")) ponerMenu(false);
    });
    escuchar(window, "keydown", (e) => {
      if (e.key === "Escape" && doc.body.classList.contains("menu-open")) {
        ponerMenu(false);
        botonMenu.focus();
      }
    });

    // Al pasar a escritorio el menú móvil deja de existir: hay que cerrarlo
    // para no quedarnos con el body bloqueado.
    const anchoEscritorio = window.matchMedia("(min-width: 1141px)");
    const alCambiarAnchura = (e: MediaQueryListEvent): void => {
      if (e.matches) ponerMenu(false);
    };
    anchoEscritorio.addEventListener("change", alCambiarAnchura);
    alSalir(() => anchoEscritorio.removeEventListener("change", alCambiarAnchura));

    todos("[data-mm-group]", menu).forEach((g) => {
      const boton = uno(".mm-group__btn", g);
      const panel = uno(".mm-group__panel", g);
      if (!boton || !panel) return;
      const poner = (abierto: boolean): void => {
        diario.clase(g, "is-open", abierto);
        diario.atributo(boton, "aria-expanded", String(abierto));
        diario.atributo(panel, "inert", abierto ? null : "");
      };
      poner(g.classList.contains("is-open"));
      escuchar(boton, "click", () => poner(!g.classList.contains("is-open")));
    });
  }

  /* ============================================================
     Submenú de escritorio (Planes): ratón, clic, teclado y Escape
  ============================================================ */
  todos("[data-dd]").forEach((dd) => {
    const boton = uno(".nav__item", dd);
    if (!boton) return;
    let porRaton = false;
    let cierre = 0;

    const poner = (abierto: boolean): void => {
      olvidar(cierre);
      diario.clase(dd, "is-open", abierto);
      diario.atributo(boton, "aria-expanded", String(abierto));
      if (!abierto) porRaton = false;
    };

    escuchar(boton, "click", () => {
      // Si lo abrió el ratón, el primer clic no debe cerrarlo.
      if (dd.classList.contains("is-open") && porRaton) {
        porRaton = false;
        return;
      }
      poner(!dd.classList.contains("is-open"));
    });
    escuchar(dd, "pointerenter", (e) => {
      if (e.pointerType !== "mouse" || dd.classList.contains("is-open")) {
        olvidar(cierre);
        return;
      }
      porRaton = true;
      poner(true);
    });
    escuchar(dd, "pointerleave", (e) => {
      if (e.pointerType !== "mouse" || !porRaton) return;
      cierre = esperar(() => poner(false), 220);
    });
    escuchar(doc, "click", (e) => {
      const destino = e.target;
      if (!(destino instanceof Node) || !dd.contains(destino)) poner(false);
    });
    escuchar(dd, "keydown", (e) => {
      if (e.key === "Escape" && dd.classList.contains("is-open")) {
        poner(false);
        boton.focus();
      }
      if (e.key === "ArrowDown" && e.target === boton) {
        e.preventDefault();
        poner(true);
        uno(".nav__dd-panel a", dd)?.focus();
      }
    });
    escuchar(dd, "focusout", (e) => {
      const siguiente = e.relatedTarget;
      if (siguiente instanceof Node && !dd.contains(siguiente)) poner(false);
    });
  });

  /* ============================================================
     Palabras: cortar texto respetando las etiquetas internas
  ============================================================ */
  /**
   * Parte el texto de un elemento en `<span class="w">` para poder
   * animar palabra a palabra.
   *
   * Dos cosas que no estaban en el original:
   *  · guarda el marcado antes de tocarlo, para devolverlo al desmontar
   *    (lo pintó React y hay que dejárselo como estaba);
   *  · si ya está partido no vuelve a partirlo, que anidaría `.w`
   *    dentro de `.w` al arrancar dos veces.
   */
  function partirPalabras(el: HTMLElement, conHijo: boolean): HTMLElement[] {
    if (el.dataset.bmPartido === "1") return todos(".w", el);
    diario.guardarContenido(el);
    diario.atributo(el, "data-bm-partido", "1");

    let i = 0;
    const recorrer = (padre: Node): void => {
      Array.from(padre.childNodes).forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) {
          const trozo = doc.createDocumentFragment();
          (n.textContent ?? "").split(/(\s+)/).forEach((parte) => {
            if (!parte) return;
            if (/^\s+$/.test(parte)) {
              trozo.append(doc.createTextNode(" "));
              return;
            }
            const palabra = doc.createElement("span");
            palabra.className = "w";
            palabra.style.setProperty("--i", String(i));
            i += 1;
            if (conHijo) {
              const dentro = doc.createElement("span");
              dentro.textContent = parte;
              palabra.append(dentro);
            } else palabra.textContent = parte;
            trozo.append(palabra);
          });
          n.replaceWith(trozo);
        } else if (n.nodeType === Node.ELEMENT_NODE && (n as Element).tagName !== "BR") {
          recorrer(n);
        }
      });
    };
    recorrer(el);
    return todos(".w", el);
  }

  /* ============================================================
     Aparición al entrar en pantalla
  ============================================================ */
  todos("[data-split]").forEach((el) => partirPalabras(el, true));

  const revelarIO = observar(new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      diario.clase(e.target, "is-in", true);
      revelarIO.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }));

  todos("[data-reveal], [data-split], .bars").forEach((el) => {
    // Con movimiento reducido no se anima: el estado final se pone ya, que
    // es lo que deja el contenido visible.
    if (reducido) {
      diario.clase(el, "is-in", true);
      return;
    }
    revelarIO.observe(el);
  });

  /* ============================================================
     Párrafos que se iluminan palabra a palabra
  ============================================================ */
  interface Scrub {
    el: HTMLElement;
    palabras: HTMLElement[];
    encendidas: number;
  }
  const scrubs: Scrub[] = todos("[data-scrub]").map((el) => ({
    el,
    palabras: partirPalabras(el, false),
    encendidas: -1,
  }));

  /* ============================================================
     Escenas fijadas, cartas apiladas, imágenes que crecen
  ============================================================ */
  interface Escena {
    el: HTMLElement;
    nombre: string;
    top: number;
    h: number;
    p: number;
    estrecha: boolean;
    /* túnel */
    paneles: HTMLElement[];
    marcos: HTMLElement[];
    guia: HTMLElement[];
    mundo: HTMLElement | null;
    hueco: number;
    /* galería horizontal */
    dist: number;
    /* pasos de la app */
    puntos: HTMLElement[];
    pasos: HTMLElement[];
    paso: number;
    /* héroe del CRM */
    a: number;
  }

  const escenas: Escena[] = todos("[data-scene]").map((el) => ({
    el,
    nombre: el.dataset.scene ?? "",
    top: 0,
    h: 0,
    p: -1,
    estrecha: false,
    paneles: [],
    marcos: [],
    guia: [],
    mundo: null,
    hueco: 1700,
    dist: 0,
    puntos: [],
    pasos: [],
    paso: -1,
    a: 0,
  }));

  interface Pila {
    cartas: HTMLElement[];
  }
  const pilas: Pila[] = todos("[data-stack]").map((el) => ({ cartas: todos(".stack__card", el) }));
  const zooms = todos("[data-zoom]");
  const inclinacionEscena = { tx: "", ty: "" };

  /* Medidas de cada escena. Se recalculan al cambiar de anchura, al
     terminar de cargar y cuando llegan las tipografías. */
  const PREPARAR: Record<string, (s: Escena) => void> = {
    // Ajusta el panel 3D del CRM al tamaño de pantalla
    "crm-hero": (s) => {
      const panel = uno(".dash", s.el);
      if (!panel) return;
      const alto = panel.offsetHeight || 640;
      const estrecha = window.innerWidth <= 900 || reducido;
      const margen = parseFloat(window.getComputedStyle(uno(".wrap", s.el) ?? s.el).paddingLeft) || 16;
      const encaje = estrecha
        ? (Math.min(window.innerWidth, 1300) - margen * 2) / 1040
        : Math.min(1, (window.innerWidth * 0.9) / 1040, (window.innerHeight * 0.72) / alto);
      diario.estilo(s.el, "--fit", encaje.toFixed(4));
      diario.estilo(s.el, "--dh", `${alto}px`);
      s.estrecha = estrecha;
      if (estrecha) {
        diario.estilo(s.el, "--a", "1");
        diario.estilo(s.el, "--c", "0");
        diario.estilo(s.el, "--cap", "0");
      }
    },

    // Galería horizontal: la altura de la sección es el recorrido horizontal
    hscroll: (s) => {
      const cinta = uno(".hs__track", s.el);
      s.estrecha = window.innerWidth <= 900 || reducido;
      if (!cinta || s.estrecha) {
        diario.estilo(s.el, "height", "");
        return;
      }
      s.dist = Math.max(0, cinta.scrollWidth - window.innerWidth);
      diario.estilo(s.el, "height", `${Math.round(s.dist + window.innerHeight * 1.15)}px`);
    },

    // Túnel de profundidad: la cámara avanza y cada panel viene hacia ti
    tunnel: (s) => {
      s.estrecha = window.innerWidth <= 900 || reducido;
      s.paneles = todos(".tun__panel", s.el);
      s.marcos = todos(".tun__frame", s.el);
      s.guia = todos(".tun__rail li", s.el);
      s.mundo = uno(".tun__world", s.el);
      s.hueco = Number(s.el.dataset.gap || 1700);
      if (s.estrecha) {
        s.paneles.forEach((el) => {
          diario.estilo(el, "--o", "");
          diario.estilo(el, "visibility", "");
          diario.clase(el, "is-active", true);
        });
      }
    },

    "app-steps": (s) => {
      s.estrecha = window.innerWidth <= 900 || reducido;
      s.puntos = todos(".ap-steps__rail i", s.el);
      s.pasos = todos("[data-step]", s.el).filter((el) => !el.closest(".ap-steps__rail"));
    },
  };

  const GANCHOS: Record<string, (s: Escena, p: number) => void> = {
    tunnel: (s, p) => {
      if (s.estrecha || !s.mundo) return;
      const n = s.paneles.length;
      const q = limitar(p * 1.06 - 0.03) * (n - 1);
      const k = Math.min(n - 2, Math.floor(q));
      const t = q - k;
      const f = t < 0.3 ? 0 : t > 0.7 ? 1 : suave((t - 0.3) / 0.4);
      const camara = (k + f) * s.hueco;
      const cerca = Math.round(k + f);
      diario.estilo(s.mundo, "--cam", camara.toFixed(1));
      s.paneles.forEach((el, i) => {
        const z = camara - i * s.hueco;
        const o = z <= 0 ? limitar(1 + z / (s.hueco * 1.15)) : limitar(1 - z / 380);
        diario.estilo(el, "--o", o.toFixed(3));
        diario.estilo(el, "visibility", o < 0.01 ? "hidden" : "");
        diario.clase(el, "is-active", i === cerca);
      });
      s.marcos.forEach((el) => {
        const z = camara - parseFloat(el.style.getPropertyValue("--k")) * s.hueco;
        const o = z <= 0 ? limitar(1 + z / (s.hueco * 2.2)) : limitar(1 - z / 520);
        diario.estilo(el, "--o", (o * 0.7).toFixed(3));
      });
      s.guia.forEach((li, i) => diario.clase(li, "is-on", i === cerca));
    },

    hscroll: (s, p) => {
      if (s.estrecha) return;
      const e = limitar((p - 0.06) / 0.88);
      diario.estilo(s.el, "--hs", (e * s.dist).toFixed(1));
      diario.estilo(s.el, "--p", e.toFixed(4));
    },

    "app-steps": (s, p) => {
      if (s.estrecha) return;
      const n = Number(s.el.dataset.steps || 5);
      const paso = Math.min(n - 1, Math.floor(p * n * 0.9999));
      diario.estilo(s.el, "--p", p.toFixed(4));
      if (paso === s.paso) return;
      s.paso = paso;
      s.pasos.forEach((el) => diario.clase(el, "is-on", Number(el.dataset.step) === paso));
      s.puntos.forEach((d, k) => {
        diario.clase(d, "is-on", k === paso);
        diario.clase(d, "is-done", k < paso);
      });
    },

    "crm-hero": (s, p) => {
      if (s.estrecha) return;
      const a = suave(limitar((p - 0.04) / 0.62));
      diario.estilo(s.el, "--a", a.toFixed(4));
      diario.estilo(s.el, "--c", limitar(p / 0.3).toFixed(4));
      diario.estilo(s.el, "--cap", limitar((p - 0.72) / 0.16).toFixed(4));
      s.a = a;
    },
  };

  function medir(): void {
    escenas.forEach((s) => {
      PREPARAR[s.nombre]?.(s);
      const r = s.el.getBoundingClientRect();
      s.top = r.top + window.scrollY;
      s.h = s.el.offsetHeight;
    });
  }

  function fotogramaScroll(): void {
    const y = window.scrollY;
    const vh = window.innerHeight;

    escenas.forEach((s) => {
      const p = limitar((y - s.top) / Math.max(1, s.h - vh));
      if (Math.abs(p - s.p) > 0.0005) {
        s.p = p;
        GANCHOS[s.nombre]?.(s, p);
      }
    });

    pilas.forEach(({ cartas }) => {
      if (window.innerWidth <= 900) return;
      for (let i = 0; i < cartas.length - 1; i += 1) {
        const actual = cartas[i].getBoundingClientRect();
        const siguiente = cartas[i + 1].getBoundingClientRect();
        const s = limitar(1 - (siguiente.top - actual.top - 22) / Math.max(1, actual.height - 22));
        diario.estilo(cartas[i], "--s", s.toFixed(3));
      }
    });

    zooms.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      const entra = limitar((vh - r.top) / (vh * 0.75));
      const sale = limitar((vh * 0.3 - r.bottom) / (vh * 0.3));
      diario.estilo(el, "--zs", (0.82 + 0.18 * suaveFinal(entra)).toFixed(4));
      diario.estilo(el, "--zo", (1 - 0.78 * sale).toFixed(3));
    });

    scrubs.forEach((s) => {
      const r = s.el.getBoundingClientRect();
      const p = limitar((vh * 0.9 - r.top) / (r.height + vh * 0.4));
      const encendidas = Math.round(p * s.palabras.length * 1.08);
      if (encendidas === s.encendidas) return;
      s.encendidas = encendidas;
      s.palabras.forEach((w, i) => diario.clase(w, "on", i < encendidas));
    });

    pintarCabecera(y);
  }

  /* ============================================================
     Marquesinas: cinta infinita que acelera y cambia de sentido
  ============================================================ */
  interface Cinta {
    m: HTMLElement;
    cinta: HTMLElement;
    dir: number;
    w0: number;
    x: number;
    visible: boolean;
  }

  let velocidadScroll = 0;
  let anteriorY = window.scrollY;

  const cintas: Cinta[] = [];
  todos("[data-marquee]").forEach((m) => {
    const cinta = uno(".marquee__track", m);
    if (!cinta) return;
    const dir = Number(m.dataset.marquee) || 1;
    const originales = Array.from(cinta.children);
    const copiada = Boolean(cinta.querySelector("[data-bm-copia]"));
    // El ancho de un pase es el de la cinta SIN copias, así que si ya estaba
    // clonada hay que recuperar el que se midió entonces.
    const w0 = copiada ? Number(cinta.dataset.bmAncho) || cinta.scrollWidth : cinta.scrollWidth;
    // Si ya hay copias, este nodo venía de otro arranque: no se vuelve a
    // clonar (si no, cada arranque multiplicaría la cinta).
    if (!copiada) {
      diario.atributo(cinta, "data-bm-ancho", String(w0));
      let guarda = 0;
      while (cinta.scrollWidth < w0 + m.clientWidth + 200 && guarda < 8) {
        originales.forEach((hijo) => {
          const copia = hijo.cloneNode(true) as Element;
          copia.setAttribute("aria-hidden", "true");
          copia.setAttribute("data-bm-copia", "");
          cinta.append(copia);
          alSalir(() => copia.remove());
        });
        guarda += 1;
      }
    }
    cintas.push({ m, cinta, dir, w0: Math.max(1, w0), x: 0, visible: true });
  });

  if (cintas.length && "IntersectionObserver" in window) {
    const cintaIO = observar(new IntersectionObserver((es) => es.forEach((e) => {
      const q = cintas.find((c) => c.m === e.target);
      if (q) q.visible = e.isIntersecting;
    })));
    cintas.forEach((q) => cintaIO.observe(q.m));
  }

  let ultimoSentido = 1;
  function fotogramaCinta(dt: number): void {
    if (reducido) return;
    const y = window.scrollY;
    const v = (y - anteriorY) / Math.max(dt, 0.001);
    anteriorY = y;
    velocidadScroll += (v - velocidadScroll) * Math.min(1, dt * 6);
    if (velocidadScroll > 30) ultimoSentido = 1;
    else if (velocidadScroll < -30) ultimoSentido = -1;
    const empuje = 1 + Math.min(7, Math.abs(velocidadScroll) / 260);
    cintas.forEach((q) => {
      if (!q.visible) return;
      q.x -= 46 * empuje * q.dir * ultimoSentido * dt;
      if (q.x <= -q.w0) q.x += q.w0;
      if (q.x > 0) q.x -= q.w0;
      diario.estilo(q.cinta, "transform", `translate3d(${q.x.toFixed(2)}px,0,0)`);
    });
  }

  /* ============================================================
     Inclinación del panel del héroe con el puntero
  ============================================================ */
  function fotogramaHeroe(): void {
    if (!P || !fino || reducido) return;
    escenas.forEach((s) => {
      if (s.nombre !== "crm-hero" || s.estrecha || s.p >= 1 || s.p < 0) return;
      const k = 1 - s.a;
      const tx = (-P.puntero.y * 5 * k).toFixed(2);
      const ty = (P.puntero.x * 7 * k).toFixed(2);
      if (tx === inclinacionEscena.tx && ty === inclinacionEscena.ty) return;
      inclinacionEscena.tx = tx;
      inclinacionEscena.ty = ty;
      diario.estilo(s.el, "--tx", `${tx}deg`);
      diario.estilo(s.el, "--ty", `${ty}deg`);
    });
  }

  /* ============================================================
     Elementos que siguen al puntero (exponen --px y --py de -1 a 1)
  ============================================================ */
  interface SeguidorPuntero {
    el: HTMLElement;
    visible: boolean;
    x: string;
    y: string;
  }
  const seguidores: SeguidorPuntero[] = todos("[data-pointer]").map((el) => ({
    el,
    visible: true,
    // Valor imposible: fuerza la primera escritura.
    x: "9",
    y: "9",
  }));

  if (seguidores.length && "IntersectionObserver" in window) {
    const punteroIO = observar(new IntersectionObserver((es) => es.forEach((e) => {
      const q = seguidores.find((o) => o.el === e.target);
      if (q) q.visible = e.isIntersecting;
    })));
    seguidores.forEach((q) => punteroIO.observe(q.el));
  }

  function fotogramaPuntero(): void {
    if (!P || !fino || reducido) return;
    const x = P.puntero.x.toFixed(3);
    const y = P.puntero.y.toFixed(3);
    seguidores.forEach((q) => {
      if (!q.visible || (q.x === x && q.y === y)) return;
      q.x = x;
      q.y = y;
      diario.estilo(q.el, "--px", x);
      diario.estilo(q.el, "--py", y);
    });
  }

  /* ============================================================
     El bucle
  ============================================================ */
  let ultimaYPintada = -1;
  let ultimaAnchura = window.innerWidth;

  const invalidar = (): void => {
    ultimaYPintada = -1;
  };

  function fotograma(dt: number): void {
    if (!vivo) return;
    if (window.scrollY !== ultimaYPintada) {
      ultimaYPintada = window.scrollY;
      fotogramaScroll();
    }
    fotogramaCinta(dt || 0.016);
    fotogramaHeroe();
    fotogramaPuntero();
  }

  medir();
  fotogramaScroll();

  if (P) {
    // Las partículas ya tienen un bucle con su propio control de visibilidad
    // (se duerme con la pestaña): nos apuntamos a él en vez de abrir otro.
    alSalir(P.registrarBucle((dt) => fotograma(dt)));
  } else {
    let t0 = window.performance.now();
    const bucle = (t: number): void => {
      fotograma(Math.min(0.05, (t - t0) / 1000));
      t0 = t;
      pedirFotograma(bucle);
    };
    pedirFotograma(bucle);
  }

  escuchar(window, "resize", () => {
    // La barra del navegador móvil cambia el alto al hacer scroll: si la
    // anchura no cambia, no hay nada que recalcular.
    if (window.innerWidth === ultimaAnchura && window.innerWidth <= 900) return;
    ultimaAnchura = window.innerWidth;
    medir();
    invalidar();
  });

  // En el sitio estático bastaba con escuchar 'load'. En la SPA, cuando este
  // componente se monta la página suele estar cargada desde hace rato y ese
  // evento ya no vuelve a dispararse: si ya está completa, medimos y punto.
  if (doc.readyState !== "complete") {
    escuchar(window, "load", () => {
      medir();
      invalidar();
    });
  }

  doc.fonts?.ready.then(() => {
    // Las tipografías cambian la altura de los titulares.
    if (!vivo) return;
    medir();
    invalidar();
  }).catch(() => { /* sin tipografías propias */ });

  // Volver con el botón «atrás» desde la caché del navegador.
  escuchar(window, "pageshow", (e) => {
    if (!e.persisted) return;
    medir();
    invalidar();
  });

  /* ============================================================
     Inclinación 3D de tarjetas
  ============================================================ */
  if (fino && !reducido) {
    todos("[data-tilt]").forEach((el) => {
      const max = Number(el.dataset.tilt) || 7;
      escuchar(el, "pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        diario.clase(el, "is-tilting", true);
        diario.estilo(el, "--rx", `${((0.5 - y) * max).toFixed(2)}deg`);
        diario.estilo(el, "--ry", `${((x - 0.5) * max).toFixed(2)}deg`);
        diario.estilo(el, "--gx", `${(x * 100).toFixed(1)}%`);
        diario.estilo(el, "--gy", `${(y * 100).toFixed(1)}%`);
      });
      escuchar(el, "pointerleave", () => {
        diario.clase(el, "is-tilting", false);
        diario.estilo(el, "--rx", "0deg");
        diario.estilo(el, "--ry", "0deg");
      });
    });
  }

  /* ============================================================
     Contadores
  ============================================================ */
  /* Un formateador por número de decimales: el original creaba uno nuevo en
     cada fotograma y aquí eso son miles de objetos por visita. */
  const formateadores = new Map<number, Intl.NumberFormat>();
  const numero = (v: number, decimales: number): string => {
    let f = formateadores.get(decimales);
    if (!f) {
      f = new Intl.NumberFormat(textos.localeNumeros, {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
      });
      formateadores.set(decimales, f);
    }
    return f.format(v);
  };

  const contadorIO = observar(new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      contadorIO.unobserve(e.target);
      const el = e.target as HTMLElement;
      const hasta = parseFloat(el.dataset.count ?? "");
      const decimales = parseInt(el.dataset.decimals || "0", 10);
      const antes = el.dataset.prefix || "";
      const despues = el.dataset.suffix || "";
      if (reducido) {
        diario.texto(el, antes + numero(hasta, decimales) + despues);
        return;
      }
      const t0 = window.performance.now();
      const paso = (t: number): void => {
        const k = limitar((t - t0) / 1800);
        diario.texto(el, antes + numero(hasta * (k === 1 ? 1 : 1 - Math.pow(2, -10 * k)), decimales) + despues);
        if (k < 1) pedirFotograma(paso);
      };
      pedirFotograma(paso);
    });
  }, { threshold: 0.6 }));

  todos("[data-count]").forEach((el) => {
    if (!reducido && el.getBoundingClientRect().top > window.innerHeight) {
      diario.texto(
        el,
        (el.dataset.prefix || "") + numero(0, parseInt(el.dataset.decimals || "0", 10)) + (el.dataset.suffix || ""),
      );
    }
    contadorIO.observe(el);
  });

  /* ============================================================
     Pestañas
  ============================================================ */
  todos("[data-tabs]").forEach((w) => {
    const botones = todos('[role="tab"]', w);
    if (!botones.length) return;
    const marca = uno(".tabs__ind", w);
    const paneles = botones.map((b) => porId(b.getAttribute("aria-controls")));

    const colocar = (b: HTMLElement | undefined, alInstante?: boolean): void => {
      if (!marca || !b) return;
      if (alInstante) diario.estilo(marca, "transition", "none");
      diario.estilo(marca, "width", `${b.offsetWidth}px`);
      diario.estilo(marca, "transform", `translateX(${b.offsetLeft - 5}px)`);
      if (alInstante) pedirFotograma(() => diario.estilo(marca, "transition", ""));
    };

    const actual = (): HTMLElement | undefined => botones.find((b) => b.getAttribute("aria-selected") === "true");

    const elegir = (i: number, conFoco?: boolean): void => {
      botones.forEach((b, k) => {
        const on = k === i;
        diario.atributo(b, "aria-selected", String(on));
        diario.atributo(b, "tabindex", on ? "0" : "-1");
        const panel = paneles[k];
        if (panel) diario.atributo(panel, "hidden", on ? null : "");
      });
      colocar(botones[i]);
      if (conFoco) botones[i]?.focus();
    };

    botones.forEach((b, i) => {
      escuchar(b, "click", () => elegir(i));
      escuchar(b, "keydown", (e) => {
        const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        elegir((i + d + botones.length) % botones.length, true);
      });
    });

    const seleccionada = actual();
    elegir(Math.max(0, seleccionada ? botones.indexOf(seleccionada) : -1));
    colocar(actual(), true);
    escuchar(window, "resize", () => colocar(actual(), true));
    doc.fonts?.ready.then(() => {
      if (vivo) colocar(actual(), true);
    }).catch(() => { /* sin tipografías propias */ });
  });

  /* ============================================================
     Preguntas frecuentes
  ============================================================ */
  todos(".faq").forEach((grupo) => {
    const items = todos(".faq__item", grupo);
    const ponerItem = (item: HTMLElement, abierto: boolean): void => {
      diario.clase(item, "is-open", abierto);
      const pregunta = uno(".faq__q", item);
      const respuesta = uno(".faq__a", item);
      if (pregunta) diario.atributo(pregunta, "aria-expanded", String(abierto));
      if (respuesta) diario.atributo(respuesta, "inert", abierto ? null : "");
    };

    items.forEach((item) => {
      const pregunta = uno(".faq__q", item);
      const respuesta = uno(".faq__a", item);
      if (!pregunta || !respuesta) return;
      secuenciaFaq += 1;
      diario.atributo(pregunta, "id", `faq-q-${secuenciaFaq}`);
      diario.atributo(respuesta, "id", `faq-a-${secuenciaFaq}`);
      diario.atributo(pregunta, "aria-controls", respuesta.id);
      diario.atributo(respuesta, "role", "region");
      diario.atributo(respuesta, "aria-labelledby", pregunta.id);
      if (!uno(".i", pregunta)) {
        const icono = doc.createElement("i");
        icono.className = "i i-plus";
        icono.setAttribute("aria-hidden", "true");
        pregunta.append(icono);
        alSalir(() => icono.remove());
      }
      ponerItem(item, item.classList.contains("is-open"));
      escuchar(pregunta, "click", () => {
        const abierto = !item.classList.contains("is-open");
        items.forEach((otro) => {
          if (otro !== item) ponerItem(otro, false);
        });
        ponerItem(item, abierto);
      });
    });
  });

  /* ============================================================
     Calculadora de rentabilidad (en la moneda del país elegido)
  ============================================================ */
  todos("[data-roi]").forEach((form) => {
    const mandos = todos<HTMLInputElement>('input[type="range"]', form);
    const selector = uno<HTMLSelectElement>("[data-money-select]", form);
    const precio = uno<HTMLInputElement>("input[data-money]", form);
    let codigo = "es";

    const escribir = (nombre: string, txt: string): void => {
      todos(`[data-res="${nombre}"]`, form).forEach((el) => diario.texto(el, txt));
    };

    const calcular = (): void => {
      const v: Record<string, number> = {};
      mandos.forEach((i) => {
        v[i.name] = Number(i.value);
        const min = Number(i.min);
        const max = Number(i.max);
        diario.estilo(i, "--fill", `${((Number(i.value) - min) / (max - min)) * 100}%`);
        const salida = uno(`[data-out="${i.name}"]`, form);
        if (salida) {
          diario.texto(
            salida,
            i.hasAttribute("data-money")
              ? formatearDinero(Number(i.value), codigo)
              : `${i.value}${i.dataset.unit || ""}`,
          );
        }
      });

      const perdido = v.citas * 4.33 * v.ticket * (v.ausencias / 100);
      const recuperado = perdido * (v.recupera / 100);
      escribir("perdida", formatearDinero(perdido, codigo));
      escribir("recupera", formatearDinero(recuperado, codigo));
      escribir("anual", formatearDinero(recuperado * 12, codigo));
      // La altura de las columnas se compara con un negocio tipo de cada país.
      const referencia = (8000 * pais(codigo).range[3]) / 35;
      const lv = 0.42 + 0.58 * Math.sqrt(limitar(perdido / referencia));
      diario.estilo(form, "--lostv", lv.toFixed(3));
      diario.estilo(form, "--backv", Math.max(0.05, lv * (v.recupera / 100)).toFixed(3));
    };

    // País y moneda: cambian el rango del precio medio y el formato de los importes.
    const ponerPais = (c: string, mantenerPrecio: boolean): void => {
      codigo = pais(c).code;
      const cfg = pais(codigo);
      if (precio) {
        const [min, max, step, porDefecto] = cfg.range;
        diario.atributo(precio, "min", String(min));
        diario.atributo(precio, "max", String(max));
        diario.atributo(precio, "step", String(step));
        diario.valor(precio, String(mantenerPrecio ? limitar(Number(precio.value), min, max) : porDefecto));
      }
      const salida = uno('[data-out="moneda"]', form);
      if (salida) diario.texto(salida, cfg.cur);
      calcular();
    };

    if (selector) {
      // El valor se apunta antes de vaciar el desplegable: al quitar los
      // <option> se pierde, y al desmontar hay que poder devolverlo.
      diario.guardarValor(selector);
      diario.html(selector, "");
      PAISES.forEach((c) => {
        const opcion = doc.createElement("option");
        opcion.value = c.code;
        // Los dos países genéricos ("otro país") ya llevan la moneda en el nombre.
        const generico = esGenerico(c.code);
        opcion.textContent = textos.etiquetaPais({
          code: c.code,
          cur: c.cur,
          nombre: c.name,
          moneda: generico ? null : c.curName,
          generico,
        });
        selector.append(opcion);
      });
      diario.valor(selector, paisProbable());
      escuchar(selector, "change", () => ponerPais(selector.value, false));
      ponerPais(selector.value, false);
    }

    mandos.forEach((i) => escuchar(i, "input", calcular));
    calcular();
  });

  /* ============================================================
     Demos de chat que se reproducen al entrar en pantalla
  ============================================================ */
  todos("[data-chat-demo]").forEach((demo) => {
    const globos = todos(".bubble", demo);
    const escribiendo = uno(".typing", demo);
    const listaNotas = demo.dataset.annots ? porId(demo.dataset.annots) : null;
    const notas = listaNotas ? todos("li", listaNotas) : [];

    // El indicador de «escribiendo» se mueve delante de cada globo del bot,
    // así que apuntamos de dónde salió para devolverlo al desmontar.
    if (escribiendo) {
      const padre = escribiendo.parentNode;
      const hermano = escribiendo.nextSibling;
      if (padre) alSalir(() => padre.insertBefore(escribiendo, hermano));
    }

    let relojes: number[] = [];
    const reiniciar = (): void => {
      relojes.forEach(olvidar);
      relojes = [];
      globos.forEach((b) => diario.clase(b, "is-shown", false));
      if (escribiendo) diario.clase(escribiendo, "is-on", false);
      notas.forEach((a) => diario.clase(a, "is-on", false));
    };

    const reproducir = (): void => {
      reiniciar();
      let t = 350;
      globos.forEach((b) => {
        const esBot = b.classList.contains("bubble--out");
        if (esBot && escribiendo) {
          relojes.push(esperar(() => {
            b.before(escribiendo);
            diario.clase(escribiendo, "is-on", true);
          }, t));
          t += 950;
        }
        relojes.push(esperar(() => {
          if (escribiendo) diario.clase(escribiendo, "is-on", false);
          diario.clase(b, "is-shown", true);
          if (b.dataset.annot !== undefined) {
            notas.forEach((a, i) => diario.clase(a, "is-on", String(i) === b.dataset.annot));
          }
        }, t));
        t += esBot ? 1500 : 1000;
      });
    };

    if (reducido) {
      // Sin animación, la conversación se enseña entera.
      globos.forEach((b) => diario.clase(b, "is-shown", true));
      notas.forEach((a) => diario.clase(a, "is-on", true));
    } else {
      const io = observar(new IntersectionObserver((es) => {
        if (es.some((e) => e.isIntersecting)) {
          io.disconnect();
          reproducir();
        }
      }, { threshold: 0.35 }));
      io.observe(demo);
    }

    const repetir = uno("[data-chat-replay]", demo);
    if (repetir) {
      escuchar(repetir, "click", () => {
        if (!reducido) reproducir();
      });
    }
  });

  /* ============================================================
     Testimonios
  ============================================================ */
  todos("[data-carousel]").forEach((c) => {
    const voces = todos(".voice", c);
    const avatares = todos(".voices__av", c);
    const contador = uno("[data-current]", c);
    let i = 0;

    const ir = (n: number): void => {
      if (!voces.length) return;
      i = (n + voces.length) % voces.length;
      voces.forEach((s, k) => {
        diario.clase(s, "is-active", k === i);
        diario.atributo(s, "inert", k !== i ? "" : null);
      });
      avatares.forEach((a, k) => diario.clase(a, "is-active", k === i));
      if (contador) diario.texto(contador, String(i + 1));
    };

    const anterior = uno("[data-prev]", c);
    const siguiente = uno("[data-next]", c);
    if (anterior) escuchar(anterior, "click", () => ir(i - 1));
    if (siguiente) escuchar(siguiente, "click", () => ir(i + 1));
    escuchar(c, "keydown", (e) => {
      if (e.key === "ArrowLeft") ir(i - 1);
      if (e.key === "ArrowRight") ir(i + 1);
    });

    let inicioX = 0;
    escuchar(c, "touchstart", (e) => {
      inicioX = e.touches[0].clientX;
    }, { passive: true });
    escuchar(c, "touchend", (e) => {
      const dx = e.changedTouches[0].clientX - inicioX;
      if (Math.abs(dx) > 50) ir(i + (dx < 0 ? 1 : -1));
    });

    diario.clase(c, "is-ready", true);
    ir(0);
  });

  /* ============================================================
     Conmutador de modo claro / oscuro (demostración de la app)
  ============================================================ */
  todos("[data-theme-demo]").forEach((sec) => {
    const botones = todos("[data-mode-btn]", sec);
    const poner = (modo: string): void => {
      diario.atributo(sec, "data-mode", modo);
      botones.forEach((b) => diario.atributo(b, "aria-pressed", String(b.dataset.modeBtn === modo)));
    };
    botones.forEach((b) => escuchar(b, "click", () => poner(b.dataset.modeBtn ?? "")));
  });

  /* ============================================================
     Newsletter
  ============================================================ */
  todos<HTMLFormElement>("[data-newsletter]").forEach((f) => {
    escuchar(f, "submit", (e) => {
      e.preventDefault();
      const campo = f.elements.namedItem("email");
      const correo = campo instanceof HTMLInputElement ? campo.value.trim() : "";
      const aviso = uno(".news__msg", f);
      const decir = (txt: string): void => {
        if (aviso) diario.texto(aviso, txt);
      };
      const endpoint = f.dataset.endpoint;

      if (endpoint) {
        void (async () => {
          try {
            const r = await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: correo, origen: "newsletter" }),
            });
            if (!r.ok) throw new Error(String(r.status));
            // Si el visitante ya se fue de la landing, no tocamos nada.
            if (!vivo) return;
            decir(textos.newsletterHecho);
            f.reset();
          } catch {
            if (vivo) decir(textos.newsletterFallo);
          }
        })();
        return;
      }

      // Sin endpoint, el alta se manda por correo. Un mailto no descarga la
      // página, así que la SPA sigue viva y el aviso se queda en pantalla.
      const cuerpo = textos.newsletterCuerpo(correo);
      const asunto = encodeURIComponent(textos.newsletterAsunto);
      window.location.href = `mailto:${correoNewsletter}?subject=${asunto}&body=${encodeURIComponent(cuerpo)}`;
      decir(textos.newsletterPorCorreo);
    });
  });

  /* ============================================================
     Índice de las páginas legales
  ============================================================ */
  const indice = uno("[data-toc]");
  if (indice) {
    const enlaces = todos<HTMLAnchorElement>('a[href^="#"]', indice);
    const porDestino = new Map<string, HTMLAnchorElement>(
      enlaces.map((a) => [(a.getAttribute("href") ?? "").slice(1), a]),
    );
    const indiceIO = observar(new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        enlaces.forEach((a) => diario.clase(a, "is-active", false));
        const activo = porDestino.get(e.target.id);
        if (activo) diario.clase(activo, "is-active", true);
      });
    }, { rootMargin: "-18% 0px -72% 0px" }));
    porDestino.forEach((_, id) => {
      const seccion = porId(id);
      if (seccion) indiceIO.observe(seccion);
    });
  }

  /* ============================================================
     Apagado
  ============================================================ */
  const detenerMotor = (): void => {
    if (!vivo) return;
    vivo = false;
    if (ENCENDIDOS.get(nodo) === detenerMotor) ENCENDIDOS.delete(nodo);
    // En orden inverso: lo último que se montó es lo primero que se va.
    for (let i = limpiezas.length - 1; i >= 0; i -= 1) {
      try {
        limpiezas[i]();
      } catch {
        /* el desmontaje no puede romperse a medias */
      }
    }
    limpiezas.length = 0;
    // Y al final el DOM, que vuelve a ser el que pintó React.
    diario.deshacer();
  };

  ENCENDIDOS.set(nodo, detenerMotor);
  return detenerMotor;
}
