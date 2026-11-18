/* ============================================================
   Qué secciones enseña el dock inferior (MOTION_SPEC.md §6.8)
   ------------------------------------------------------------
   El dock NO inventa su propio menú: recorta el que ya calcula
   `navParaSesion(role, pro)`. Así nunca ofrece una sección que
   el rol no tenga o que el plan del negocio no incluya, y el día
   que cambie el menú real el dock cambia con él.

   Aquí solo se decide el ORDEN de preferencia (qué es lo más
   usado de cada rol) y cuántas pestañas caben. Ninguna regla de
   permisos vive en este archivo.
============================================================ */
import type { NavItem } from "@/models";

/** Cuántas pestañas caben en la píldora sin que se estreche el texto. */
export const MAX_DOCK = 5;

/**
 * Lo más usado de cada rol, en orden. Son ids de `NavItem`, los
 * mismos de `src/constants/index.ts`.
 *
 * - superadmin: vigila negocios y su facturación.
 * - owner / admin: el día a día de un negocio es agenda y clientes.
 * - employee: su panel propio y su calendario (lo demás no lo ve).
 */
const PREFERENCIA: Record<string, readonly string[]> = {
  superadmin: ["dashboard", "empresas", "reservas", "clientes", "facturacion"],
  owner: ["dashboard", "reservas", "calendario", "clientes", "servicios"],
  admin: ["dashboard", "reservas", "calendario", "clientes", "servicios"],
  employee: ["emp-main", "calendario", "configuracion"],
};

/** Nunca en el dock: cerrar sesión se hace desde el menú lateral. */
const FUERA = new Set(["logout"]);

/**
 * Pestañas del dock para una sesión.
 * @param role Rol de la sesión.
 * @param menu El menú real del rol (`navParaSesion`), que ya trae el
 *   recorte por plan.
 */
export function seccionesDelDock(role: string, menu: NavItem[]): NavItem[] {
  const disponibles = menu.filter((i) => !FUERA.has(i.id));
  const porId = new Map(disponibles.map((i) => [i.id, i]));

  const elegidas: NavItem[] = [];
  for (const id of PREFERENCIA[role] ?? PREFERENCIA.owner) {
    const item = porId.get(id);
    if (item && elegidas.length < MAX_DOCK) elegidas.push(item);
  }

  /* Red de seguridad: si un rol nuevo no tiene preferencia escrita,
     o el plan dejó fuera casi todo, se completa con el menú tal cual
     en vez de enseñar un dock de una sola pestaña. */
  if (elegidas.length < 3) {
    for (const item of disponibles) {
      if (elegidas.length >= MAX_DOCK) break;
      if (!elegidas.some((e) => e.id === item.id)) elegidas.push(item);
    }
  }

  return elegidas;
}

/**
 * Id de la sección activa: gana la ruta MÁS LARGA que encaje, para
 * que `/employee-dashboard/calendario` marque Calendario y no el
 * panel que lo contiene. `/reservas/nueva` marca Reservas.
 */
export function seccionActiva(items: NavItem[], pathname: string): string | null {
  let mejor: NavItem | null = null;
  for (const item of items) {
    const encaja = pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (encaja && (!mejor || item.href.length > mejor.href.length)) mejor = item;
  }
  return mejor?.id ?? null;
}
