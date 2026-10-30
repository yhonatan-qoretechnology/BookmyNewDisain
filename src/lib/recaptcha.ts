/* ============================================================
   reCAPTCHA v3 — token para los formularios públicos
   ------------------------------------------------------------
   v3 no muestra casillas: Google puntúa la visita en segundo
   plano y el backend decide con esa puntuación (RecaptchaGuard).
   El script solo se carga la primera vez que un formulario pide
   un token, no en todas las páginas.

   Sin NEXT_PUBLIC_RECAPTCHA_SITE_KEY no se carga nada y se
   devuelve null: el backend sin RECAPTCHA_SECRET_KEY tampoco
   verifica, así que el desarrollo local funciona igual.

   La `accion` debe ser la misma que espera el endpoint
   (@Recaptcha({ accion }) en el backend).
============================================================ */

export type AccionRecaptcha =
  | "contacto"
  | "registro_negocio"
  | "login"
  | "recuperar_password"
  | "fijar_password";

interface GrecaptchaV3 {
  ready(cb: () => void): void;
  execute(siteKey: string, opciones: { action: string }): Promise<string>;
}

declare global {
  interface Window {
    grecaptcha?: GrecaptchaV3;
  }
}

/** Cabecera que lee el backend. */
export const RECAPTCHA_HEADER = "x-recaptcha-token";

const SITE_KEY = (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "").trim();

let carga: Promise<GrecaptchaV3> | null = null;

function cargarScript(): Promise<GrecaptchaV3> {
  if (carga) return carga;
  carga = new Promise<GrecaptchaV3>((resolve, reject) => {
    if (window.grecaptcha) {
      window.grecaptcha.ready(() => resolve(window.grecaptcha!));
      return;
    }
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(SITE_KEY)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => window.grecaptcha?.ready(() => resolve(window.grecaptcha!));
    script.onerror = () => {
      carga = null; // permite reintentar en el siguiente envío
      reject(new Error("No se pudo cargar reCAPTCHA"));
    };
    document.head.appendChild(script);
  });
  return carga;
}

/**
 * Token de reCAPTCHA para una acción, o null si no hay clave de sitio o
 * Google no carga (bloqueador, red). En ese caso el formulario se envía
 * igual y es el backend quien decide: si el CAPTCHA es obligatorio ahí,
 * responderá con un error claro.
 */
export async function tokenRecaptcha(accion: AccionRecaptcha): Promise<string | null> {
  if (!SITE_KEY || typeof window === "undefined") return null;
  try {
    const g = await cargarScript();
    return await g.execute(SITE_KEY, { action: accion });
  } catch {
    return null;
  }
}

/** Cabeceras para `http.*` con el token, si lo hay. */
export async function cabecerasRecaptcha(accion: AccionRecaptcha): Promise<Record<string, string>> {
  const token = await tokenRecaptcha(accion);
  return token ? { [RECAPTCHA_HEADER]: token } : {};
}
