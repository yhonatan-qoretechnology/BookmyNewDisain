export * from "./config";
/* Eje del país (ES/CO) aplicado al vocabulario. `setPaisActivo()` es
   el único punto de entrada que necesita quien resuelve el país de la
   empresa (useRegion); `porPais()` es para declarar variantes en los
   diccionarios. */
export * from "./pais";
export { I18nProvider, useI18n } from "./I18nContext";
export type { Dictionary } from "./dictionaries";
