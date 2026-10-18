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

/* ── Aviso: NEXT_PUBLIC_API_URL vacía en el BUILD ─────────────
   Es el fallo más caro de diagnosticar de todo el despliegue. Si la
   variable falta cuando se compila, API_URL queda en cadena vacía y
   `fetch(`${API_URL}${path}`)` se convierte en una petición RELATIVA
   al propio panel: el login pide /auth/login a bookmy.es y recibe el
   404 de Next en HTML. El build sale verde, la web se ve perfecta y
   nadie puede entrar, sin un solo error que apunte a la causa.

   El aviso va en consola y solo en el navegador (en el servidor no
   hay nada que avisar y ensuciaría el log de arranque). No se lanza
   ninguna excepción ni se rompe el build a propósito: cuando la
   variable está puesta —hoy, en local y en producción— esto no se
   ejecuta nunca y el comportamiento es exactamente el de siempre. */
if (typeof window !== "undefined" && API_URL.length === 0) {
  console.error(
    "[BookMy] NEXT_PUBLIC_API_URL no estaba definida al compilar el panel: " +
    "todas las peticiones están saliendo contra " + window.location.origin +
    " en vez de contra el API, así que el login devolverá un 404 en HTML. " +
    "Hay que definir la variable y VOLVER A DESPLEGAR: se incrusta en tiempo " +
    "de compilación, no basta con ponerla y reiniciar el servidor."
  );
}

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
