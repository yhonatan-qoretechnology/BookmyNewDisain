/* ============================================================
   jwt — lectura del payload del JWT en el cliente (sin validar
   firma: eso ya lo hizo el backend al emitirlo). Se usa solo para
   leer datos que el backend agrega al token y no repite en el
   cuerpo de POST /auth/login, como `profesionalId` para EMPLOYEE.
============================================================ */

/** Decodifica el payload (segundo segmento) de un JWT. `null` si el
    token no tiene forma de JWT o el payload no es JSON válido. */
export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    /* base64url → base64 estándar antes de atob */
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(
      payload.length + (4 - (payload.length % 4)) % 4, "="
    );
    const json = decodeURIComponent(
      atob(base64).split("").map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
    );
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
