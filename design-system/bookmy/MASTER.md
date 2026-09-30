# Sistema de diseño · Bookmy

Fuente única de la marca para **bookmy.es** (web pública) y el **panel**.
Si algo no está aquí, se decide primero aquí y luego se implementa.

Se apoya en la guía de UI/UX Pro Max (estilo *Soft UI Evolution*: sombras
suaves en dos capas, contraste medido, movimiento de 200–300 ms), pero la
paleta es la de la marca, no la que propone la herramienta: Bookmy ya
tenía identidad verde y cambiarla habría roto la app móvil y la web.

## Dónde vive cada cosa

| Pieza | Fichero |
|---|---|
| Tokens del panel (claro y oscuro) | `src/styles/globals.css` |
| Tokens y estilos de la web | `public/web/style.css` |
| Componentes del panel | `src/components/**/*.module.css` |
| Textos ES/EN del panel | `src/i18n/dictionaries/{es,en}.ts` |
| Textos ES/EN de la web | `src/i18n/dictionaries/web.{es,en}.ts` |

## Color

El verde de la marca es el mismo en los dos sitios; cambia el tono según
el fondo. En el panel se usan los verdes profundos (legibles durante una
jornada entera) y el neón queda para acentos del modo oscuro y para la web.

| Uso | Claro | Oscuro |
|---|---|---|
| Primario (`--teal-500`) | `#12b981` | `#2fd39a` |
| Primario oscuro (`--teal-600/700`) | `#0d9d6d` / `#0a7b56` | `#35e0a5` / `#6bf7b4` |
| Neón de la web (`--accent-2`) | `#0fb869` | `#39ff8c` |
| Fondo de página | `#f2f6f4` | `#0c1411` |
| Superficie | `#ffffff` | `#121c18` |
| Borde | `#e4ece8` | `#1e2e28` |
| Texto (`--navy-900`) | `#101a24` | `#e8f3ee` |
| Texto secundario (`--slate-500`) | `#6b7c8c` | `#8fa49b` |

Reglas:
- **Nunca** un color a pelo en un módulo: si falta un tono, se añade token.
- `--navy-900` se **invierte** con el tema: no vale como fondo oscuro fijo
  (para eso, `#101a24` literal, como en el avisador).
- Estados: `--red` error, `--amber` aviso, `--green` éxito, `--blue` info.

## Tipografía

- Titulares: **Plus Jakarta Sans** (700/800), `letter-spacing: -.015em`.
- Texto: **Inter** (400/500/600), base 15 px, interlineado 1.55.
- Cifras en tablas y KPIs: `font-variant-numeric: tabular-nums`.
- Las dos llegan por `next/font` (sin llamada a Google) como
  `--font-jakarta` y `--font-inter`, declaradas en `<html>`.

## Espacio, curvas y sombras

- Curvas: `--r-sm 10px`, `--r-md 14px`, `--r-lg 18px`, `--r-xl 22px`.
- Sombras en dos capas: `--shadow-sm | md | lg`; el `lg` solo al levantar
  algo (hover de tarjeta, modal).
- Toda tarjeta lleva `border: 1px solid var(--border)`: en oscuro, sin
  borde, se funde con el fondo.

## Movimiento

- Una sola curva: `--ease: cubic-bezier(.2,.8,.2,1)`.
- Tres duraciones: `--t-fast .16s` (hover), `--t-med .26s` (paneles),
  `--t-slow .42s` (entradas).
- El hundido al pulsar y el levantado al pasar por encima los pone
  framer-motion en `Button.tsx`: no declarar `transform` en su CSS.
- Todo lo no esencial se apaga con `prefers-reduced-motion`.

## Reglas de interfaz que se dan por supuestas

- Foco visible siempre: `2px` del primario con `outline-offset: 2px`.
- Área táctil mínima 44×44 en móvil (`@media (hover: none)`).
- Contraste de texto 4.5:1 como mínimo, también en oscuro.
- Iconos SVG del set propio (`components/ui/Icon.tsx`), nunca emojis.
- Los estados llevan color **y** forma (el punto del `Badge`), no solo color.
- Bajo 720 px las tablas se apilan en tarjetas: cada celda enseña el
  título de su columna (`DataTable` inyecta `data-label`).
- Borrar no es la acción principal de una tarjeta: `variant="dangerGhost"`.

## Anchos de prueba

375 · 390 · 768 · 1024 · 1280 · 1440. Ninguna pantalla debe desplazarse
en horizontal (se comprueba con `scrollWidth - clientWidth`).
