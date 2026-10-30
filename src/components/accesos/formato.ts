/* ============================================================
   Formato de las filas de auditoría de login (AccesoUsuario)
   ------------------------------------------------------------
   Compartido por el listado de Seguimiento y Control y por la
   ficha de seguimiento de un usuario.
============================================================ */
import type { ApiAccesoUsuario } from "@/api/types";

/** geoip-lite (en el backend) devuelve el país como código ISO-3166
    ("US", "AR"...): acá se traduce a un nombre legible en el idioma
    activo del panel. Si el código no es válido, se muestra tal cual
    en vez de romper la fila entera. */
export function nombrePais(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(iso) ?? iso;
  } catch {
    return iso;
  }
}

/** "ES" → 🇪🇸. Sin código ISO de dos letras, no hay bandera. */
export function bandera(iso: string | null): string {
  if (!iso || !/^[A-Za-z]{2}$/.test(iso)) return "";
  return String.fromCodePoint(...[...iso.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

export function ubicacion(row: ApiAccesoUsuario, locale: string): string {
  const partes = [row.ciudad, nombrePais(row.pais, locale)].filter(Boolean);
  return partes.length ? partes.join(", ") : "—";
}

/** `dispositivo` (mobile/desktop/tablet) siempre llega, pero navegador y SO
    pueden faltar (p. ej. un login sin user-agent): se arma la frase con lo
    que haya, sin dejar un "· " colgando. */
export function dispositivo(row: ApiAccesoUsuario): string {
  const partes = [row.navegador, row.sistemaOperativo].filter(Boolean);
  return partes.length ? `${row.dispositivo || "—"} · ${partes.join(" / ")}` : row.dispositivo || "—";
}

/** `es-ES`/`en-GB` fijos a propósito: el locale del panel es "es"/"en" sin
    país, y DateTimeFormat con solo el idioma usa el formato de EE. UU.
    (mm/dd) para "en", que no es lo que espera nadie acá. */
export function fmtFechaHora(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "es-ES", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
