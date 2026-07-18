/* ============================================================
   i18n · Configuración de idiomas
   ------------------------------------------------------------
   ⚙️ PUNTO DE CONFIGURACIÓN #1 — AGREGAR UN IDIOMA NUEVO
   1. Añade su entrada en `LOCALES` (código ISO, etiqueta, bandera).
   2. Crea `dictionaries/<código>.ts` copiando `es.ts` y traduciendo.
   3. Regístralo en `dictionaries/index.ts`.
   Nada más: el selector del topbar y el proveedor lo detectan solos.
============================================================ */

/** Códigos de idioma soportados. Amplía esta unión al agregar idiomas. */
export type LocaleCode = "es" | "en";

export interface LocaleDef {
  code: LocaleCode;
  /** Nombre del idioma en su propia lengua (se muestra en el selector) */
  label: string;
  /** Emoji de bandera para el selector */
  flag: string;
}

/** Idiomas disponibles en la plataforma (orden = orden del selector) */
export const LOCALES: LocaleDef[] = [
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "en", label: "English", flag: "🇺🇸" },
  // { code: "fr", label: "Français", flag: "🇫🇷" }, ← ejemplo de ampliación
];

/** Idioma por defecto cuando no hay parámetro de BD ni preferencia local */
export const DEFAULT_LOCALE: LocaleCode = "es";

/** Clave de persistencia local de la preferencia de idioma */
export const LANG_STORAGE_KEY = "bm_lang";

/** Type guard: valida que un valor arbitrario (p. ej. el parámetro que
    llega de la base de datos) sea un idioma soportado. */
export function isLocale(value: unknown): value is LocaleCode {
  return typeof value === "string" && LOCALES.some((l) => l.code === value);
}
