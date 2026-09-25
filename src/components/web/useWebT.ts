"use client";
/* ============================================================
   Traducción de la web pública.
   El diccionario de la web cuelga de `web` en el del panel, así
   que aquí solo se antepone ese prefijo: w("nav.home").
============================================================ */
import { useCallback } from "react";
import { useI18n } from "@/i18n";

export function useWebT() {
  const { t, locale, setLocale } = useI18n();
  const w = useCallback((clave: string, vars?: Record<string, string | number>) => t(`web.${clave}`, vars), [t]);
  return { w, locale, setLocale };
}
