/* ============================================================
   AuthController — autenticación contra AuthModule (NestJS)
   POST /auth/login → { user, token } | { error }. El backend fija
   además el cookie httpOnly `access_token`; guardamos el token para
   el header Authorization (jwt.strategy.ts acepta ambos).
============================================================ */
import type { Session } from "@/models";
import { SESSION_STORAGE_KEY } from "@/constants";
import { isApiEnabled, setToken } from "@/api/config";
import { AuthApi, EmpresasApi, SedesApi } from "@/api/modules";
import { mapUserToSession } from "@/api/mappers";

export const AuthController = {
  /* ── Persistencia de la sesión (sessionStorage) ────────── */

  /** Recupera la sesión persistida del navegador. */
  getSession(): Session | null {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch { return null; }
  },

  /** Persiste la sesión activa. */
  setSession(s: Session) {
    try { sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(s)); } catch { /* noop */ }
  },

  /** Elimina sesión y token (el cookie httpOnly expira en el backend). */
  clearSession() {
    try { sessionStorage.removeItem(SESSION_STORAGE_KEY); } catch { /* noop */ }
    setToken(null);
  },

  /**
   * Inicia sesión contra POST /auth/login y construye la sesión del
   * panel a partir de Users + AdminProfile + UserData, incluido el
   * parámetro de idioma de la BD (user_data.idioma).
   * @param email Correo del usuario.
   * @param password Contraseña.
   * @returns `{ session }` en éxito o `{ error }` legible.
   */
  async login(email: string, password: string): Promise<{ session?: Session; error?: string }> {
    if (!isApiEnabled()) {
      return { error: "API_NOT_CONFIGURED" };
    }
    const res = await AuthApi.login(email, password);
    if (res.error || !res.user || !res.token) {
      return { error: res.error || "Credenciales incorrectas." };
    }
    setToken(res.token);

    // Nombres de empresa y sede del AdminProfile (opcionales)
    let negocioName = "";
    let sedeName: string | undefined;
    const empresaId = res.user.AdminProfile?.empresaId;
    const sedeId = res.user.AdminProfile?.sedeId;
    try {
      if (empresaId != null) negocioName = (await EmpresasApi.findOne(empresaId)).nombre;
      if (sedeId != null) sedeName = (await SedesApi.findOne(sedeId)).nombre;
    } catch { /* el panel funciona sin los nombres */ }

    const session = mapUserToSession(res.user, { negocioName, sedeName });
    if (!session) {
      setToken(null);
      return { error: "CLIENT_ROLE" };
    }
    return { session };
  },
};
