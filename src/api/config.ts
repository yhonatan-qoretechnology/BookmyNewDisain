/* ============================================================
   API · Configuración de conexión al backend (NestJS + Prisma)
   ------------------------------------------------------------
   ⚙️ PUNTO DE CONFIGURACIÓN — CONEXIÓN
   1. Copia `.env.example` a `.env.local` y define:
        NEXT_PUBLIC_API_URL=http://localhost:3000
      (URL donde corre BookMyBackend; Swagger en {URL}/api)
   2. NEXT_PUBLIC_API_URL es obligatorio: toda la información del
      panel proviene exclusivamente del API (sin datos locales).
   3. El backend emite el JWT de dos formas y este cliente usa ambas:
      - cookie httpOnly `access_token` (main.ts → res.cookie) → por
        eso TODAS las peticiones van con credentials: "include".
      - Bearer token (jwt.strategy.ts acepta ambos extractores) →
        guardamos el token del login y lo enviamos en Authorization
        como respaldo para entornos cross-origin.
============================================================ */

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

/** true → se usa el backend real; false → modo demo en memoria */
export const isApiEnabled = (): boolean => API_URL.length > 0;

/** Dónde guardamos el JWT devuelto por POST /auth/login (respaldo
    del cookie httpOnly para el header Authorization) */
export const TOKEN_STORAGE_KEY = "bm_token";

export function getToken(): string | null {
  try { return sessionStorage.getItem(TOKEN_STORAGE_KEY); } catch { return null; }
}
export function setToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    else sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch { /* noop */ }
}
