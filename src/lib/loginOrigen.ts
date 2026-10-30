/* ============================================================
   Por qué puerta se entró al panel
   ------------------------------------------------------------
   El panel tiene dos pantallas de acceso: /login (BookMy) y
   /login-qore (QoreTech, para el equipo de QORE Technology).
   Quien entra por la de QoreTech tiene que volver a ella al
   cerrar sesión, al caducarle la sesión o al llegar sin sesión
   a una ruta privada; si no, acabaría en el login de BookMy.

   Se recuerda por pestaña, igual que la sesión (sessionStorage):
   el login de QoreTech lo apunta; el de BookMy y el alta de un
   negocio (que también abre sesión) lo borran.
============================================================ */
import { ROUTES } from "@/constants";

const CLAVE = "bm_login_origen";

export type OrigenLogin = "bookmy" | "qore";

/** Pinta el panel con los colores de la marca por la que se entró.
    El CSS cuelga de [data-marca="qore"]; sin atributo, los de BookMy. */
export function aplicarMarca(origen: OrigenLogin): void {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  if (origen === "qore") html.setAttribute("data-marca", "qore");
  else html.removeAttribute("data-marca");
}

/** Lo llama todo lo que abre una sesión, al entrar con éxito. */
export function recordarOrigenLogin(origen: OrigenLogin): void {
  try {
    if (origen === "qore") sessionStorage.setItem(CLAVE, "qore");
    else sessionStorage.removeItem(CLAVE);
  } catch { /* almacenamiento bloqueado: se vuelve a /login */ }
  /* Fuera del try: aunque el almacenamiento esté bloqueado, la sesión de
     esta pestaña sí debe verse con su marca. */
  aplicarMarca(origen);
}

/** Marca recordada en esta pestaña. */
export function marcaActual(): OrigenLogin {
  try {
    return sessionStorage.getItem(CLAVE) === "qore" ? "qore" : "bookmy";
  } catch {
    return "bookmy";
  }
}

/** Pantalla de acceso a la que hay que volver en esta pestaña. */
export function rutaDeLogin(): string {
  try {
    return sessionStorage.getItem(CLAVE) === "qore" ? ROUTES.loginQore : ROUTES.login;
  } catch {
    return ROUTES.login;
  }
}
