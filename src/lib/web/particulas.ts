/* ============================================================
   Partículas 3D de la web pública (lienzo 2D, sin librerías)
   ------------------------------------------------------------
   Puerto del js/particles.js de la landing estática. Dos piezas:

     · campoDeEstrellas(lienzo) → campo de estrellas con
       profundidad. Sigue al puntero, acelera con el scroll y
       hace el salto a la velocidad de la luz al elegir portal.

     · escultura(lienzo, opciones) → nube de puntos que forma
       figuras en 3D y pasa de una a otra con física de muelle
       (logo, phone, bars, sphere, core, globe). Los puntos se
       apartan del cursor.

   Los colores NO están aquí: salen de las variables CSS del
   tema (--mint-rgb y --lime-rgb) leídas del propio lienzo, así
   que el verde del logo en la App y el lima del CRM los decide
   la hoja de estilos. tintar(nodo) los vuelve a leer de otro
   elemento y la nube transiciona de color sola.

   DIFERENCIA GRANDE CON EL ORIGINAL: allí esto era un IIFE que
   se montaba al cargar la página y vivía hasta la recarga; aquí
   la landing es una SPA que se monta y se desmonta muchas veces
   en la misma pestaña. Por eso:

     · nada de window/document fuera de las funciones de
       arranque (Next evalúa el módulo también en el servidor),
     · cada arranque devuelve SU función de parada, que es a la
       vez el objeto con los mandos (ver ControlCampo),
     · el estado compartido (puntero, scroll, bucle único,
       IntersectionObserver) se monta con el primer lienzo y se
       desmonta con el último, por recuento de usos. Sin eso
       quedaría un requestAnimationFrame girando para siempre
       por cada visita a la landing.

   Solo se anima lo que está en pantalla y nada se anima con la
   pestaña oculta. Con "reducir movimiento" se dibuja un único
   fotograma quieto, nunca un lienzo en blanco.
============================================================ */

/** Un tono del tema en RGB. */
export type Tono = readonly [number, number, number];

/**
 * Los cinco tonos que gastan las figuras, por índice:
 * 0 acento · 1 blanco · 2 acento secundario · 3 acento tenue · 4 mar (globo).
 */
export type Paleta = readonly Tono[];

/** Función de dibujo del bucle compartido: dt en segundos, t en segundos desde el arranque. */
export type Bucle = (dt: number, t: number) => void;

/** Medidas del lienzo en píxeles reales de pantalla. */
interface Medidas {
  w: number;
  h: number;
  /** devicePixelRatio con el que se calcularon (tope 2). */
  d: number;
}

/**
 * Mandos del campo de estrellas. El objeto ES la función de parada: se puede
 * devolver tal cual desde un useEffect y además lleva los mandos colgados.
 */
export interface ControlCampo {
  /** Para el campo y deja el DOM como estaba. */
  (): void;
  /** Lo mismo que llamarlo, para cuando se lee mejor con nombre. */
  parar(): void;
  /** Salto a la velocidad de la luz: estira las estrellas en líneas. 0 vuelve a la calma. */
  salto(v: number): void;
  /** Relee los colores del tema desde otro elemento (null = el propio lienzo). */
  tintar(nodo?: Element | null): void;
  /** Mismo mando que `salto`, con el nombre que tenía en el original. */
  warp(v: number): void;
  /** Mismo mando que `tintar`, con el nombre que tenía en el original. */
  tint(nodo?: Element | null): void;
}

/** Mandos de la escultura. Igual que ControlCampo: el objeto es la parada. */
export interface ControlEscultura {
  /** Para la escultura y deja el DOM como estaba. */
  (): void;
  /** Lo mismo que llamarlo, para cuando se lee mejor con nombre. */
  parar(): void;
  /** Pasa a otra figura con física de muelle. Nombres desconocidos se ignoran. */
  cambiarA(nombre: string): void;
  /** Estalla hacia fuera (al elegir portal en la entrada). */
  estallar(): void;
  /** Deshace el estallido y recompone la figura. */
  reiniciar(): void;
  /** Gira hasta ese ángulo en radianes (suavizado). */
  girarA(rad: number): void;
  /** Cambia la velocidad de giro de base. */
  velocidadDeGiro(v: number): void;
  /** Relee los colores del tema desde otro elemento (null = el propio lienzo). */
  tintar(nodo?: Element | null): void;
  /** Figura que se está mostrando. */
  readonly figura: NombreFigura;
  /* Los mismos mandos con los nombres del original, para que el código
     portado de intro.js y site.js encaje sin tener que traducirlo. */
  morph(nombre: string): void;
  burst(): void;
  reset(): void;
  turn(rad: number): void;
  spin(v: number): void;
  tint(nodo?: Element | null): void;
  readonly shape: NombreFigura;
}

/**
 * Opciones del campo de estrellas. Los nombres se quedan en inglés a propósito:
 * son los mismos que pasaban las páginas originales y los mismos que leen los
 * atributos data-* del marcado, así que renombrarlos solo rompería el calco.
 */
export interface OpcionesCampo {
  /** Cuántas estrellas. Por defecto 110 en móvil y 230 en escritorio. */
  count?: number;
  /** Velocidad de acercamiento de base. Por defecto 0.045. */
  speed?: number;
  /** Altura del punto de fuga, de 0 (arriba) a 1 (abajo). Por defecto 0.5. */
  cy?: number;
}

/** Un punto fijo marcado sobre el globo (el mapa de "Quiénes somos"). */
export interface MarcadorGlobo {
  lat: number;
  lon: number;
}

/** Opciones de la escultura. Mismos nombres que el original, por lo mismo que arriba. */
export interface OpcionesEscultura {
  /** Figuras que podrá tomar. Lo que no sea una figura conocida se descarta. */
  shapes?: readonly string[];
  /** Con cuál empieza. Si no es una de las anteriores, usa la primera. */
  initial?: string;
  /** Cuántos puntos. Por defecto 720 en móvil y 1250 en escritorio. */
  count?: number;
  /** Cuánto cabe en el lienzo: más alto, figura más pequeña. Por defecto 1.3. */
  extent?: number;
  /** Multiplicador del tamaño de cada punto. Por defecto 1. */
  size?: number;
  /** Amplitud del vaivén en radianes. 0 = gira entera sin parar. Por defecto 0.55. */
  swing?: number;
  /** Inclinación fija sobre el eje X. Por defecto 0.1. */
  tilt?: number;
  /** Si los puntos se apartan del cursor. Por defecto sí. */
  repel?: boolean;
  /** Velocidad de giro. Por defecto 0.35. */
  spin?: number;
  /** Ángulo de salida, para que dos esculturas no vayan a la vez. */
  phase?: number;
  /** Puntos marcados con un pulso (solo tiene sentido con la figura "globe"). */
  markers?: readonly MarcadorGlobo[];
}

/* ------------------------------------------------------------
   Medios y medidas
------------------------------------------------------------ */

/** Se consulta en cada arranque, no al cargar el módulo: en SSR no hay matchMedia. */
export function movimientoReducido(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Ratón o lápiz de verdad: con dedo no hay "seguir al puntero" que seguir. */
export function punteroFino(): boolean {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

// Más de 2x no se nota y cuesta el doble de píxeles que pintar.
const dprDe = (): number => Math.min(2, window.devicePixelRatio || 1);

const medidasDe = (lienzo: HTMLCanvasElement): Medidas => {
  const d = dprDe();
  return {
    w: Math.max(1, Math.round(lienzo.clientWidth * d)),
    h: Math.max(1, Math.round(lienzo.clientHeight * d)),
    d,
  };
};

/**
 * Mantiene el lienzo a su medida real en píxeles de pantalla y avisa cuando
 * cambia. El original solo escuchaba el "resize" de la ventana; aquí hace
 * falta además un ResizeObserver por dos motivos de la SPA: el lienzo cambia
 * de tamaño sin que la ventana se mueva (al montarse la sección, al abrirse un
 * menú) y en el primer fotograma todavía puede medir cero, que es justo cuando
 * con movimiento reducido se dibujaría el único fotograma y quedaría en blanco.
 * El "resize" de la ventana se queda porque el ResizeObserver no se entera de
 * un cambio de devicePixelRatio (mover la ventana a otra pantalla, zoom).
 */
function vigilarMedidas(lienzo: HTMLCanvasElement, alMedir: (m: Medidas) => void): () => void {
  let ultimas: Medidas | null = null;
  const revisar = (): void => {
    const m = medidasDe(lienzo);
    if (ultimas && m.w === ultimas.w && m.h === ultimas.h && m.d === ultimas.d) return;
    ultimas = m;
    // Escribir width/height borra el lienzo, así que solo se toca si cambia.
    if (lienzo.width !== m.w) lienzo.width = m.w;
    if (lienzo.height !== m.h) lienzo.height = m.h;
    alMedir(m);
  };
  revisar();
  window.addEventListener("resize", revisar);
  const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(revisar);
  ro?.observe(lienzo);
  return () => {
    window.removeEventListener("resize", revisar);
    ro?.disconnect();
  };
}

/* ------------------------------------------------------------
   Estado compartido: puntero, scroll y un solo bucle para todo
------------------------------------------------------------ */

/** Puntero compartido, en coordenadas de -1 a 1 (x, y suavizados; tx, ty crudos). */
export interface Puntero {
  /** Posición suavizada, de -1 a 1. */
  x: number;
  y: number;
  /** Posición cruda del último evento, de -1 a 1. */
  tx: number;
  ty: number;
  /** Posición en píxeles de ventana (para apartar los puntos del cursor). */
  cx: number;
  cy: number;
  /** Si hay un puntero de verdad encima de la página. */
  on: boolean;
}

const PUNTERO_INICIAL: Puntero = { x: 0, y: 0, tx: 0, ty: 0, cx: -1e5, cy: -1e5, on: false };

/**
 * Objeto vivo: quien lo lea dentro de un bucle ve el valor del fotograma.
 * Solo se mueve mientras haya algo arrancado (un lienzo o seguirPuntero()).
 */
export const puntero: Puntero = { ...PUNTERO_INICIAL };

let velocidadScroll = 0;
let ultimoY = 0;

const activos = new Set<Bucle>();
// Qué bucles vigila cada nodo. En el original era una propiedad "bmLoop" sobre
// el nodo; aquí es un Map para no ensuciar el DOM y poder vaciarlo al desmontar.
const buclesPorNodo = new Map<Element, Set<Bucle>>();

let raf = 0;
let ultimoTiempo = 0;
let io: IntersectionObserver | null = null;
let usos = 0;
let desmontarEntorno: (() => void) | null = null;

function tick(ahora: number): void {
  const dt = Math.min(0.05, (ahora - ultimoTiempo) / 1000);
  ultimoTiempo = ahora;
  const s = Math.min(1, dt * 3);
  puntero.x += (puntero.tx - puntero.x) * s;
  puntero.y += (puntero.ty - puntero.y) * s;
  velocidadScroll *= Math.pow(0.02, dt);
  activos.forEach((fn) => fn(dt, ahora / 1000));
  raf = activos.size ? requestAnimationFrame(tick) : 0;
}

function despertar(): void {
  if (raf || !usos || !activos.size || document.hidden) return;
  ultimoTiempo = performance.now();
  raf = requestAnimationFrame(tick);
}

/**
 * Monta el estado compartido con el primer uso y lo desmonta con el último.
 * Devuelve la función de suelta, que es idempotente: llamarla dos veces no
 * descuenta dos usos.
 */
function arrancarEntorno(): () => void {
  if (usos === 0) {
    const alMoverPuntero = (e: PointerEvent): void => {
      puntero.tx = (e.clientX / window.innerWidth) * 2 - 1;
      puntero.ty = (e.clientY / window.innerHeight) * 2 - 1;
      puntero.cx = e.clientX;
      puntero.cy = e.clientY;
      puntero.on = e.pointerType !== "touch";
    };
    // Sin relatedTarget el puntero se ha ido de la ventana, no a otro elemento.
    const alSalirDeLaVentana = (e: MouseEvent): void => {
      if (e.relatedTarget) return;
      puntero.on = false;
      puntero.tx = 0;
      puntero.ty = 0;
    };
    const alHacerScroll = (): void => {
      const d = window.scrollY - ultimoY;
      ultimoY = window.scrollY;
      velocidadScroll = Math.max(-90, Math.min(90, velocidadScroll + d * 0.2));
    };
    const alCambiarVisibilidad = (): void => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else despertar();
    };

    ultimoY = window.scrollY;
    window.addEventListener("pointermove", alMoverPuntero, { passive: true });
    document.addEventListener("mouseout", alSalirDeLaVentana);
    window.addEventListener("scroll", alHacerScroll, { passive: true });
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    // 160px de margen: se despierta justo antes de entrar en pantalla.
    io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entradas) => {
              entradas.forEach((en) => {
                const bucles = buclesPorNodo.get(en.target);
                if (!bucles) return;
                bucles.forEach((fn) => {
                  if (en.isIntersecting) activos.add(fn);
                  else activos.delete(fn);
                });
              });
              despertar();
            },
            { rootMargin: "160px 0px" },
          );

    desmontarEntorno = () => {
      window.removeEventListener("pointermove", alMoverPuntero);
      document.removeEventListener("mouseout", alSalirDeLaVentana);
      window.removeEventListener("scroll", alHacerScroll);
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      cancelAnimationFrame(raf);
      raf = 0;
      io?.disconnect();
      io = null;
      activos.clear();
      buclesPorNodo.clear();
      // Que la próxima visita empiece como empezaba al cargar la página.
      Object.assign(puntero, PUNTERO_INICIAL);
      velocidadScroll = 0;
    };
  }
  usos += 1;
  let soltado = false;
  return () => {
    if (soltado) return;
    soltado = true;
    usos -= 1;
    if (usos === 0 && desmontarEntorno) {
      desmontarEntorno();
      desmontarEntorno = null;
    }
  };
}

/**
 * Mantiene vivo el puntero compartido sin dibujar nada, para quien solo quiera
 * leer `puntero`. Devuelve la suelta. (Antes esto no hacía falta: los escuchas
 * se montaban al cargar el script y no se quitaban nunca.)
 */
export function seguirPuntero(): () => void {
  return arrancarEntorno();
}

/**
 * Apunta una función al bucle compartido. Con nodo, solo corre mientras ese
 * nodo esté a la vista. Devuelve la función que la desapunta.
 */
export function registrarBucle(fn: Bucle, nodo?: Element | null): () => void {
  const soltar = arrancarEntorno();
  if (nodo && io) {
    let bucles = buclesPorNodo.get(nodo);
    if (!bucles) {
      bucles = new Set();
      buclesPorNodo.set(nodo, bucles);
      io.observe(nodo);
    }
    bucles.add(fn);
  } else {
    activos.add(fn);
    despertar();
  }
  let parado = false;
  return () => {
    if (parado) return;
    parado = true;
    activos.delete(fn);
    if (nodo) {
      const bucles = buclesPorNodo.get(nodo);
      if (bucles) {
        bucles.delete(fn);
        if (!bucles.size) {
          buclesPorNodo.delete(nodo);
          io?.unobserve(nodo);
        }
      }
    }
    soltar();
  };
}

/* ------------------------------------------------------------
   Colores del tema
------------------------------------------------------------ */

const rgbDe = (nodo: Element | null | undefined, nombre: string, respaldo: Tono): Tono => {
  const m = getComputedStyle(nodo || document.documentElement)
    .getPropertyValue(nombre)
    .match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : respaldo;
};

const escalar = (t: Tono, k: number): Tono => [
  Math.round(t[0] * k),
  Math.round(t[1] * k),
  Math.round(t[2] * k),
];

/** Lee los cinco tonos de las variables CSS de ese elemento (o de :root). */
export function paleta(nodo?: Element | null): Paleta {
  const a = rgbDe(nodo, "--mint-rgb", [111, 193, 165]);
  const b = rgbDe(nodo, "--lime-rgb", [134, 227, 211]);
  return [a, [236, 250, 245], b, escalar(a, 0.7), escalar(a, 0.5)];
}

/* ------------------------------------------------------------
   Un solo arranque por lienzo
------------------------------------------------------------ */

// Arrancar dos veces sobre el mismo lienzo no debe dejar dos bucles pintando
// encima: el segundo arranque para el primero. Pasa de verdad con el doble
// montaje de React en desarrollo y al volver atrás en la SPA.
const instancias = new WeakMap<HTMLCanvasElement, () => void>();

const NADA = (): void => {};

/* ------------------------------------------------------------
   1 · Campo de estrellas 3D
------------------------------------------------------------ */

interface Estrella {
  x: number;
  y: number;
  z: number;
  /** Si lleva el color de acento en vez del blanco roto. */
  mint: boolean;
  /** Desfase del parpadeo. */
  tw: number;
}

export function campoDeEstrellas(lienzo: HTMLCanvasElement, opciones: OpcionesCampo = {}): ControlCampo {
  instancias.get(lienzo)?.();

  const ctx2d = lienzo.getContext("2d");
  // Si el lienzo ya se usó con otro tipo de contexto no hay nada que pintar.
  // El original petardeaba aquí y la página lo tragaba con su try/catch; aquí
  // se devuelven mandos que no hacen nada, para no tumbar el montaje de React.
  if (!ctx2d) {
    const vacio = (): void => {};
    return Object.assign(vacio, {
      parar: vacio,
      salto: vacio,
      tintar: vacio,
      warp: vacio,
      tint: vacio,
    });
  }
  // En una variable aparte porque TypeScript no se lleva el "no es null" de un
  // const hasta dentro de las funciones que lo usan.
  const ctx: CanvasRenderingContext2D = ctx2d;

  const reducido = movimientoReducido();
  const cuantas = opciones.count || (window.innerWidth < 700 ? 110 : 230);
  const nacer = (cualquierZ: boolean): Estrella => ({
    x: (Math.random() * 2 - 1) * 1.8,
    y: (Math.random() * 2 - 1) * 1.1,
    z: cualquierZ ? 0.06 + Math.random() * 0.94 : 1,
    mint: Math.random() < 0.24,
    tw: Math.random() * 6.28,
  });
  const estrellas = Array.from({ length: cuantas }, () => nacer(true));
  const base = opciones.speed ?? 0.045;
  let saltoActual = 0;
  let saltoDestino = 0;
  let tono = paleta(lienzo)[0].join(",");
  // Valor de arranque: vigilarMedidas lo sustituye por el real antes de dibujar.
  let S: Medidas = { w: 1, h: 1, d: 1 };

  function dibujar(dt: number, t: number): void {
    const { w, h, d } = S;
    ctx.clearRect(0, 0, w, h);
    saltoActual += (saltoDestino - saltoActual) * Math.min(1, dt * 2.2);
    const v = base + Math.abs(velocidadScroll) * 0.006 + saltoActual;
    const f = Math.max(w, h) * 0.42;
    const cx = w / 2;
    const cy = h * (opciones.cy ?? 0.5);
    for (const s of estrellas) {
      const pz = s.z;
      s.z -= v * dt;
      if (s.z < 0.06) Object.assign(s, nacer(false));
      const k = 1 - s.z;
      const ox = -puntero.x * k * 40 * d;
      const oy = -puntero.y * k * 26 * d;
      const x = cx + (s.x / s.z) * f + ox;
      const y = cy + (s.y / s.z) * f + oy;
      if (x < -30 || x > w + 30 || y < -30 || y > h + 30) continue;
      const a = Math.min(1, Math.pow(k, 1.25) * 1.15) * (0.7 + 0.3 * Math.sin(t * 1.7 + s.tw));
      const col = s.mint ? tono : "220,240,233";
      if (saltoActual > 0.2 && pz > s.z) {
        // En el salto cada estrella se pinta como la raya que ha recorrido.
        const x0 = cx + (s.x / Math.min(1, pz + saltoActual * 0.05)) * f + ox;
        const y0 = cy + (s.y / Math.min(1, pz + saltoActual * 0.05)) * f + oy;
        ctx.strokeStyle = `rgba(${col},${a})`;
        ctx.lineWidth = Math.max(1, k * 2.2 * d);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        ctx.fillStyle = `rgba(${col},${a})`;
        ctx.beginPath();
        ctx.arc(x, y, (0.35 + k * 1.8) * d, 0, 6.2832);
        ctx.fill();
      }
    }
  }

  const pararMedidas = vigilarMedidas(lienzo, (m) => {
    S = m;
    if (reducido) dibujar(0, 0);
  });
  let pararBucle = NADA;
  if (reducido) dibujar(0, 0);
  else pararBucle = registrarBucle(dibujar, lienzo);

  const parar = (): void => {
    pararBucle();
    pararBucle = NADA;
    pararMedidas();
    if (instancias.get(lienzo) === parar) instancias.delete(lienzo);
  };
  instancias.set(lienzo, parar);

  const salto = (v: number): void => {
    saltoDestino = reducido ? 0 : v;
  };
  const tintar = (nodo?: Element | null): void => {
    tono = paleta(nodo || lienzo)[0].join(",");
    if (reducido) dibujar(0, 0);
  };

  return Object.assign(parar, { parar, salto, tintar, warp: salto, tint: tintar });
}

/* ------------------------------------------------------------
   2 · Figuras: cada una da posiciones (p) y tono por punto (c)
------------------------------------------------------------ */

/** Posiciones (x,y,z por punto) y índice de tono de cada punto. */
interface Figura {
  p: Float32Array;
  c: Uint8Array;
}

// Opacidad de cada tono: el acento tenue y el mar se ven a media luz.
const ALFA_TONO = [1, 1, 1, 0.5, 0.3];

// Silueta del logo en pares x,y de 0 a 255. Los puntos a partir de
// LOGO_VERDE son la parte blanca de la marca.
const LOGO: readonly number[] = [
  66,113,92,58,172,132,154,240,49,31,103,37,133,191,215,42,134,124,95,208,81,33,211,175,202,76,144,27,72,41,
  172,142,133,139,193,36,228,85,69,42,146,196,196,140,128,33,131,201,221,50,255,79,112,227,203,224,104,208,49,34,
  161,205,213,208,44,133,104,31,101,79,164,29,228,197,195,53,222,102,174,139,239,55,180,192,177,49,208,202,211,107,
  224,198,72,66,180,45,198,206,221,202,157,231,183,67,225,126,148,44,164,195,88,34,86,201,150,33,86,222,85,74,
  108,168,114,189,121,141,49,110,124,152,177,148,152,123,42,106,254,88,246,64,221,87,101,40,203,204,62,106,225,185,
  212,167,129,118,199,146,152,102,182,217,135,37,189,49,225,178,131,139,47,62,68,118,141,58,215,163,77,140,217,27,
  124,38,131,198,143,204,233,109,177,116,226,119,133,211,193,168,126,206,99,149,146,36,191,42,245,96,82,155,182,34,
  195,33,57,109,172,236,198,205,62,146,216,101,196,129,91,119,202,21,142,150,79,122,178,62,130,218,147,49,239,166,
  121,33,195,77,130,102,246,51,219,88,96,133,212,131,112,168,47,40,107,62,213,146,49,135,78,196,57,100,142,54,
  246,141,111,196,82,100,217,137,221,122,170,128,49,83,95,58,150,40,95,64,111,58,100,83,221,83,73,19,226,161,
  212,209,141,66,248,93,70,101,161,15,86,57,167,139,78,191,91,126,83,218,169,201,42,111,82,51,194,180,152,221,
  103,32,118,149,182,198,68,132,103,133,142,133,142,132,200,45,103,159,161,228,204,133,65,34,82,68,85,36,46,75,
  56,145,150,60,55,47,173,116,111,214,232,31,151,45,118,14,189,201,109,58,164,191,112,45,46,124,117,219,159,23,
  212,36,229,74,131,219,191,127,208,57,167,228,51,90,108,119,177,214,69,124,83,155,181,50,73,49,105,163,141,152,
  220,158,108,161,152,109,69,41,234,55,143,45,92,118,180,94,242,157,113,60,230,180,56,23,53,74,92,188,159,123,
  125,57,126,193,225,23,87,188,174,105,150,234,82,42,180,93,225,181,178,124,135,62,90,122,235,79,151,189,217,192,
  114,172,118,114,150,230,246,79,96,219,109,70,112,85,215,133,248,80,204,71,193,181,200,166,85,122,135,24,91,24,
  170,100,108,154,251,92,46,70,159,215,163,118,130,146,199,119,90,124,46,40,75,79,142,45,254,80,185,153,229,70,
  74,116,234,72,221,159,180,223,103,218,190,14,112,158,151,118,159,234,226,40,56,50,109,131,180,71,217,157,193,64,
  183,142,125,230,44,115,105,41,215,132,204,150,245,133,232,40,219,59,46,63,147,51,74,24,104,58,131,210,113,152,
  107,57,159,218,196,211,92,155,51,120,92,59,203,195,187,195,103,53,152,21,165,19,151,239,168,45,181,187,241,54,
  180,142,95,70,203,75,94,24,246,89,60,76,160,103,208,171,221,85,98,209,159,113,47,93,177,193,169,139,107,53,
  204,33,194,120,183,149,120,208,90,181,238,139,229,171,92,53,118,189,134,58,94,185,95,178,199,20,242,144,173,66,
  165,217,154,15,47,58,146,63,125,55,224,154,90,222,74,50,220,197,241,33,157,113,224,181,232,188,176,197,215,159,
  100,46,225,198,222,32,43,89,112,68,226,98,163,28,161,44,222,175,134,148,129,200,88,24,113,34,168,145,142,113,
  199,218,219,174,200,215,234,178,183,71,237,98,142,148,242,175,181,189,225,175,221,88,81,185,57,93,193,198,101,72,
  143,146,151,54,68,139,129,50,66,132,120,145,129,110,108,37,226,85,152,141,133,37,56,76,170,106,160,50,245,58,
  172,234,156,124,186,55,87,90,156,54,215,152,254,77,112,133,233,162,170,60,59,80,82,142,199,180,142,135,134,116,
  59,140,189,70,129,122,237,110,133,42,146,124,70,21,85,116,117,197,204,149,48,145,173,20,135,129,196,114,118,181,
  173,223,62,105,238,178,152,34,178,47,111,81,44,46,195,40,215,94,173,97,52,28,107,66,56,97,42,53,100,140,
  228,92,233,135,243,57,96,180,195,202,118,167,203,113,221,41,109,100,61,33,182,66,230,140,101,37,202,96,120,20,
  168,228,183,41,98,93,182,40,148,217,219,79,55,36,111,94,131,50,203,148,202,18,135,116,232,196,116,139,101,96,
  200,222,241,51,206,28,194,187,72,85,243,46,212,93,138,31,88,66,66,72,159,109,141,226,62,107,87,189,81,74,
  238,102,65,146,90,171,167,64,60,97,177,20,186,89,121,27,212,19,189,20,224,174,251,67,233,179,109,155,75,88,
  124,146,108,46,169,239,109,142,208,167,86,195,98,132,109,175,181,107,222,76,215,81,95,118,94,71,130,230,47,55,
  180,135,114,119,120,32,52,53,167,19,229,36,118,224,252,90,48,142,190,60,163,32,213,40,189,128,235,174,172,213,
  79,87,164,103,107,29,238,149,52,67,163,59,206,96,70,146,141,15,59,94,87,114,135,195,53,113,237,87,194,25,
  55,109,181,77,128,122,167,66,155,14,165,115,221,128,187,40,105,155,103,100,117,172,250,71,243,88,113,174,198,15,
  75,42,99,94,234,41,224,55,165,133,113,209,141,28,135,132,199,21,241,105,233,106,183,226,199,83,215,208,167,188,
  65,59,78,213,151,131,164,113,100,167,247,57,198,101,199,221,163,234,47,57,230,28,111,179,199,224,191,141,243,54,
  104,185,98,174,104,202,87,20,150,208,148,234,230,81,239,40,55,25,148,28,193,53,180,230,114,123,49,46,208,127,
  101,148,150,198,155,31,101,226,206,20,152,224,103,189,241,87,229,163,82,94,128,15,131,149,203,36,198,172,104,191,
  121,42,99,187,228,34,239,154,48,90,189,37,213,94,69,84,48,83,161,239,85,150,90,167,59,129,86,38,92,158,
  125,102,170,29,126,221,98,228,143,234,79,71,117,38,212,213,160,57,208,114,182,90,141,241,241,106,177,222,74,202,
  207,53,90,19,211,159,194,33,99,162,195,96,238,44,112,77,242,163,70,103,238,180,49,102,85,152,137,152,156,152,
  208,49,221,195,177,71,144,109,68,41,200,154,148,20,217,149,74,38,105,175,225,146,190,96,242,129,91,75,189,75,
  195,37,193,206,52,42,133,55,117,185,208,93,65,123,172,53,83,215,156,227,108,176,177,100,172,47,113,124,75,83,
  243,168,113,162,141,132,130,23,228,59,139,15,242,165,74,148,209,135,135,106,88,55,48,139,148,118,186,127,133,110,
  98,50,189,114,183,14,96,113,98,116,61,50,209,18,233,102,92,90,217,126,90,132,178,131,215,209,72,38,141,141,
  101,98,235,29,222,100,122,45,191,31,53,102,190,228,224,57,78,89,221,94,75,144,113,178,112,110,49,68,68,127,
  128,141,137,24,124,227,187,133,121,197,228,195,195,72,100,31,235,136,78,148,44,200,42,215,21,174,46,202,61,180,
  53,191,60,167,57,195,57,172,38,175,18,191,57,187,4,184,49,180,21,181,51,179,56,213,55,213,34,204,62,179,
  34,187,43,204,5,179,30,181,47,191,26,196,43,205,3,187,38,172,29,175,43,202,14,175,35,170,66,176,35,192,
  51,224,26,192,59,195,27,178,27,189,44,183,34,217,20,189,25,188,23,174,51,195,26,176,20,179,21,171,48,175,
  0,184,22,196,22,171,8,183,7,179,1,185,59,179,44,224,59,196,51,176,56,165,34,215,52,187,40,185,55,187,
  48,214,42,193,1,178,23,185,18,180,59,183,40,215,51,168,29,192,38,180,23,197,48,184,53,172,29,208,42,192,
  55,193,44,201,51,221,17,178,26,171,21,180,31,179,44,185,17,187,49,202,9,189,36,188,60,181,40,226,60,165,
  55,166,18,188,31,210,47,217,49,223,21,191,57,197,65,191,62,161,30,170,62,185,39,228,52,193,7,191,17,189,
  53,219,70,171,38,178,64,174,57,174,36,193,47,206,36,211,36,209,53,202,49,217,39,189,62,170,61,195,38,219,
  73,166,65,161,52,219,61,178,68,166,48,202,46,210,38,181,60,172,36,201,40,179,25,202,51,188,30,209,17,172,
  44,171,73,168,29,181,43,193,46,197,23,176,53,185,65,179,36,178,48,198
];
const LOGO_VERDE = 760;

const rnd = (a: number, b: number): number => a + Math.random() * (b - a);

function figuraLogo(n: number): Figura {
  const p = new Float32Array(n * 3);
  const c = new Uint8Array(n);
  const m = LOGO.length / 2;
  for (let i = 0; i < n; i += 1) {
    // Si piden más puntos que trazos, los de sobra repiten trazo con más
    // temblor para que el borde no se vea como una línea de calco.
    const extra = i >= m;
    const j = extra ? Math.floor(Math.random() * m) : i;
    const jit = extra ? 0.022 : 0.006;
    p[i * 3] = (LOGO[j * 2] / 127.5 - 1) * 1.08 + rnd(-jit, jit);
    p[i * 3 + 1] = (LOGO[j * 2 + 1] / 127.5 - 1) * 1.08 + rnd(-jit, jit);
    p[i * 3 + 2] = rnd(-0.16, 0.16);
    c[i] = j >= LOGO_VERDE ? 1 : 0;
  }
  return { p, c };
}

/** Punto sobre el contorno de un rectángulo redondeado (u de 0 a 1). */
function rectRedondo(u: number, W: number, H: number, R: number): [number, number] {
  const sw = W - 2 * R;
  const shh = H - 2 * R;
  const arc = (Math.PI / 2) * R;
  let s = u * (2 * sw + 2 * shh + 4 * arc);
  const segs: [number, (t: number) => [number, number]][] = [
    [sw, (t) => [-W / 2 + R + t, -H / 2]],
    [
      arc,
      (t) => {
        const a = -Math.PI / 2 + t / R;
        return [W / 2 - R + Math.cos(a) * R, -H / 2 + R + Math.sin(a) * R];
      },
    ],
    [shh, (t) => [W / 2, -H / 2 + R + t]],
    [
      arc,
      (t) => {
        const a = t / R;
        return [W / 2 - R + Math.cos(a) * R, H / 2 - R + Math.sin(a) * R];
      },
    ],
    [sw, (t) => [W / 2 - R - t, H / 2]],
    [
      arc,
      (t) => {
        const a = Math.PI / 2 + t / R;
        return [-W / 2 + R + Math.cos(a) * R, H / 2 - R + Math.sin(a) * R];
      },
    ],
    [shh, (t) => [-W / 2, H / 2 - R - t]],
    [
      arc,
      (t) => {
        const a = Math.PI + t / R;
        return [-W / 2 + R + Math.cos(a) * R, -H / 2 + R + Math.sin(a) * R];
      },
    ],
  ];
  for (const [len, fn] of segs) {
    if (s <= len) return fn(s);
    s -= len;
  }
  return segs[0][1](0);
}

function figuraTelefono(n: number): Figura {
  const p = new Float32Array(n * 3);
  const c = new Uint8Array(n);
  const W = 0.92;
  const H = 1.86;
  // Filas de la pantalla: [y, ancho, tono].
  const rows: [number, number, number][] = [
    [-0.6, 0.46, 1],
    [-0.47, 0.3, 1],
    [-0.24, 0.66, 0],
    [-0.08, 0.66, 0],
    [0.08, 0.66, 0],
    [0.32, 0.5, 1],
    [0.66, 0.6, 2],
  ];
  for (let i = 0; i < n; i += 1) {
    const r = Math.random();
    let x: number;
    let y: number;
    let z: number;
    let t = 0;
    if (r < 0.5) {
      // Mitad de los puntos al marco, en las dos caras.
      const pt = rectRedondo(Math.random(), W, H, 0.2);
      x = pt[0];
      y = pt[1];
      z = Math.random() < 0.5 ? -0.06 : 0.06;
    } else if (r < 0.56) {
      // El botón de abajo.
      const a = Math.random() * 6.2832;
      x = Math.cos(a) * 0.1;
      y = -H / 2 + 0.11 + Math.sin(a) * 0.026;
      z = 0.06;
      t = 1;
    } else {
      const row = rows[Math.floor(Math.random() * rows.length)];
      x = rnd(-row[1] / 2, row[1] / 2);
      y = row[0] + rnd(-0.035, 0.035);
      z = 0.06;
      t = row[2];
    }
    p[i * 3] = x;
    p[i * 3 + 1] = y;
    p[i * 3 + 2] = z;
    c[i] = t;
  }
  return { p, c };
}

function figuraBarras(n: number): Figura {
  const p = new Float32Array(n * 3);
  const c = new Uint8Array(n);
  const hs = [0.42, 0.66, 0.55, 0.9, 0.78, 1.14, 1.42];
  const bw = 0.2;
  const gap = 0.11;
  const total = hs.length * bw + (hs.length - 1) * gap;
  const base = 0.72;
  for (let i = 0; i < n; i += 1) {
    let x: number;
    let y: number;
    let z: number;
    let t = 0;
    if (Math.random() < 0.2) {
      // Uno de cada cinco va a la rejilla del suelo, alineado a la cuadrícula.
      x = rnd(-total / 2 - 0.16, total / 2 + 0.16);
      z = rnd(-0.38, 0.38);
      y = base;
      if (Math.random() < 0.5) x = Math.round(x * 5) / 5;
      else z = Math.round(z * 5) / 5;
      t = 3;
    } else {
      const b = Math.floor(Math.random() * hs.length);
      const x0 = -total / 2 + b * (bw + gap);
      const h = hs[b];
      const face = Math.random();
      if (face < 0.35) {
        x = x0 + Math.random() * bw;
        z = Math.random() < 0.5 ? -bw / 2 : bw / 2;
        y = base - Math.random() * h;
      } else if (face < 0.7) {
        x = Math.random() < 0.5 ? x0 : x0 + bw;
        z = rnd(-bw / 2, bw / 2);
        y = base - Math.random() * h;
      } else {
        x = x0 + Math.random() * bw;
        z = rnd(-bw / 2, bw / 2);
        y = base - h;
      }
      // La última barra, la más alta, lleva el acento secundario.
      t = b === hs.length - 1 ? 2 : 0;
    }
    p[i * 3] = x;
    p[i * 3 + 1] = y;
    p[i * 3 + 2] = z;
    c[i] = t;
  }
  return { p, c };
}

/** Reparto de Fibonacci: puntos repartidos por igual sobre una esfera. */
function fib(i: number, n: number): [number, number, number] {
  const y = 1 - (i / (n - 1)) * 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const a = Math.PI * (3 - Math.sqrt(5)) * i;
  return [Math.cos(a) * r, y, Math.sin(a) * r];
}

function figuraEsfera(n: number): Figura {
  const p = new Float32Array(n * 3);
  const c = new Uint8Array(n);
  for (let i = 0; i < n; i += 1) {
    const [x, y, z] = fib(i, n);
    p[i * 3] = x * 1.02;
    p[i * 3 + 1] = y * 1.02;
    p[i * 3 + 2] = z * 1.02;
    c[i] = Math.random() < 0.12 ? 1 : 0;
  }
  return { p, c };
}

/** Núcleo de IA: esfera interior y dos anillos inclinados. */
function figuraNucleo(n: number): Figura {
  const p = new Float32Array(n * 3);
  const c = new Uint8Array(n);
  const inner = Math.floor(n * 0.55);
  for (let i = 0; i < n; i += 1) {
    if (i < inner) {
      const [x, y, z] = fib(i, inner);
      const r = 0.6 + rnd(-0.025, 0.025);
      p[i * 3] = x * r;
      p[i * 3 + 1] = y * r;
      p[i * 3 + 2] = z * r;
      c[i] = Math.random() < 0.2 ? 2 : Math.random() < 0.3 ? 1 : 0;
    } else {
      const ring = i % 2;
      const a = Math.random() * 6.2832;
      const r = (ring ? 1.08 : 0.86) + rnd(-0.015, 0.015);
      const tilt = ring ? 1.1 : -0.55;
      const x = Math.cos(a) * r;
      const y0 = 0;
      const z0 = Math.sin(a) * r;
      p[i * 3] = x;
      p[i * 3 + 1] = y0 * Math.cos(tilt) - z0 * Math.sin(tilt);
      p[i * 3 + 2] = y0 * Math.sin(tilt) + z0 * Math.cos(tilt);
      c[i] = ring ? 1 : 3;
    }
  }
  return { p, c };
}

// Continentes a brochazos (cajas de latitud/longitud) para el globo de
// "Quiénes somos": no es un mapa, es la silueta que se adivina al girar.
const TIERRA: readonly [number, number, number, number][] = [
  [36, 71, -10, 40],
  [35, 60, 40, 140],
  [-35, 37, -18, 51],
  [8, 35, 60, 120],
  [-45, -10, 113, 154],
  [15, 72, -168, -52],
  [-56, 13, -82, -34],
  [60, 83, -73, -12],
  [8, 30, -118, -77],
  [20, 45, 120, 146],
];

const esTierra = (lat: number, lon: number): boolean =>
  TIERRA.some(([a, b, c0, d0]) => lat >= a && lat <= b && lon >= c0 && lon <= d0);

function figuraGlobo(n: number): Figura {
  const p = new Float32Array(n * 3);
  const c = new Uint8Array(n);
  for (let i = 0; i < n; i += 1) {
    const [x, y, z] = fib(i, n);
    const lat = Math.asin(-y) * 57.2958;
    const lon = Math.atan2(-z, x) * 57.2958;
    p[i * 3] = x * 1.05;
    p[i * 3 + 1] = y * 1.05;
    p[i * 3 + 2] = z * 1.05;
    c[i] = esTierra(lat, lon) ? 0 : 4;
  }
  return { p, c };
}

/** Latitud y longitud a punto del globo (el mismo sistema que figuraGlobo). */
function latLon(lat: number, lon: number, r = 1.07): [number, number, number] {
  const la = lat / 57.2958;
  const lo = lon / 57.2958;
  return [Math.cos(la) * Math.cos(lo) * r, -Math.sin(la) * r, -Math.cos(la) * Math.sin(lo) * r];
}

/** Las figuras conocidas. Los nombres se quedan en inglés: vienen del marcado. */
export type NombreFigura = "logo" | "phone" | "bars" | "sphere" | "core" | "globe";

const FIGURAS: Record<NombreFigura, (n: number) => Figura> = {
  logo: figuraLogo,
  phone: figuraTelefono,
  bars: figuraBarras,
  sphere: figuraEsfera,
  core: figuraNucleo,
  globe: figuraGlobo,
};

const esNombreFigura = (k: string): k is NombreFigura =>
  Object.prototype.hasOwnProperty.call(FIGURAS, k);

/* ------------------------------------------------------------
   3 · Escultura que cambia de forma
------------------------------------------------------------ */

interface Marcador {
  at: [number, number, number];
  /** Desfase del pulso, para que no latan todos a la vez. */
  ph: number;
}

export function escultura(lienzo: HTMLCanvasElement, opciones: OpcionesEscultura = {}): ControlEscultura {
  instancias.get(lienzo)?.();

  const ctx2d = lienzo.getContext("2d");
  if (!ctx2d) {
    const vacio = (): void => {};
    const ninguna: NombreFigura = "logo";
    return Object.assign(vacio, {
      parar: vacio,
      cambiarA: vacio,
      estallar: vacio,
      reiniciar: vacio,
      girarA: vacio,
      velocidadDeGiro: vacio,
      tintar: vacio,
      figura: ninguna,
      morph: vacio,
      burst: vacio,
      reset: vacio,
      turn: vacio,
      spin: vacio,
      tint: vacio,
      shape: ninguna,
    });
  }
  // Igual que en campoDeEstrellas: hace falta un const ya tipado sin null.
  const ctx: CanvasRenderingContext2D = ctx2d;

  const reducido = movimientoReducido();
  const fino = punteroFino();
  const n = opciones.count || (window.innerWidth < 700 ? 720 : 1250);
  const nombres = (opciones.shapes || ["logo"]).filter(esNombreFigura);
  // Si no queda ninguna figura válida se usa la de siempre. El original
  // petardeaba aquí y la página se quedaba sin escultura.
  if (!nombres.length) nombres.push("logo");
  // Cada figura son miles de puntos: se calcula una vez y se guarda. Solo se
  // puede cambiar a las que se pidieron al arrancar, igual que en el original.
  const figuras = new Map<NombreFigura, Figura>();
  const figuraDe = (k: NombreFigura): Figura => {
    const guardada = figuras.get(k);
    if (guardada) return guardada;
    const nueva = FIGURAS[k](n);
    figuras.set(k, nueva);
    return nueva;
  };
  nombres.forEach(figuraDe);
  const pedida = opciones.initial;
  let nombreActual: NombreFigura =
    pedida && esNombreFigura(pedida) && figuras.has(pedida) ? pedida : nombres[0];
  let figuraActual = figuraDe(nombreActual);
  let tonos = paleta(lienzo);

  const pos = new Float32Array(n * 3);
  const vel = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const seeds = new Float32Array(n);
  // Los puntos nacen repartidos en una corteza esférica alrededor de la
  // figura: así el primer fotograma es un enjambre que se junta solo.
  for (let i = 0; i < n; i += 1) {
    const a = Math.random() * 6.2832;
    const b = Math.acos(2 * Math.random() - 1);
    const r = 1.7 + Math.random() * 1.6;
    pos[i * 3] = Math.sin(b) * Math.cos(a) * r;
    pos[i * 3 + 1] = Math.sin(b) * Math.sin(a) * r;
    pos[i * 3 + 2] = Math.cos(b) * r;
    const T = tonos[figuraActual.c[i]];
    col[i * 3] = T[0];
    col[i * 3 + 1] = T[1];
    col[i * 3 + 2] = T[2];
    seeds[i] = Math.random() * 6.2832;
  }

  const marcadores: Marcador[] = (opciones.markers || []).map((m) => ({
    at: latLon(m.lat, m.lon),
    ph: Math.random(),
  }));
  const extent = opciones.extent || 1.3;
  const size = opciones.size || 1;
  const swing = opciones.swing ?? 0.55;
  const tilt = opciones.tilt ?? 0.1;
  const repel = opciones.repel ?? true;
  let giroBase = opciones.spin ?? 0.35;
  let giroActual = giroBase;
  let giro = opciones.phase || 0;
  let vueltaDestino = 0;
  let vueltaActual = 0;
  let estallando = false;
  let S: Medidas = { w: 1, h: 1, d: 1 };
  // Distancia de la cámara: de aquí sale la perspectiva.
  const D = 3.4;

  function dibujar(dt: number, t: number): void {
    const { w, h, d } = S;
    ctx.clearRect(0, 0, w, h);
    const tp = figuraActual.p;
    const tc = figuraActual.c;
    // Muelle hacia la figura. Al estallar se suelta el muelle y casi no roza.
    const k = estallando ? 0 : 26;
    const damp = estallando ? 0.35 : 7.2;
    for (let i = 0; i < n * 3; i += 1) {
      vel[i] += ((tp[i] - pos[i]) * k - vel[i] * damp) * dt;
      pos[i] += vel[i] * dt;
    }
    const cl = Math.min(1, dt * 3.5);
    for (let i = 0; i < n; i += 1) {
      const T = tonos[tc[i]];
      col[i * 3] += (T[0] - col[i * 3]) * cl;
      col[i * 3 + 1] += (T[1] - col[i * 3 + 1]) * cl;
      col[i * 3 + 2] += (T[2] - col[i * 3 + 2]) * cl;
    }
    giro += giroActual * dt;
    vueltaActual += (vueltaDestino - vueltaActual) * Math.min(1, dt * 4);
    const ry = (swing ? Math.sin(giro) * swing : giro) + vueltaActual + (fino ? puntero.x * 0.4 : 0);
    const rx = tilt + (fino ? puntero.y * 0.18 : 0);
    const cy = Math.cos(ry);
    const sy = Math.sin(ry);
    const cx = Math.cos(rx);
    const sx = Math.sin(rx);
    const unit = Math.min(w, h) / 2 / extent;
    const ox = w / 2;
    const oy = h / 2;
    let mx = -1e9;
    let my = -1e9;
    if (repel && puntero.on && !reducido && !estallando) {
      const r = lienzo.getBoundingClientRect();
      mx = (puntero.cx - r.left) * d;
      my = (puntero.cy - r.top) * d;
    }
    const R = 80 * d;
    const R2 = R * R;
    // "lighter": donde se juntan varios puntos el color se suma y brilla.
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < n; i += 1) {
      const wob = reducido ? 0 : Math.sin(t * 1.3 + seeds[i]) * 0.007;
      const x0 = pos[i * 3] + wob;
      const y0 = pos[i * 3 + 1] + wob;
      const z0 = pos[i * 3 + 2];
      const x1 = x0 * cy + z0 * sy;
      const z1 = -x0 * sy + z0 * cy;
      const y2 = y0 * cx - z1 * sx;
      const z2 = y0 * sx + z1 * cx;
      const persp = D / (D - z2);
      const X = ox + x1 * unit * persp;
      const Y = oy + y2 * unit * persp;
      if (mx > -1e8) {
        // El empujón se calcula en pantalla y se devuelve al mundo girado.
        const dx = X - mx;
        const dy = Y - my;
        const dd = dx * dx + dy * dy;
        if (dd < R2) {
          const dist = Math.sqrt(dd) || 1;
          const f = (1 - dist / R) * 42 * dt;
          const ux = (dx / dist) * f;
          vel[i * 3] += ux * cy;
          vel[i * 3 + 2] += ux * sy;
          vel[i * 3 + 1] += (dy / dist) * f;
        }
      }
      const depth = Math.max(0, Math.min(1, (z2 + 1.25) / 2.5));
      const shade = 0.62 + depth * 0.38;
      const a = (0.42 + depth * 0.56) * ALFA_TONO[tc[i]];
      const s = (0.95 + depth * 1.6) * d * persp * size;
      ctx.fillStyle = `rgba(${(col[i * 3] * shade) | 0},${(col[i * 3 + 1] * shade) | 0},${(col[i * 3 + 2] * shade) | 0},${a.toFixed(2)})`;
      ctx.fillRect(X - s / 2, Y - s / 2, s, s);
    }
    marcadores.forEach((m) => {
      const [x0, y0, z0] = m.at;
      const x1 = x0 * cy + z0 * sy;
      const z1 = -x0 * sy + z0 * cy;
      const y2 = y0 * cx - z1 * sx;
      const z2 = y0 * sx + z1 * cx;
      // Detrás del globo no se pinta.
      if (z2 < -0.15) return;
      const persp = D / (D - z2);
      const X = ox + x1 * unit * persp;
      const Y = oy + y2 * unit * persp;
      const pulse = (t * 0.7 + m.ph) % 1;
      const mk = tonos[2].join(",");
      ctx.fillStyle = `rgba(${mk},0.95)`;
      ctx.beginPath();
      ctx.arc(X, Y, 4.5 * d, 0, 6.2832);
      ctx.fill();
      ctx.strokeStyle = `rgba(${mk},${(0.8 * (1 - pulse)).toFixed(2)})`;
      ctx.lineWidth = 1.5 * d;
      ctx.beginPath();
      ctx.arc(X, Y, (6 + pulse * 20) * d, 0, 6.2832);
      ctx.stroke();
    });
    ctx.globalCompositeOperation = "source-over";
  }

  /** Fotograma único para "reducir movimiento": la figura ya montada y quieta. */
  const quieto = (): void => {
    pos.set(figuraActual.p);
    vel.fill(0);
    const tc = figuraActual.c;
    for (let i = 0; i < n; i += 1) {
      const T = tonos[tc[i]];
      col[i * 3] = T[0];
      col[i * 3 + 1] = T[1];
      col[i * 3 + 2] = T[2];
    }
    dibujar(0, 0);
  };

  const pararMedidas = vigilarMedidas(lienzo, (m) => {
    S = m;
    if (reducido) dibujar(0, 0);
  });
  let pararBucle = NADA;
  if (reducido) quieto();
  else pararBucle = registrarBucle(dibujar, lienzo);

  const parar = (): void => {
    pararBucle();
    pararBucle = NADA;
    pararMedidas();
    if (instancias.get(lienzo) === parar) instancias.delete(lienzo);
  };
  instancias.set(lienzo, parar);

  const cambiarA = (nombre: string): void => {
    if (!esNombreFigura(nombre) || !figuras.has(nombre) || nombre === nombreActual) return;
    nombreActual = nombre;
    figuraActual = figuraDe(nombre);
    mandos.figura = nombre;
    mandos.shape = nombre;
    if (reducido) {
      quieto();
      return;
    }
    // Un empujón al azar a todo: el cambio se ve como un revuelo, no como un
    // deslizamiento ordenado de cada punto a su sitio.
    for (let i = 0; i < n * 3; i += 1) vel[i] += (Math.random() - 0.5) * 2.4;
  };
  const estallar = (): void => {
    if (reducido) return;
    estallando = true;
    giroActual = 2.6;
    for (let i = 0; i < n; i += 1) {
      const l = Math.hypot(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]) || 1;
      const s = 3.5 + Math.random() * 6;
      vel[i * 3] += (pos[i * 3] / l) * s;
      vel[i * 3 + 1] += (pos[i * 3 + 1] / l) * s;
      // El +2.5 en z es el tirón hacia la cámara, el que da el "salto".
      vel[i * 3 + 2] += (pos[i * 3 + 2] / l) * s + 2.5;
    }
  };
  const reiniciar = (): void => {
    estallando = false;
    giroActual = giroBase;
    if (reducido) quieto();
  };
  const girarA = (rad: number): void => {
    vueltaDestino = rad;
    if (reducido) dibujar(0, 0);
  };
  const velocidadDeGiro = (v: number): void => {
    giroBase = v;
    if (!estallando) giroActual = v;
  };
  const tintar = (nodo?: Element | null): void => {
    tonos = paleta(nodo || lienzo);
    if (reducido) quieto();
  };

  // `figura` y `shape` son propiedades y no getters porque Object.assign
  // copiaría el valor de un getter una sola vez; cambiarA las mantiene al día.
  const mandos = Object.assign(parar, {
    parar,
    cambiarA,
    estallar,
    reiniciar,
    girarA,
    velocidadDeGiro,
    tintar,
    figura: nombreActual,
    morph: cambiarA,
    burst: estallar,
    reset: reiniciar,
    turn: girarA,
    spin: velocidadDeGiro,
    tint: tintar,
    shape: nombreActual,
  });
  return mandos;
}
