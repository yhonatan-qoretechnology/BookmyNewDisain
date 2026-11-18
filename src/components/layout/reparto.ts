/* ============================================================
   Cómo se reparte el menú entre la barra de arriba y el raíl
   ------------------------------------------------------------
   Nada de esto inventa un menú propio: todo sale del que ya
   calcula `navParaSesion(role, pro)`, que trae el recorte por rol
   y por plan. Aquí solo se decide QUÉ VA DÓNDE.

   · La barra de arriba lleva lo más usado del rol, con su nombre
     escrito. Son pocas y caben.
   · El raíl de la izquierda lleva el resto, en grupos y solo con
     iconos: el nombre aparece en una burbuja al pasar por encima.

   En móvil no hay sitio para la fila de arriba, así que el raíl
   enseña TAMBIÉN las principales (el CSS las esconde a partir de
   861 px). Por eso `seccionesDelRail` las devuelve marcadas en vez
   de quitarlas: así ninguna sección queda inalcanzable.
============================================================ */
import type { NavItem } from "@/models";

/** Cuántos nombres caben en la barra de arriba sin apretarla. */
export const MAX_PRINCIPALES = 5;

/**
 * Lo más usado de cada rol, en orden. Son ids de `NavItem`, los
 * mismos de `src/constants/index.ts`.
 */
const PREFERENCIA: Record<string, readonly string[]> = {
  superadmin: ["dashboard", "empresas", "reservas", "clientes", "facturacion"],
  owner: ["dashboard", "reservas", "calendario", "clientes", "servicios"],
  admin: ["dashboard", "reservas", "calendario", "clientes", "servicios"],
  employee: ["emp-main", "calendario", "configuracion"],
};

/**
 * Los grupos del raíl, en orden de arriba abajo. Cada uno es una
 * cajita flotante aparte, como en la referencia.
 *
 * Un id que no esté en ninguna lista cae en el último grupo, así que
 * una sección nueva aparece sola sin tocar este archivo.
 */
const GRUPOS: readonly { readonly id: string; readonly ids: readonly string[] }[] = [
  { id: "dia", ids: ["dashboard", "emp-main", "reservas", "calendario", "clientes", "servicios"] },
  { id: "negocio", ids: ["empresas", "sedes", "personal", "administradores", "stock", "membresias"] },
  { id: "dinero", ids: ["facturacion", "liquidaciones", "estadisticas", "referidos"] },
  { id: "plataforma", ids: ["comunicacion", "resenas", "automatizaciones", "accesos", "planMonitoreo", "telemetria", "verificacion"] },
];

/** Abajo del todo, separadas del resto, como en la referencia. */
const PIE = ["configuracion", "logout"];

/** Lo que va escrito en la barra de arriba. */
export function seccionesPrincipales(role: string, menu: NavItem[]): NavItem[] {
  const porId = new Map(menu.map((i) => [i.id, i]));
  const elegidas: NavItem[] = [];

  for (const id of PREFERENCIA[role] ?? PREFERENCIA.owner) {
    const item = porId.get(id);
    if (item && elegidas.length < MAX_PRINCIPALES) elegidas.push(item);
  }

  /* Red de seguridad: un rol sin preferencia escrita, o un plan que
     dejó fuera casi todo, se completa con el menú tal cual. */
  if (elegidas.length < 3) {
    for (const item of menu) {
      if (elegidas.length >= MAX_PRINCIPALES) break;
      if (item.id !== "logout" && !elegidas.some((e) => e.id === item.id)) elegidas.push(item);
    }
  }

  return elegidas;
}

export type GrupoRail = {
  id: string;
  items: NavItem[];
  /** Todas sus secciones están ya en la barra de arriba: en escritorio sobra. */
  soloMovil: boolean;
};

/**
 * Lo que va en el raíl, repartido en cajitas.
 * @param principales Las que ya lleva la barra de arriba; vienen
 *   marcadas, no quitadas (ver la cabecera del archivo).
 */
export function seccionesDelRail(menu: NavItem[], principales: NavItem[]): { grupos: GrupoRail[]; pie: NavItem[] } {
  const enBarra = new Set(principales.map((i) => i.id));
  const pie = PIE.map((id) => menu.find((i) => i.id === id)).filter((i): i is NavItem => !!i);
  const enPie = new Set(pie.map((i) => i.id));

  const sueltas = menu.filter((i) => !enPie.has(i.id));
  const colocadas = new Set<string>();

  const grupos: GrupoRail[] = GRUPOS.map((g) => {
    const items = sueltas.filter((i) => g.ids.includes(i.id));
    items.forEach((i) => colocadas.add(i.id));
    return { id: g.id, items, soloMovil: items.length > 0 && items.every((i) => enBarra.has(i.id)) };
  });

  /* Lo que no encaja en ningún grupo escrito se va al último, para que
     una sección nueva no se quede sin sitio. */
  const resto = sueltas.filter((i) => !colocadas.has(i.id));
  if (resto.length) {
    const ultimo = grupos[grupos.length - 1];
    ultimo.items = [...ultimo.items, ...resto];
    ultimo.soloMovil = ultimo.items.every((i) => enBarra.has(i.id));
  }

  return { grupos: grupos.filter((g) => g.items.length > 0), pie };
}

/**
 * Id de la sección activa: gana la ruta MÁS LARGA que encaje, para
 * que `/reservas/nueva` marque Reservas y `/facturacion/gastos`
 * marque Facturación. La barra de arriba y el raíl usan este mismo
 * criterio, que es lo que hace que los dos indicadores coincidan
 * siempre (MOTION_SPEC §6.5).
 *
 * Fuera del concurso: "Cerrar sesión", que apunta al login, y
 * cualquier href de un solo carácter, que encajaría con todo.
 */
export function seccionActiva(items: NavItem[], pathname: string): string | null {
  let mejor: NavItem | null = null;
  for (const item of items) {
    if (item.id === "logout" || item.href.length < 2) continue;
    const dentro = item.children?.some((c) => pathname === c.href || pathname.startsWith(`${c.href}/`));
    const encaja = dentro || pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (encaja && (!mejor || item.href.length > mejor.href.length)) mejor = item;
  }
  return mejor?.id ?? null;
}
