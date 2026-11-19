/* ============================================================
   robots.txt
   ------------------------------------------------------------
   El panel y sus rutas internas no se indexan: son privadas.

   POR QUÉ ESTÁ ESCRITA A MANO Y NO SE DERIVA DE LAS CARPETAS
   Sería más bonito recorrer src/app/(panel)/ y sacar la lista, pero
   esto se ejecuta en el servidor del build standalone, donde no hay
   árbol de fuentes que recorrer. Así que la lista va escrita, y con
   ella va este recordatorio: AL AÑADIR UNA PANTALLA AL PANEL, HAY
   QUE AÑADIRLA AQUÍ. La de abajo se repasó contra las carpetas
   reales el 19/11/2026.

   LO QUE SE ESCAPABA
   Faltaban once rutas que respondían 200 y eran indexables: diez del
   panel (accesos, automatizaciones, ayuda, liquidaciones, membresias,
   plan, plan-monitoreo, referidos, telemetria, verificacion), todas
   con el mismo <title> y la misma description del layout raíz —o sea,
   diez páginas gemelas y vacías compitiendo entre ellas en Google—, y
   /login-qore, que enseñaba al índice la puerta de QoreTech.

   Lo correcto de verdad sería un `noindex` en el layout del panel,
   que no se puede olvidar nunca. Hoy no se puede: (panel)/layout.tsx,
   employee-dashboard/layout.tsx y login/page.tsx son componentes de
   cliente y en Next no pueden exportar `metadata`. Mientras alguno
   siga siéndolo, esta lista es la única defensa.
============================================================ */
import type { MetadataRoute } from "next";

/** Las pantallas del panel, una por carpeta de src/app/(panel)/. */
const PANEL = [
  "accesos",
  "administradores",
  "automatizaciones",
  "ayuda",
  "calendario",
  "clientes",
  "comunicacion",
  "configuracion",
  "dashboard",
  "empresas",
  "estadisticas",
  "facturacion",
  "liquidaciones",
  "membresias",
  "personal",
  "plan",
  "plan-monitoreo",
  "referidos",
  "resenas",
  "reservas",
  "sedes",
  "servicios",
  "stock",
  "telemetria",
  "verificacion",
];

/** Las puertas de entrada y lo que cuelga de ellas: tampoco se indexan. */
const PRIVADAS = [
  "login",
  "login-qore",
  "employee-dashboard",
  "fijar-password",
  /* El asistente de la web y cualquier otra API: no son páginas. */
  "api",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...PANEL, ...PRIVADAS].map((r) => `/${r}`),
      },
    ],
    sitemap: "https://bookmy.es/sitemap.xml",
  };
}
