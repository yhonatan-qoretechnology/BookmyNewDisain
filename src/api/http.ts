/* ============================================================
   API · Cliente HTTP
   Espejo de cómo el backend espera las peticiones:
   - JSON por defecto (ValidationPipe con whitelist en el backend:
     enviar SOLO los campos del DTO o responde 400).
   - credentials: "include" para el cookie `access_token`.
   - Authorization: Bearer como respaldo (jwt.strategy.ts).
============================================================ */
import { API_URL, getToken } from "./config";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

/** Construye ?a=1&b=2 omitiendo undefined/null/"" */
export function qs(params?: Record<string, string | number | undefined | null>): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );
  if (entries.length === 0) return "";
  return "?" + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(init.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "include", // cookie httpOnly access_token
  });

  const text = await res.text();
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }

  if (!res.ok) {
    const msg =
      (body as { message?: string | string[] })?.message?.toString() ||
      `HTTP ${res.status}`;
    throw new ApiError(res.status, Array.isArray(msg) ? msg.join(", ") : msg, body);
  }
  return body as T;
}

export const http = {
  get:   <T>(path: string) => request<T>(path),
  post:  <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data !== undefined ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH", body: data !== undefined ? JSON.stringify(data) : undefined }),
  put:   <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PUT", body: data !== undefined ? JSON.stringify(data) : undefined }),
  /** DELETE admite cuerpo: algunos endpoints lo exigen, como
      DELETE /sedes/:id/imagenes, que recibe { imagenes: [...] }. */
  delete:<T>(path: string, data?: unknown) =>
    request<T>(path, { method: "DELETE", body: data !== undefined ? JSON.stringify(data) : undefined }),
  /** Para endpoints multipart (fotos, logos): NO fijar Content-Type
      — el navegador añade solo el boundary. */
  postForm: <T>(path: string, form: FormData) =>
    request<T>(path, { method: "POST", body: form }),
  /** Igual que postForm pero con PATCH: casi todas las subidas de imagen
      del backend (foto de perfil, logo, imagen de profesional y de
      categoría) están declaradas como @Patch, no @Post. */
  patchForm: <T>(path: string, form: FormData) =>
    request<T>(path, { method: "PATCH", body: form }),
  /** Multipart con PUT — lo usa el reemplazo de una imagen de sede
      por su posición (PUT /sedes/:id/imagenes/:index). */
  putForm: <T>(path: string, form: FormData) =>
    request<T>(path, { method: "PUT", body: form }),
};
