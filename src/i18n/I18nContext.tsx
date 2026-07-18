"use client";
/* ============================================================
   I18nContext — proveedor de internacionalización
   ------------------------------------------------------------
   ⚙️ PUNTO DE CONFIGURACIÓN #4 — DE DÓNDE SALE EL IDIOMA
   Prioridad de resolución (de mayor a menor):
     1. `session.idioma` → PARÁMETRO DE BASE DE DATOS. El idioma
        vive como parámetro en la tabla de usuarios; el login lo
        trae en la sesión y aquí se aplica automáticamente.
     2. localStorage ("bm_lang") → última preferencia del visitante
        (útil antes de iniciar sesión, p. ej. en el login).
     3. navigator.language → idioma del navegador si está soportado.
     4. DEFAULT_LOCALE → respaldo final.

   ⚙️ PUNTO DE CONFIGURACIÓN #5 — PERSISTENCIA HACIA LA BD
   `setLocale()` actualiza el parámetro en la sesión mediante
   `updateSession({ idioma })`. Cuando exista backend, ese es el
   lugar para disparar el PATCH/UPDATE del parámetro del usuario
   (ver comentario "// → API" más abajo).
============================================================ */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_LOCALE, LANG_STORAGE_KEY, isLocale, type LocaleCode } from "./config";
import { DICTIONARIES } from "./dictionaries";
import { useSession } from "@/context/SessionContext";

/** Variables interpolables en las cadenas: t("clave", { n: 3 }) */
type Vars = Record<string, string | number>;

interface I18nValue {
  locale: LocaleCode;
  setLocale: (code: LocaleCode) => void;
  /** Traduce una clave con notación de puntos: t("login.welcome") */
  t: (path: string, vars?: Vars) => string;
  /** Acceso a listas del diccionario (meses, días…): tList("calendar.dow") */
  tList: (path: string) => string[];
}

const I18nContext = createContext<I18nValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (p) => p,
  tList: () => [],
});

/** Navega el diccionario por la ruta "a.b.c" */
function resolve(locale: LocaleCode, path: string): unknown {
  return path.split(".").reduce<unknown>(
    (node, key) => (node && typeof node === "object" ? (node as Record<string, unknown>)[key] : undefined),
    DICTIONARIES[locale]
  );
}

function interpolate(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { session, updateSession } = useSession();
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE);

  /* Resolución inicial (solo en cliente): localStorage → navegador → defecto.
     El parámetro de BD (session.idioma) se aplica en el efecto siguiente
     en cuanto la sesión termina de cargar. */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LANG_STORAGE_KEY);
      if (isLocale(stored)) { setLocaleState(stored); return; }
      const nav = navigator.language?.slice(0, 2);
      if (isLocale(nav)) setLocaleState(nav);
    } catch { /* SSR / storage bloqueado */ }
  }, []);

  /* 1️⃣ PARÁMETRO DE BD: si la sesión trae `idioma`, manda sobre todo */
  useEffect(() => {
    if (isLocale(session?.idioma)) setLocaleState(session.idioma);
  }, [session?.idioma]);

  /* Refleja el idioma en <html lang="…"> por accesibilidad y SEO */
  useEffect(() => {
    document.documentElement.setAttribute("lang", locale);
  }, [locale]);

  const setLocale = useCallback((code: LocaleCode) => {
    if (!isLocale(code)) return;
    setLocaleState(code);
    try { localStorage.setItem(LANG_STORAGE_KEY, code); } catch { /* noop */ }
    if (session) {
      updateSession({ idioma: code });
      /* Persistencia real del parámetro en la BD:
         PATCH /auth/users/:id { idioma } (UpdateUserDto lo acepta) */
      void import("@/api/modules").then(({ AuthApi }) =>
        AuthApi.updateUser(Number(session.id), { idioma: code }).catch(() => undefined)
      );
    }
  }, [session, updateSession]);

  const t = useCallback((path: string, vars?: Vars): string => {
    const value = resolve(locale, path);
    if (typeof value === "string") return interpolate(value, vars);
    // Respaldo: si falta la clave en el idioma activo, usa el base (es)
    const fallback = resolve(DEFAULT_LOCALE, path);
    return typeof fallback === "string" ? interpolate(fallback, vars) : path;
  }, [locale]);

  const tList = useCallback((path: string): string[] => {
    const value = resolve(locale, path);
    return Array.isArray(value) ? (value as string[]) : [];
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, tList }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
