/* Mapa del sitio de la web pública: lo que debe indexar un buscador.
   El panel queda fuera a propósito (requiere sesión).

   Las direcciones salen de WEB (src/lib/web/rutas.ts) y no escritas a
   mano: este archivo se quedó anunciando /bookmy-free y
   /bookmy-crm-pro meses después de que fueran un 301, y sin las
   páginas nuevas. Atado a rutas.ts, mudar una página la mueve aquí
   también. Las que SON un 301 no se listan: pedirle a Google que
   indexe una redirección es pedirle que se mude dos veces. */
import type { MetadataRoute } from "next";
import { WEB } from "@/lib/web/rutas";

const BASE = "https://bookmy.es";

/** `priority` es la importancia relativa dentro de ESTE sitio, no una nota. */
const PAGINAS: { ruta: string; cada: "weekly" | "monthly" | "yearly"; peso: number }[] = [
  { ruta: WEB.portada, cada: "weekly", peso: 1 },

  /* Las dos puertas del portal: lo primero que tiene que encontrar quien
     busque "bookmy". */
  { ruta: WEB.app, cada: "weekly", peso: 0.9 },
  { ruta: WEB.crm, cada: "weekly", peso: 0.9 },

  { ruta: WEB.appEmpresas, cada: "monthly", peso: 0.8 },
  { ruta: WEB.planes, cada: "monthly", peso: 0.9 },
  { ruta: WEB.planBasic, cada: "monthly", peso: 0.8 },
  { ruta: WEB.planPro, cada: "monthly", peso: 0.8 },
  { ruta: WEB.comoFunciona, cada: "monthly", peso: 0.7 },
  { ruta: WEB.asistenteIa, cada: "monthly", peso: 0.7 },
  { ruta: WEB.quienesSomos, cada: "monthly", peso: 0.5 },
  { ruta: WEB.crearCuenta, cada: "monthly", peso: 0.8 },

  { ruta: WEB.contacto, cada: "yearly", peso: 0.6 },
  { ruta: WEB.privacidad, cada: "yearly", peso: 0.3 },
  { ruta: WEB.cookies, cada: "yearly", peso: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const ahora = new Date();
  return PAGINAS.map(({ ruta, cada, peso }) => ({
    url: `${BASE}${ruta === "/" ? "" : ruta}`,
    lastModified: ahora,
    changeFrequency: cada,
    priority: peso,
  }));
}
