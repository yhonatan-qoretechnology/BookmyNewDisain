/* El panel y sus rutas internas no se indexan: son privadas. */
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/login",
          "/dashboard",
          "/reservas",
          "/clientes",
          "/servicios",
          "/personal",
          "/calendario",
          "/resenas",
          "/sedes",
          "/estadisticas",
          "/facturacion",
          "/stock",
          "/comunicacion",
          "/configuracion",
          "/empresas",
          "/administradores",
          "/employee-dashboard",
          "/fijar-password",
        ],
      },
    ],
    sitemap: "https://bookmy.es/sitemap.xml",
  };
}
