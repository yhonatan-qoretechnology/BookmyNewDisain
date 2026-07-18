/* ============================================================
   Registro de diccionarios
   ------------------------------------------------------------
   ⚙️ PUNTO DE CONFIGURACIÓN #3 — Registra aquí cada idioma nuevo:
   import fr from "./fr";  →  { es, en, fr }
============================================================ */
import type { LocaleCode } from "../config";
import es, { type Dictionary } from "./es";
import en from "./en";

export type { Dictionary };

export const DICTIONARIES: Record<LocaleCode, Dictionary> = { es, en };
