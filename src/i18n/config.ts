/* ============================================================
   i18n · Configuración de idiomas
   ------------------------------------------------------------
   ⚙️ PUNTO DE CONFIGURACIÓN #1 — AGREGAR UN IDIOMA NUEVO
   1. Añade su entrada en `LOCALES` (código ISO y etiqueta).
   2. Crea `dictionaries/<código>.ts` copiando `es.ts` y traduciendo.
   3. Regístralo en `dictionaries/index.ts`.
   Nada más: el selector del topbar y el proveedor lo detectan solos.

   ⚠️ Idioma no es país. Aquí se configura la lengua de la interfaz,
   que la persona elige; el país del negocio (ES/CO) se fija en el
   alta de la empresa y vive en `pais.ts`. Un colombiano puede pedir
   el panel en inglés y sigue cobrando en pesos.
============================================================ */

/** Códigos de idioma soportados. Amplía esta unión al agregar idiomas. */
export type LocaleCode = "es" | "en";

export interface LocaleDef {
  code: LocaleCode;
  /** Nombre del idioma en su propia lengua (se muestra en el selector) */
  label: string;
}

/** Idiomas disponibles en la plataforma (orden = orden del selector) */
/* Sin banderas a proposito: una bandera no es un idioma. El espanol se
   habla igual en Bogota que en Malaga, y el ingles no es estadounidense.
   A un negocio colombiano, ver la bandera de Espana en su panel le dice
   "esto es software extranjero". */
export const LOCALES: LocaleDef[] = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  // { code: "fr", label: "Français" }, ← ejemplo de ampliación
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
