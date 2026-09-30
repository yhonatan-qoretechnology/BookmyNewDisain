"use client";
/* ============================================================
   ThemeContext — modo claro / oscuro (localStorage + prefers)
============================================================ */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { THEME_STORAGE_KEY } from "@/constants";

export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  // Sincronizar con lo que el script inline ya aplicó antes de hidratar
  useEffect(() => {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "dark" || attr === "light") setThemeState(attr);
  }, []);

  /* En papel siempre modo claro: los navegadores no imprimen fondos por
     defecto y el tema oscuro dejaba texto casi blanco sobre la hoja. Se
     cambia solo el atributo, sin tocar la preferencia guardada. */
  useEffect(() => {
    let previo: string | null = null;
    const antes = () => {
      previo = document.documentElement.getAttribute("data-theme");
      if (previo === "dark") document.documentElement.setAttribute("data-theme", "light");
    };
    const despues = () => {
      if (previo === "dark") document.documentElement.setAttribute("data-theme", "dark");
      previo = null;
    };
    window.addEventListener("beforeprint", antes);
    window.addEventListener("afterprint", despues);
    return () => {
      window.removeEventListener("beforeprint", antes);
      window.removeEventListener("afterprint", despues);
    };
  }, []);

  const apply = useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem(THEME_STORAGE_KEY, t);
  }, []);

  const toggleTheme = useCallback(() => {
    apply(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
  }, [apply]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: apply }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
