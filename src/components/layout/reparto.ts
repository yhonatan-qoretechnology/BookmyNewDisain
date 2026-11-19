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

   LOS GRUPOS SON POR ROL, Y TIENEN NOMBRE
   Antes había una sola lista de grupos para todo el mundo, y se
   notaba: Reseñas caía en «plataforma» junto a Telemetría, y Stock
   en «negocio» junto a Administradores. Ahora cada rol tiene los
   suyos, agrupados por LO QUE HACES y no por lo que es cada
   módulo, y cada grupo lleva un nombre que se lee en la burbuja.
   Un dueño y un superadmin no usan el panel para lo mismo, así que
   tampoco tienen por qué agruparlo igual.
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
 * Un grupo del raíl: una cajita flotante con su nombre.
 * `id` es también la clave del diccionario (`nav.grupos.<id>`).
 */
type Grupo = { readonly id: string; readonly ids: readonly string[] };

/**
 * Los grupos de cada rol, en orden de arriba abajo, y lo que va al
 * pie (separado del resto, abajo del todo).
 *
 * Un id que no esté en ninguna lista cae en el último grupo, así que
 * una sección nueva aparece sola sin tocar este archivo.
 */
const REPARTO_POR_ROL: Record<string, { grupos: readonly Grupo[]; pie: readonly string[] }> = {
  /* El superadmin vigila la plataforma entera: primero el día a día,
     luego los negocios que administra, luego el dinero y al final lo
     que solo mira él (accesos, monitoreo, telemetría). */
  superadmin: {
    grupos: [
      { id: "dia", ids: ["dashboard", "reservas", "calendario", "clientes"] },
      { id: "negocios", ids: ["empresas", "administradores", "verificacion", "sedes", "personal", "servicios"] },
      { id: "dinero", ids: ["facturacion", "estadisticas", "liquidaciones", "membresias", "referidos"] },
      { id: "plataforma", ids: ["comunicacion", "automatizaciones", "resenas", "stock"] },
      { id: "control", ids: ["accesos", "planMonitoreo", "telemetria"] },
    ],
    pie: ["configuracion", "logout"],
  },

  /* Un dueño abre el panel para ver su día, y de ahí hacia fuera:
     lo que vende, lo que cobra y lo que le hace crecer. Plan y
     Verificación son papeleo de su cuenta: van abajo, con ajustes. */
  owner: {
    grupos: [
      { id: "dia", ids: ["dashboard", "reservas", "calendario", "clientes"] },
      { id: "tuNegocio", ids: ["servicios", "personal", "sedes", "stock"] },
      { id: "dinero", ids: ["facturacion", "estadisticas"] },
      { id: "crecer", ids: ["resenas", "comunicacion", "automatizaciones", "referidos"] },
    ],
    pie: ["plan", "verificacion", "configuracion", "logout"],
  },

  employee: {
    grupos: [{ id: "dia", ids: ["emp-main", "calendario"] }],
    pie: ["configuracion", "logout"],
  },
};
REPARTO_POR_ROL.admin = REPARTO_POR_ROL.owner;

const repartoDe = (role: string) => REPARTO_POR_ROL[role] ?? REPARTO_POR_ROL.owner;

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
export function seccionesDelRail(
  role: string,
  menu: NavItem[],
  principales: NavItem[],
): { grupos: GrupoRail[]; pie: NavItem[] } {
  const { grupos: plantilla, pie: idsPie } = repartoDe(role);
  const enBarra = new Set(principales.map((i) => i.id));
  const pie = idsPie.map((id) => menu.find((i) => i.id === id)).filter((i): i is NavItem => !!i);
  const enPie = new Set(pie.map((i) => i.id));

  const sueltas = menu.filter((i) => !enPie.has(i.id));
  const colocadas = new Set<string>();

  const grupos: GrupoRail[] = plantilla.map((g) => {
    /* El orden lo manda el grupo, no el menú: así «Día a día» sale
       siempre Dashboard · Reservas · Calendario · Clientes, diga lo
       que diga el orden en el que estén declaradas. */
    const items = g.ids
      .map((id) => sueltas.find((i) => i.id === id))
      .filter((i): i is NavItem => !!i);
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

/**
 * La sección del menú en la que estás, entera (con sus hijos), para
 * que la pantalla pueda pintar sus pestañas. Devuelve null si la
 * sección activa no tiene submenú.
 */
export function seccionConHijos(menu: NavItem[], pathname: string): NavItem | null {
  const id = seccionActiva(menu, pathname);
  const item = menu.find((i) => i.id === id);
  return item?.children?.length ? item : null;
}

/**
 * Cuál de los hijos está abierto. Se mira aparte de `seccionActiva`
 * porque ahí gana el padre: `/facturacion/gastos` marca Facturación
 * en el raíl, y aquí marca Gastos en las pestañas.
 *
 * Gana el href más largo, igual que arriba: el padre y el primer
 * hijo comparten ruta a propósito (`/facturacion` es Tickets), así
 * que una comparación simple marcaría los dos.
 */
export function hijoActivo(padre: NavItem, pathname: string): string | null {
  let mejor: NavItem | null = null;
  for (const h of padre.children ?? []) {
    const encaja = pathname === h.href || pathname.startsWith(`${h.href}/`);
    if (encaja && (!mejor || h.href.length > mejor.href.length)) mejor = h;
  }
  return mejor?.id ?? null;
}
