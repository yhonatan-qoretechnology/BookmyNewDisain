/* ============================================================
   Colores del panel por negocio
   ------------------------------------------------------------
   El negocio elige UN color de marca y de él salen todos los
   tonos que usa el panel (--teal-50 … --teal-700, el degradado
   de los botones, el halo de foco…). Se pisan las variables de
   globals.css en <html>; sin color, vuelven las de Bookmy.
============================================================ */

/** Colores de marca sugeridos (el primero es el de Bookmy). */
export const COLORES_SUGERIDOS = [
  "#0d9d6d", // Bookmy
  "#2563eb", // azul
  "#7c3aed", // violeta
  "#db2777", // rosa
  "#e11d48", // coral
  "#ea580c", // naranja
  "#ca8a04", // dorado
  "#0f766e", // petróleo
  "#334155", // grafito
  "#111827", // negro
] as const;

const VARIABLES = [
  "--teal-50", "--teal-100", "--teal-400", "--teal-500", "--teal-600", "--teal-700",
  "--grad-teal", "--shadow-icon", "--marca-glow",
] as const;

const CLAVE_LOCAL = "bm_tema_panel";

function hexARgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbAHsl([r, g, b]: [number, number, number]): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s * 100, l * 100];
}

const hsl = (h: number, s: number, l: number) =>
  `hsl(${h.toFixed(1)} ${Math.min(100, Math.max(0, s)).toFixed(1)}% ${Math.min(97, Math.max(4, l)).toFixed(1)}%)`;

/** Valida «#rrggbb». */
export const esColorValido = (c: string | null | undefined): c is string => !!c && /^#[0-9a-fA-F]{6}$/.test(c);

/** Tonos del panel a partir del color de marca. */
export function tonosDe(color: string): Record<(typeof VARIABLES)[number], string> {
  const rgb = hexARgb(color);
  const [h, s, l] = rgbAHsl(rgb);
  /* El color elegido es el «600» (botones y enlaces); el resto se
     desplaza en luminosidad manteniendo el tono. */
  const base = Math.min(Math.max(l, 22), 52);
  return {
    "--teal-50": hsl(h, Math.min(s, 70), 95),
    "--teal-100": hsl(h, Math.min(s, 65), 87),
    "--teal-400": hsl(h, s, base + 14),
    "--teal-500": hsl(h, s, base + 6),
    "--teal-600": hsl(h, s, base),
    "--teal-700": hsl(h, s, base - 8),
    "--grad-teal": `linear-gradient(140deg, ${hsl(h, s, base + 14)}, ${hsl(h, s, base)})`,
    "--shadow-icon": `0 6px 16px rgba(${rgb.join(", ")}, .28)`,
    "--marca-glow": rgb.join(", "),
  };
}

/** Tonos para el modo oscuro: fondos translúcidos y textos más claros. */
function tonosOscuro(color: string): Record<string, string> {
  const rgb = hexARgb(color);
  const [h, s] = rgbAHsl(rgb);
  return {
    "--teal-50": `rgba(${rgb.join(", ")}, .16)`,
    "--teal-100": `rgba(${rgb.join(", ")}, .28)`,
    "--teal-400": hsl(h, s, 62),
    "--teal-500": hsl(h, s, 58),
    "--teal-600": hsl(h, s, 64),
    "--teal-700": hsl(h, s, 74),
  };
}

const ID_ESTILO = "bm-tema-panel";
const bloque = (sel: string, vars: Record<string, string>) =>
  `${sel}{${Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(";")}}`;

/** Aplica el color al panel (o vuelve al de Bookmy con null). Usa una
    hoja propia con más especificidad que globals.css, en claro y oscuro. */
export function aplicarTema(color: string | null | undefined) {
  if (typeof document === "undefined") return;
  let el = document.getElementById(ID_ESTILO) as HTMLStyleElement | null;
  if (!esColorValido(color)) {
    el?.remove();
    try { localStorage.removeItem(CLAVE_LOCAL); } catch { /* sin almacenamiento */ }
    return;
  }
  if (!el) {
    el = document.createElement("style");
    el.id = ID_ESTILO;
    document.head.appendChild(el);
  }
  el.textContent =
    bloque(':root:not([data-theme="dark"])', tonosDe(color)) +
    bloque(':root[data-theme="dark"]', { ...tonosDe(color), ...tonosOscuro(color) });
  /* Recordado en este navegador para no ver un parpadeo verde al entrar */
  try { localStorage.setItem(CLAVE_LOCAL, color); } catch { /* sin almacenamiento */ }
}

/** Color recordado en este navegador (se aplica antes de que responda el API). */
export function temaRecordado(): string | null {
  try {
    const c = localStorage.getItem(CLAVE_LOCAL);
    return esColorValido(c) ? c : null;
  } catch {
    return null;
  }
}
