# MOTION SPEC · Admin estilo "Soft 3D / Clay-Glass"

> **Referencia:** video "Dashboard V20" (TikTok @paulcodes4), analizado cuadro por cuadro a 30 fps.
> **Objetivo:** que el admin se **mueva, se sienta y tenga las formas** del video.
> **Regla de oro:** **NO copiar los colores del video.** Todo usa la paleta del proyecto.

---

## 0. Instrucciones para Claude Code (leer primero)

1. Lee este documento completo. Luego mira **todas** las imágenes de `docs/motion/referencias/`.
   Son cuadros del video en escala de grises, con el tiempo en ms arriba de cada cuadro.
   Ignora la marca de agua de TikTok y el cursor.
2. **No uses los colores del video.** Usa la paleta, los tokens y las fuentes que ya tiene el proyecto.
   Aquí los colores solo aparecen como variables (`--accent`, `--surface`…).
3. **Detecta el stack antes de escribir código** (revisa `package.json`):
   - React / Next.js → **Motion** (paquete `motion`, import desde `motion/react`).
     Si el proyecto ya tiene `framer-motion`, úsalo (misma API, import desde `framer-motion`).
   - Vue → `motion-v` (Motion para Vue, misma API) o `@vueuse/motion`.
   - Sin framework → `motion` vanilla (`animate`, `stagger`, `inView`) + CSS.
   Traduce el código de ejemplo a ese stack **manteniendo los mismos valores**.
4. No toques lógica de negocio, datos, permisos ni rutas. Esto es solo capa visual y de movimiento.
5. Trabaja **por fases** (sección 11). Al terminar cada fase, revisa su checklist y resume qué cambió.
6. Si falta algo (ilustraciones 3D, un dock inferior que el admin no tiene, etc.),
   deja el espacio listo con su animación y pregúntame antes de inventar contenido.

---

## 1. La sensación en una frase

> Todo aparece **en cascada**, de **desenfocado a nítido**, con **física suave** y un **rebote leve** en lo que se mueve.
> Los datos cobran vida: **los números cuentan, las líneas se dibujan, las barras se llenan**.
> El indicador de la opción activa **viaja** entre opciones en vez de saltar.

### Principios (en orden de importancia)

1. **Nada aparece de golpe.** Cada elemento entra con *blur reveal*: opacidad 0 + blur 8–10 px + un desplazamiento pequeño → nítido.
2. **Orquestación (stagger).** Primero el contenedor, luego su contenido. Orden de lectura: arriba → abajo, izquierda → derecha. Intervalos cortos: 40–70 ms.
3. **Rápido al inicio, suave al final.** Ease-out fuerte en fades y blur. Springs en lo que cambia de posición.
4. **Rebote leve solo en objetos**, nunca en texto: indicadores activos, dock, ilustraciones 3D, panel del sidebar.
5. **Continuidad.** El "pill" activo se desliza de una opción a otra (shared element / `layoutId`).
   El shell (sidebar, header, dock) **no** se vuelve a animar al navegar: solo cambian el título y los indicadores.
6. **Datos vivos.** Number ticker, line drawing, barras que se llenan de izquierda a derecha.
7. **Profundidad táctil.** Hover levanta la tarjeta. Tap la hunde un poco.

---

## 2. Lenguaje de formas (sin colores)

Mira `01` a `04` en referencias.

### 2.1 Estructura

- Fondo liso tipo lienzo. Encima, **dos paneles flotantes** separados del borde (~16 px):
  - **Sidebar**: panel propio, alto completo, esquinas ~28 px.
  - **Panel principal**: una "ventana" grande con esquinas ~32 px. Todo el contenido vive dentro.
- **Dock inferior flotante**: barra de pestañas en forma de píldora, centrada, por encima del contenido (fixed).
  A su derecha, separado, un botón circular "+".

### 2.2 Radios

| Elemento | Radio |
|---|---|
| Paneles grandes (sidebar, panel principal) | 28–32 px |
| Tarjetas, banner, columnas del kanban, paneles internos | 20–24 px |
| Botones, inputs, chips, tags, filtros, dock, tabs, segmented control | píldora (`9999px`) |
| Contenedor de icono ("squircle") | 12–14 px |
| Avatares, botones de icono, badges | círculo |
| Burbujas de chat | 16 px, con la esquina del lado del remitente más cerrada (4–6 px) |

### 2.3 Material ("clay + glass")

- Sombras **muy suaves y anchas**, con poca opacidad, **teñidas con el color de acento del propio elemento**
  (cada KPI proyecta un halo suave de su color).
- **Brillo interior arriba** en superficies elevadas: `inset 0 1px 0 rgb(255 255 255 / .6)`.
- Superficies semitransparentes con `backdrop-filter: blur(16–24px)` y borde de 1 px blanco translúcido.
- Iconos dentro de squircles con volumen: degradado sutil + sombra interior abajo + brillo arriba (aspecto 3D "plastilina").
- El banner tiene una **base más gruesa abajo**, como plataforma 3D: una franja inferior de ~6–8 px un poco más oscura.
- Ver Anexo A para las variables CSS.

### 2.4 Componentes clave

- **Sidebar**: avatar circular con anillo + punto de estado; saludo ("Hola, X 👋"); ítems con icono + texto.
  **Activo** = píldora sólida elevada (radio ~14 px, sombra suave). **Hover** = píldora translúcida. Contadores = badge circular a la derecha.
- **Header**: título de página grande en negrita; buscador en píldora con sombra interior y la tecla "/" a la derecha;
  botones circulares (notificaciones con badge, perfil).
- **Banner hero**: ilustración 3D a la izquierda; saludo + subtítulo con números en negrita; CTA en píldora con icono.
  Decoraciones: chip flotante ("Nuevo lead · …"), burbuja "…", destellos pequeños, planta 3D al borde derecho.
- **KPI cards (4)**: squircle con icono (arriba izquierda), sparkline (arriba derecha), label pequeño, número grande, línea de variación con flecha.
- **Chips de resumen** (Deals, Invoices): tarjeta baja tipo píldora con icono + valor + label.
- **Kanban**: 5 columnas (contenedor claro redondeado; header con punto + nombre + conteo + total).
  Tarjetas: título + menú "…", empresa con mini squircle, monto + tag de prioridad en píldora, barra de progreso fina, fecha + % + avatar.
- **Inbox**: lista (buscador píldora; ítems con avatar de iniciales, nombre, preview, hora, badge; el activo es una tarjeta elevada)
  + chat (header con avatar y botones circulares; divisor "Hoy" en píldora; burbujas; respuestas rápidas en píldoras; input píldora + botón enviar circular).
- **Invoices**: botón contorno + botón sólido (píldoras); chips de resumen; **barra apilada** fina por segmentos;
  filtros en píldora con contador (el activo es sólido); tabla con separadores suaves; botones de estado en píldora.
- **Tipografía**: sans geométrica redondeada (tipo Poppins / Outfit) o la del proyecto. Números en negrita y con `tabular-nums`.

---

## 3. Tokens de movimiento (copiar tal cual)

Valores derivados de medir el video. Crea este archivo y úsalo en todo el admin.

```ts
// src/lib/motion.ts
import type { Transition, Variants } from "motion/react"; // o "framer-motion"

type Bezier = [number, number, number, number];

export const ease: Record<"out" | "outExpo" | "inOut", Bezier> = {
  out: [0.22, 1, 0.36, 1], // entradas: fade, blur, desplazamientos
  outExpo: [0.16, 1, 0.3, 1], // contadores, barras, líneas
  inOut: [0.65, 0, 0.35, 1], // salidas
};

export const spring = {
  // Pill activo (sidebar y dock). Pico de sobrepaso a ~170 ms (~10 %), asentado en ~400 ms.
  indicator: { type: "spring", stiffness: 500, damping: 26, mass: 1 },
  // Objetos que entran con rebote visible: dock, ilustración 3D. ~12 % de sobrepaso, ~0.75 s.
  bouncy: { type: "spring", stiffness: 100, damping: 11, mass: 1 },
  // Panel del sidebar al cargar: rebote corto tipo "gelatina". Solo con escalas pequeñas (0.95 → 1).
  jelly: { type: "spring", stiffness: 350, damping: 8, mass: 1 },
  // Hover / tap.
  hover: { type: "spring", stiffness: 400, damping: 22, mass: 1 },
  // Pop-in sin rebote visible (planta, badges).
  pop: { type: "spring", stiffness: 260, damping: 22, mass: 1 },
} satisfies Record<string, Transition>;

export const stagger = {
  nav: 0.06, // ítems del sidebar
  cards: 0.065, // KPI cards, chips, columnas, secciones
  inner: 0.07, // hijos dentro de una tarjeta
  items: 0.045, // ítems de lista, tarjetas dentro de una columna
  rows: 0.04, // filas de tabla
  chat: 0.05, // burbujas
  exit: 0.035, // salida escalonada al cambiar de página
};

/** Grupo que orquesta a sus hijos (no se anima él mismo). */
export const group = (gap: number = stagger.cards, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
  exit: { transition: { staggerChildren: stagger.exit } },
});

/** Blur reveal estándar: secciones, ítems, tarjetas simples. */
export const blurIn: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: ease.out },
    transitionEnd: { filter: "none" }, // obligatorio, ver 3.1
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    filter: "blur(8px)",
    transition: { duration: 0.25, ease: ease.inOut },
  },
};

/** Versión ligera para texto, iconos y labels dentro de tarjetas. */
export const blurInSm: Variants = {
  hidden: { opacity: 0, y: 6, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.35, ease: ease.out },
    transitionEnd: { filter: "none" },
  },
  exit: { opacity: 0, filter: "blur(6px)", transition: { duration: 0.2, ease: ease.inOut } },
};

/** Tarjeta que además orquesta a sus hijos (icono → label → valor → delta → gráfico). */
export const cardIn = (childDelay = 0.13, gap: number = stagger.inner): Variants => ({
  hidden: { opacity: 0, y: 12, scale: 0.97, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: ease.out, delayChildren: childDelay, staggerChildren: gap },
    transitionEnd: { filter: "none" },
  },
  exit: blurIn.exit,
});

/** Objetos 3D que suben con rebote (ilustración del hero). Úsalo con initial/animate propios. */
export const riseIn = (delay = 0): Variants => ({
  hidden: { opacity: 0, y: 48, scale: 0.92, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      y: { ...spring.bouncy, delay },
      scale: { ...spring.bouncy, delay },
      opacity: { duration: 0.3, delay },
      filter: { duration: 0.35, delay },
    },
    transitionEnd: { filter: "none" },
  },
  exit: blurIn.exit,
});

/** Objetos que "crecen" desde abajo sin rebote visible (planta, decoraciones). */
export const growIn = (delay = 0): Variants => ({
  hidden: { opacity: 0, y: 16, scale: 0.75, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      y: { ...spring.pop, delay },
      scale: { ...spring.pop, delay },
      opacity: { duration: 0.25, delay },
      filter: { duration: 0.3, delay },
    },
    transitionEnd: { filter: "none" },
  },
  exit: blurIn.exit,
});
```

### 3.1 Notas técnicas obligatorias

- **`transitionEnd: { filter: "none" }`**: un `filter` distinto de `none` (incluso `blur(0px)`) convierte al elemento
  en contenedor de sus hijos `position: fixed` (rompe dropdowns, tooltips y modales) y corta el `backdrop-filter` de los hijos
  (el glass se ve plano). Por eso se limpia al terminar.
- Anima solo `opacity`, `transform` (x, y, scale) y `filter`. Excepción: barras pequeñas, con `clip-path`.
- Blur máximo 10 px. **No** animes blur sobre la página completa: aplícalo por tarjeta o sección.
- **No centres con `translate` de CSS** (`-translate-x-1/2`) un elemento que Motion transforma: Motion sobrescribe `transform`.
  Centra con flex o grid.
- Dentro de un árbol de variants **no pongas `delay` en los hijos**: el ritmo lo marcan `delayChildren` y `staggerChildren` del padre.
  Para tiempos especiales (ilustraciones, dock) usa `initial`/`animate` propios con su delay (como `riseIn`).
- Envuelve la app en `<MotionConfig reducedMotion="user">` (sección 10).

---

## 4. Timeline maestro · carga inicial (Dashboard)

Mira `05-secuencia-carga-inicial.png`, `10-…`, `11-…` y `12-…`. **t = 0 cuando el contenido monta.**

| t (ms) | Elemento | Animación |
|---|---|---|
| 0 | Panel principal + header (título, buscador, botones) | Ya visibles. Sin animación. |
| 0 | Panel del sidebar | `scale 0.95 → 1`, `transform-origin: bottom`, `spring.jelly` (sube, se pasa un poco y vuelve) |
| 100 → 580 | Ítems del sidebar (≈9) | `blurInSm`, stagger 60 ms, arriba → abajo |
| 120 | Banner hero (con sus decoraciones: chip "nuevo lead", burbuja) | `cardIn`: blur + `scale 0.97 → 1` |
| 300 / 370 / 440 | Saludo → subtítulo → CTA | `blurInSm`, stagger 70 ms |
| 265 → 460 | 4 KPI cards | `cardIn`, stagger 65 ms, izquierda → derecha |
| card + 130 → + 410 | Dentro de cada KPI: icono → label → valor → delta → sparkline | `blurInSm`, stagger 70 ms. El valor **cuenta** desde 0 (~1 s). La sparkline **se dibuja** (0.7 s). |
| 450 | Ilustración 3D del hero | `riseIn(0.45)`: sube 48 px con `spring.bouncy` (sobrepasa ~12 % y se asienta ~0.8 s) |
| 530 | Fila de gráficas inferior | `cardIn`, stagger 80 ms (+ line drawing / donut, ver 13) |
| 570 | Dock inferior | sube 40 px + `scale 0.9 → 1` + blur, `spring.bouncy` (sobrepasa ~15 %) |
| 770 → 1120 | Labels del dock | `blurInSm`, stagger 70 ms, izquierda → derecha |
| 970 | Ilustración secundaria (planta) | `growIn(0.97)`: crece desde abajo (`origin-bottom`), blur → nítido |
| ~1300 | Todo asentado | |

Duración total ≈ 1.3 s. Ocurre una sola vez por carga.

**Cómo sale ese ritmo con el código** (la página usa `delayChildren 0.12` en la primera carga, ver 6.1):

```tsx
// Página Dashboard
<>
  <HeroBanner /> {/* motion.section variants={cardIn(0.18)} → ~120 ms; textos a 300/370/440 ms */}
  <motion.section variants={group(stagger.cards, 0.08)} className="grid grid-cols-4 gap-5">
    {kpis.map((k, i) => (
      <KpiCard key={k.id} index={i} {...k} /> // ~265 ms + 65 ms por tarjeta
    ))}
  </motion.section>
  <motion.section variants={group(0.08, 0.28)} className="grid grid-cols-3 gap-5">
    …gráficas… {/* ~530 ms */}
  </motion.section>
</>
```

Sidebar, dock e ilustraciones viven fuera de este árbol y usan sus propios delays (6.7, 6.8, 6.9).

---

## 5. Timeline maestro · cambio de página

Mira `06-secuencia-cambio-de-pagina.png` y `07-indicador-activo-dock-spring.png`. **t = 0 en el clic.**

| t (ms) | Elemento | Animación |
|---|---|---|
| 0 | Pill activo del sidebar **y** del dock | Viajan a la nueva opción con `layoutId` + `spring.indicator` (pico ~170 ms, sobrepaso ~10 %, asentado ~400 ms). Su ancho se adapta al de la nueva opción. |
| 0 | Label que gana / pierde el activo | Crossfade con blur 4 px (250 ms) al cambiar de color |
| 0 | Título de la página | Cambia al instante. El nuevo entra: `opacity 0 → 1`, `y 8 → 0`, `blur 4 → 0` (300 ms) |
| 0 → ~400 | Contenido viejo | Sale escalonado en orden de lectura: `opacity → 0`, `blur → 8px`, `scale → 0.98` (250 ms cada uno, stagger 35 ms). Nada se desliza hacia los lados. |
| 250 | Nuevo: header de sección + acciones | `blurIn` |
| 270 → 470 | Nuevo: chips de resumen | `blurIn`, stagger 65 ms. Los números **cuentan desde 0** (~1 s) |
| 530 → 950 | Nuevo: contenido principal | Kanban, lista o tabla en cascada (ver 6.11–6.13) |
| ~1100–1300 | Asentado | |

**Clave:** la salida y la entrada **se solapan** ~150 ms en el mismo lugar
(la página vieja todavía se difumina cuando la nueva ya aparece). Sin saltos de layout ni de scroll.

---

## 6. Recetas por componente (con código)

> Patrón general: **variants** para las cascadas (secciones, tarjetas, listas)
> y **`initial`/`animate` propios** para piezas con tiempo especial (shell, ilustraciones, dock).

### 6.1 Transición entre páginas

```tsx
// src/components/motion/PageTransition.tsx
import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { stagger } from "@/lib/motion";

const page: Variants = {
  hidden: {},
  show: (first: boolean) => ({
    transition: { delayChildren: first ? 0.12 : 0.25, staggerChildren: stagger.cards },
  }),
  exit: { transition: { staggerChildren: stagger.exit } },
};

function useIsFirstRender() {
  const first = useRef(true);
  useEffect(() => {
    first.current = false;
  }, []);
  return first.current;
}

export function PageTransition({ routeKey, children }: { routeKey: string; children: ReactNode }) {
  const first = useIsFirstRender();
  return (
    // Página vieja y nueva comparten la misma celda del grid: se superponen sin saltos.
    <div className="grid [&>*]:[grid-area:1/1]">
      <AnimatePresence custom={first}>
        <motion.div key={routeKey} custom={first} variants={page} initial="hidden" animate="show" exit="exit">
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
```

Integración según router:

- **React Router**: `const location = useLocation();` →
  `<PageTransition routeKey={location.pathname}><Routes location={location}>…</Routes></PageTransition>`.
- **Next.js App Router**: las salidas necesitan "congelar" la ruta saliente (patrón *FrozenRouter*):
  ```tsx
  "use client";
  import { useContext, useRef, type ReactNode } from "react";
  // Import interno de Next: puede cambiar entre versiones. Si falla, usa solo entradas (template.tsx).
  import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

  export function FrozenRouter({ children }: { children: ReactNode }) {
    const context = useContext(LayoutRouterContext);
    const frozen = useRef(context).current;
    return <LayoutRouterContext.Provider value={frozen}>{children}</LayoutRouterContext.Provider>;
  }
  // En el layout del admin (client): <PageTransition routeKey={usePathname()}><FrozenRouter>{children}</FrozenRouter></PageTransition>
  ```
- **Admin con secciones por estado** (sin router): `routeKey` = id de la sección activa.

Cada página se arma con secciones hijas que usan variants, así heredan `hidden`/`show`/`exit` y entran en cascada:

```tsx
// Ejemplo: página Deals
<>
  <motion.header variants={blurIn}>…título de sección + acciones…</motion.header>
  <motion.section variants={group(stagger.cards)} className="grid grid-cols-4 gap-4">
    {summary.map((s) => (
      <SummaryChip key={s.id} {...s} />
    ))}
  </motion.section>
  {/* El bloque principal arranca ~530 ms después del clic */}
  <motion.section variants={group(stagger.cards, 0.15)}>…kanban / lista / tabla…</motion.section>
</>
```

### 6.2 KPI card (blur reveal + hijos en cascada + count-up + sparkline + hover)

```tsx
import { motion } from "motion/react";
import { blurInSm, cardIn, spring, stagger } from "@/lib/motion";

export function KpiCard({ index, icon: Icon, label, value, format, delta, sparkPath }: KpiProps) {
  return (
    <motion.article
      variants={cardIn()}
      whileHover={{ y: -5 }} // igual que en el video
      whileTap={{ scale: 0.98 }}
      transition={spring.hover} // solo afecta hover/tap; show/exit traen su propia transición
      className="glass-card relative p-5 transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]"
    >
      <motion.div variants={blurInSm} className="squircle grid size-10 place-items-center">
        <Icon className="size-5" />
      </motion.div>
      <motion.p variants={blurInSm} className="mt-3 text-xs opacity-70">{label}</motion.p>
      <motion.p variants={blurInSm} className="text-2xl font-bold tabular-nums">
        {/* El conteo arranca cuando el número se vuelve visible */}
        <AnimatedNumber value={value} format={format} delay={0.35 + index * stagger.cards} />
      </motion.p>
      <motion.p variants={blurInSm} className="text-xs">{delta}</motion.p>
      {/* Último en el DOM para que se dibuje al final; posicionado arriba a la derecha */}
      <div className="absolute right-5 top-5">
        <Sparkline d={sparkPath} />
      </div>
    </motion.article>
  );
}
```

> El orden de aparición sigue el orden de los hijos `motion` en el DOM (icono → label → valor → delta → sparkline).
> Las variants se propagan aunque haya `div` normales en medio.

### 6.3 AnimatedNumber (number ticker)

```tsx
// src/components/motion/AnimatedNumber.tsx
import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";
import { ease } from "@/lib/motion";

type Props = { value: number; format?: (v: number) => string; duration?: number; delay?: number };

export function AnimatedNumber({ value, format = (v) => Math.round(v).toLocaleString(), duration = 1.1, delay = 0.1 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const current = useRef(0);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    if (reduce) {
      current.current = value;
      el.textContent = format(value);
      return;
    }
    const controls = animate(current.current, value, {
      duration,
      delay,
      ease: ease.outExpo,
      onUpdate: (v) => {
        current.current = v;
        el.textContent = format(v);
      },
    });
    return () => controls.stop();
  }, [inView, value, reduce]);

  return <span ref={ref} className="tabular-nums">{format(0)}</span>;
}
```

- Cuenta **desde 0** al aparecer. Si el dato cambia después, anima desde el valor actual al nuevo.
- `delay` = momento en que el número se vuelve visible: KPIs `0.35 + i * 0.065`, chips de resumen `0.3 + i * 0.065`
  (i = posición en la fila). En el video: ~90 % del valor a los ~0.3 s del inicio del conteo y final a ~1.1 s.
- Usa el formato que ya tenga el proyecto (moneda, compacto "K", %, locale).
- `tabular-nums` es obligatorio: los dígitos no deben "bailar".

### 6.4 Sparkline (line drawing)

```tsx
import { motion } from "motion/react";
import { ease } from "@/lib/motion";

export function Sparkline({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 64 24" className="h-6 w-16" fill="none" aria-hidden>
      <motion.path
        d={d}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          show: {
            pathLength: 1,
            opacity: 1,
            transition: { pathLength: { duration: 0.7, ease: ease.out }, opacity: { duration: 0.15 } },
          },
          exit: { opacity: 0, transition: { duration: 0.2 } },
        }}
      />
    </svg>
  );
}
```

### 6.5 Indicador activo compartido (sidebar y dock)

```tsx
import { LayoutGroup, motion } from "motion/react";
import { blurInSm, ease, spring } from "@/lib/motion";

export function NavList({ items, current, onSelect }: NavListProps) {
  return (
    <LayoutGroup id="sidebar">
      {items.map((it) => {
        const active = it.id === current;
        return (
          <motion.button
            key={it.id}
            variants={blurInSm}
            onClick={() => onSelect(it.id)}
            whileTap={{ scale: 0.97 }}
            transition={spring.hover}
            className="group relative flex w-full items-center gap-3 rounded-2xl px-4 py-3"
          >
            {/* Hover: píldora translúcida */}
            <span className="absolute inset-0 rounded-2xl bg-[var(--nav-hover)] opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
            {/* Activo: la MISMA píldora viaja entre ítems */}
            {active && (
              <motion.span
                layoutId="nav-active-pill"
                transition={spring.indicator}
                className="absolute inset-0 rounded-2xl bg-[var(--surface-elevated)] shadow-[var(--shadow-soft)]"
              />
            )}
            <it.icon className="relative z-10 size-4" />
            {/* El label hace crossfade con blur cuando cambia su estado */}
            <motion.span
              key={active ? "on" : "off"}
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
              transition={{ duration: 0.25, ease: ease.out }}
              className="relative z-10"
            >
              {it.label}
            </motion.span>
            {it.badge ? <span className="relative z-10 ml-auto grid size-5 place-items-center rounded-full text-[10px]">{it.badge}</span> : null}
          </motion.button>
        );
      })}
    </LayoutGroup>
  );
}
```

- El dock usa **el mismo patrón** con otro grupo: `LayoutGroup id="dock"` y `layoutId="dock-active-pill"`.
- Ambos indicadores leen la misma ruta activa: al navegar se mueven **a la vez**.

### 6.6 Título de página

```tsx
<AnimatePresence mode="popLayout" initial={false}>
  <motion.h1
    key={title}
    initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
    animate={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
    exit={{ opacity: 0, transition: { duration: 0.08 } }}
    transition={{ duration: 0.3, ease: ease.out }}
    className="text-3xl font-bold"
  >
    {title}
  </motion.h1>
</AnimatePresence>
```

> En el video, el buscador del header salta de posición cuando cambia el ancho del título.
> Mejora opcional: `layout="position"` en el contenedor del buscador para que se deslice.

### 6.7 Sidebar: entrada "gelatina" + ítems en cascada

```tsx
<motion.aside
  initial={{ scale: 0.95 }}
  animate={{ scale: 1 }}
  transition={spring.jelly}
  style={{ transformOrigin: "50% 100%" }} // crece desde abajo
  className="sidebar-panel"
>
  <Avatar />
  <motion.nav initial="hidden" animate="show" variants={group(stagger.nav, 0.1)}>
    <NavList items={items} current={current} onSelect={go} />
  </motion.nav>
</motion.aside>
```

Si el rebote se siente exagerado en tu layout, sube `damping` de `spring.jelly` a 12.

### 6.8 Dock inferior

```tsx
const dock: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.9, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      y: { ...spring.bouncy, delay: 0.57 },
      scale: { ...spring.bouncy, delay: 0.57 },
      opacity: { duration: 0.3, delay: 0.57 },
      filter: { duration: 0.35, delay: 0.57 },
      delayChildren: 0.77, // labels después del contenedor
      staggerChildren: 0.07,
    },
    transitionEnd: { filter: "none" },
  },
};

// Centrado con flex (NO con translate de CSS)
<div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center gap-3">
  <motion.nav variants={dock} initial="hidden" animate="show" className="pointer-events-auto flex rounded-full p-1.5">
    {/* tabs: motion.button con variants={blurInSm} + pill con layoutId="dock-active-pill" (6.5) */}
  </motion.nav>
  <motion.button variants={dock} initial="hidden" animate="show" whileTap={{ scale: 0.92 }} className="pointer-events-auto size-12 rounded-full">
    +
  </motion.button>
</div>
```

### 6.9 Banner hero e ilustraciones

```tsx
<motion.section variants={cardIn(0.18)} className="hero relative overflow-hidden">
  {/* Decoraciones SIN variants: entran junto con el banner */}
  <div className="chip-flotante">Nuevo lead · …</div>

  <motion.img src={ilustracion3D} variants={riseIn(0.45)} initial="hidden" animate="show" exit="exit" className="origin-bottom" alt="" />

  <div>
    <motion.h2 variants={blurInSm}>Buenas tardes, {nombre}</motion.h2>
    <motion.p variants={blurInSm}>Tienes <b>5 negocios</b> por cerrar…</motion.p>
    <motion.button variants={blurInSm} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="rounded-full">
      Agregar lead
    </motion.button>
  </div>

  <motion.img src={planta3D} variants={growIn(0.97)} initial="hidden" animate="show" exit="exit" className="origin-bottom" alt="" />
</motion.section>
```

- Float opcional (en el video casi no se nota): ilustración con `animate={{ y: [0, -6, 0] }}`,
  `transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}`, solo si no hay reduced motion.

### 6.10 Barras de progreso (relleno izquierda → derecha)

```tsx
export function ProgressFill({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--track)]">
      <motion.div
        className="h-full rounded-full bg-current"
        style={{ width: `${value}%` }}
        variants={{
          hidden: { clipPath: "inset(0 100% 0 0 round 999px)" },
          show: { clipPath: "inset(0 0% 0 0 round 999px)", transition: { duration: 0.7, ease: ease.outExpo } },
        }}
      />
    </div>
  );
}
```

**Barra apilada** (Invoices): contenedor `variants={group(0.12)}` con `flex gap-1`;
cada segmento con su `width` y la misma revelación por `clip-path` (0.5 s), uno tras otro.

### 6.11 Kanban

```tsx
const column = cardIn(0.08, stagger.items);

<motion.div variants={group(stagger.cards, 0.15)} className="grid grid-cols-5 gap-4">
  {columns.map((col) => (
    <motion.section key={col.id} variants={column} className="column rounded-3xl p-3">
      <motion.header variants={blurInSm}>…punto · nombre · conteo · total…</motion.header>
      {col.cards.map((card) => (
        <motion.article
          key={card.id}
          variants={cardIn(0.15, 0.05)}
          whileHover={{ y: -4 }}
          transition={spring.hover}
          className="glass-card p-3"
        >
          …título, empresa, monto + tag…
          <ProgressFill value={card.progress} />
        </motion.article>
      ))}
    </motion.section>
  ))}
</motion.div>
```

Ritmo: columnas cada 65 ms (izquierda → derecha); dentro de cada columna, tarjetas cada 45 ms (arriba → abajo).
Cada tarjeta sube ~12 px con blur. La barra se llena después de que la tarjeta aparece.

### 6.12 Chat (Inbox)

```tsx
const bubble: Variants = {
  hidden: { opacity: 0, scale: 0.8, filter: "blur(8px)" },
  show: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { scale: spring.indicator, opacity: { duration: 0.25 }, filter: { duration: 0.3 } },
    transitionEnd: { filter: "none" },
  },
  exit: { opacity: 0, filter: "blur(6px)", transition: { duration: 0.2 } },
};

<motion.div variants={group(stagger.chat, 0.1)} className="flex flex-col gap-3">
  {messages.map((m) => (
    <motion.div
      key={m.id}
      variants={bubble}
      // Crece desde SU esquina: entrante abajo-izquierda, saliente abajo-derecha
      className={m.mine ? "self-end origin-bottom-right" : "self-start origin-bottom-left"}
    >
      …
    </motion.div>
  ))}
</motion.div>
```

Orden en la página: header "Conversaciones" → lista (ítems cada 45 ms) → header del chat →
respuestas rápidas + input → burbujas (cada 50 ms). Mira `08-chat-mensajes-entrada.png`.

### 6.13 Tabla (Invoices)

```tsx
const row: Variants = {
  hidden: { opacity: 0, y: 10, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.4, ease: ease.out },
    transitionEnd: { filter: "none" },
  },
  exit: { opacity: 0, filter: "blur(6px)", transition: { duration: 0.2 } },
};

<motion.tbody variants={group(stagger.rows, 0.1)}>
  {rows.map((r) => (
    <motion.tr key={r.id} variants={row} className="transition-colors duration-150 hover:bg-[var(--row-hover)]">
      …
    </motion.tr>
  ))}
</motion.tbody>
```

Orden: barra apilada (segmentos) + filtros + encabezados → filas cada 40 ms.
Si `transform`/`filter` en `<tr>` da problemas en tu tabla, usa filas con CSS grid (`div role="row"`).
Con listas largas, anima solo las primeras ~12 filas; el resto aparece sin animación.

### 6.14 Micro-interacciones

| Elemento | Hover | Tap |
|---|---|---|
| KPI, chips, tarjetas kanban | `y: -5` con `spring.hover` + sombra más profunda | `scale: 0.98` |
| Botones píldora | `y: -1` + brillo leve | `scale: 0.97` |
| Ítems del sidebar | píldora translúcida (fade 150 ms) | `scale: 0.97` |
| Tabs del dock | label `opacity 0.7 → 1` | `scale: 0.95` |
| Botones circulares | `scale: 1.05` | `scale: 0.92` |
| Filas de tabla | fondo sutil (150 ms) | — |
| Badge cuando cambia el número | — | pop: `scale 0.6 → 1` con `spring.pop` |

---

## 7. Salidas al navegar (resumen)

- Orden de lectura: header de sección → hero/chips → tarjetas → resto.
- Cada elemento: `opacity → 0`, `blur → 8px`, `scale → 0.98`, 250 ms `ease.inOut`, stagger 35 ms.
- Nada se desliza hacia los lados. El shell no sale.
- La página nueva empieza a entrar ~250 ms después del clic, encima de la vieja (sección 6.1).

---

## 8. Qué NO hacer

- No copiar colores del video.
- No poner rebote en texto, tablas ni listas (el rebote es solo para objetos).
- No usar duraciones largas: ítems ≤ 450 ms, hover ≤ 200 ms percibidos, página completa ≤ ~1.3 s.
- No animar `width`, `height`, `top`, `left` (salvo barras pequeñas vía `clip-path`).
- No ocultar con `display: none` antes de animar: el elemento ocupa su lugar desde el inicio (opacidad 0).
- No volver a animar el shell en cada navegación.
- No bloquear clics durante las animaciones.
- No centrar con `translate` de CSS elementos que Motion transforma.
- No dejar `filter: blur(0px)` puesto al terminar (usa `transitionEnd`).
- No animar en cada re-render: solo al montar, al cambiar de ruta o cuando cambia el dato.

---

## 9. Rendimiento

- Objetivo: 60 fps en un portátil normal. Verifica con la pestaña Performance de DevTools.
- Máximo ~20 elementos con blur animándose a la vez.
- `will-change` solo durante la animación (Motion lo gestiona; no lo pongas fijo en CSS).
- Si el bundle importa: `LazyMotion` + `domAnimation`, usando `m.div` en vez de `motion.div` (opcional).
- Gráficas: anima la línea con `pathLength`; no re-renderices la librería de gráficas en cada frame.

---

## 10. Accesibilidad · reduced motion

- `<MotionConfig reducedMotion="user">` en la raíz: desactiva transforms y layout animations si el usuario lo pide.
- Además, con `useReducedMotion()`:
  - sin blur (solo opacidad, 150 ms);
  - contadores muestran el valor final directo;
  - sin float ni loops;
  - indicador activo: transición corta sin rebote.
- El estado final siempre es visible y legible aunque las animaciones no corran.
- En SSR el contenido arranca oculto (`initial="hidden"`) hasta hidratar. En un admin con login está bien.

---

## 11. Plan por fases (con checklist)

**Fase 1 · Fundamentos**
- Instalar/confirmar `motion` (o usar `framer-motion` si ya está).
- Crear `src/lib/motion.ts` (sección 3) y `AnimatedNumber`, `Sparkline`, `ProgressFill`, `PageTransition`.
- `MotionConfig reducedMotion="user"` en la raíz.
- ✅ El proyecto compila. Nada visual roto.

**Fase 2 · Formas y material (con la paleta propia)**
- Paneles flotantes, radios, píldoras, squircles, sombras teñidas, glass, base del banner (secciones 2 y Anexo A).
- ✅ Comparado con `01`–`04`: mismas formas y jerarquía. Cero colores del video.

**Fase 3 · Shell en movimiento**
- Sidebar (gelatina + cascada + pill compartido + hover), título de página, dock (si aplica) con su pill.
- ✅ Al navegar, los pills viajan con rebote leve y el shell no se re-anima. Coincide con `07` y `10`.

**Fase 4 · Dashboard**
- Hero (cascada + ilustraciones), KPIs (count-up, sparkline, hover), fila de gráficas.
- ✅ La secuencia coincide con `05`, `11`, `12` (±100 ms).

**Fase 5 · Transiciones de página**
- `PageTransition` en todas las rutas del admin. Secciones con variants.
- ✅ Salida escalonada con blur + entrada en cascada, solapadas. Sin saltos de layout ni de scroll. Coincide con `06`.

**Fase 6 · Páginas específicas**
- Kanban, chat, tablas + barras.
- ✅ Coincide con `06`, `08`, `09`.

**Fase 7 · Pulido y QA**
- Micro-interacciones (6.14), reduced motion, rendimiento.
- ✅ Dropdowns, tooltips y modales dentro de tarjetas funcionan (no quedó `filter` puesto).

---

## 12. Criterios de aceptación (QA final)

- [ ] La carga del dashboard se ve como `05`: cascada de ~1.3 s y todo nítido al final.
- [ ] Ningún elemento de contenido aparece "de golpe".
- [ ] Los pills activos del sidebar y del dock viajan con un rebote leve (~10 %) y se asientan en < 0.5 s.
- [ ] Al navegar: lo viejo se difumina escalonado y lo nuevo entra en cascada; se solapan; sin saltos.
- [ ] KPIs y chips cuentan desde 0 (~1 s, ease-out) con números tabulares.
- [ ] Sparklines se dibujan; barras y barra apilada se llenan de izquierda a derecha.
- [ ] Burbujas del chat crecen desde su esquina, una tras otra.
- [ ] Filas de tabla suben y se enfocan en cascada.
- [ ] Hover levanta tarjetas 5 px con spring; tap las hunde un poco.
- [ ] Con "reducir movimiento" activado: solo fades cortos, sin blur, sin rebotes, números finales directos.
- [ ] 60 fps, sin jank.
- [ ] Cero colores del video.

---

## 13. Extras inferidos (no se ven en el video · opcionales)

Los textos de la UI del video sugieren estas interacciones. Impleméntalas solo si te lo pido.

- **Kanban drag & drop** ("arrastra tarjetas entre etapas, suelta en Won para celebrar"):
  al levantar `scale 1.03`, `rotate 1.5deg`, sombra grande (`spring.hover`); las demás tarjetas se reacomodan con `layout`;
  al soltar en la columna final, confeti corto (p. ej. `canvas-confetti`) + pop del contador.
- **Chat en vivo** ("las respuestas llegan en vivo"): indicador "escribiendo…" (3 puntos con `y: [0, -3, 0]` en loop, desfase 0.15 s);
  el mensaje nuevo entra con la variante `bubble`; la lista de conversaciones se reordena con `layout`.
- **Gráficas de la fila inferior** (en el video quedan fuera de cuadro): línea con line drawing + área con fade;
  donut por segmentos (stagger 80 ms); barras que crecen desde abajo (`scaleY`, `origin-bottom`, stagger 50 ms).

---

## Anexo A · Variables CSS de material (asignar a TU paleta)

```css
:root {
  /* Reemplaza TU_COLOR por colores del proyecto. No uses los del video. */
  --surface: TU_COLOR; /* paneles */
  --surface-elevated: TU_COLOR; /* pill activo, tarjetas claras */
  --accent: TU_COLOR; /* color de marca */
  --nav-hover: TU_COLOR; /* hover translúcido del sidebar */
  --row-hover: TU_COLOR; /* hover de filas */
  --track: TU_COLOR; /* fondo de barras */

  --radius-panel: 30px;
  --radius-card: 22px;
  --radius-icon: 14px;

  --shadow-soft: 0 12px 32px -14px color-mix(in oklab, var(--accent) 40%, transparent),
    0 2px 6px -2px rgb(0 0 0 / 0.06);
  --shadow-lift: 0 20px 44px -16px color-mix(in oklab, var(--accent) 50%, transparent),
    0 4px 10px -4px rgb(0 0 0 / 0.08);
  --highlight: inset 0 1px 0 rgb(255 255 255 / 0.6);
  --clay: inset 0 -3px 6px rgb(0 0 0 / 0.12), inset 0 2px 3px rgb(255 255 255 / 0.5);
  --glass-blur: 20px;
}

.glass-card {
  background: color-mix(in oklab, var(--surface) 72%, transparent);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid rgb(255 255 255 / 0.5); /* en tema oscuro, bájalo a ~0.12 */
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-soft), var(--highlight);
}

.squircle {
  border-radius: var(--radius-icon);
  box-shadow: var(--clay), 0 6px 14px -6px color-mix(in oklab, var(--accent) 60%, transparent);
}

/* Base 3D del banner */
.hero {
  border-radius: var(--radius-card);
  box-shadow: inset 0 -8px 0 color-mix(in oklab, var(--accent) 18%, transparent), var(--shadow-soft);
}
```

---

## Anexo B · Mapa de referencias (`docs/motion/referencias/`)

| Imagen | Qué mirar |
|---|---|
| `01`–`04` | Formas, radios y jerarquía del estado final de cada página |
| `05` | Orden y ritmo de la carga inicial |
| `06` | Salida escalonada + entrada en cascada al navegar |
| `07` | Pill del dock: viaje, sobrepaso y crossfade del label |
| `08` | Burbujas: crecen desde su esquina, con blur |
| `09` | Filas en cascada + barra apilada por segmentos |
| `10` | Panel del sidebar: escala con rebote desde abajo + ítems en cascada |
| `11` | Planta: aparece tarde y crece desde abajo |
| `12` | Ilustración 3D: sube con spring y sobrepasa un poco |

### Medidas tomadas del video (30 fps)

- Pill del dock: llega al pico de sobrepaso a ~170 ms del clic (~10 % del recorrido); asentado a ~400 ms.
- Ilustración del hero: sobrepasa ~12 % y se asienta a ~0.8 s.
- Dock: sube ~45 px, sobrepasa ~15 %, se asienta a ~0.6 s; su ancho pasa de ~90 % a 100 %.
- Panel del sidebar: su borde superior sube, se pasa y vuelve (escala desde abajo) en ~0.5 s.
- Ítems del sidebar cada ~60 ms. KPIs cada ~65 ms. Filas cada ~40 ms. Burbujas cada ~50 ms.
- Contenido nuevo tras navegar: empieza ~270 ms después del clic; bloque principal ~530 ms.
- Contadores: ~90 % del valor a los ~0.3 s de empezar, valor final a ~1.1 s (curva expo-out).
