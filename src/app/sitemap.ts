/* Mapa del sitio de la web pública: lo que debe indexar un buscador.
   El panel queda fuera a propósito (requiere sesión). */
import type { MetadataRoute } from "next";

const BASE = "https://bookmy.es";

export default function sitemap(): MetadataRoute.Sitemap {
  const ahora = new Date();
  return [
    { url: `${BASE}/`, lastModified: ahora, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/bookmy-free`, lastModified: ahora, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/bookmy-crm-pro`, lastModified: ahora, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/contacto`, lastModified: ahora, changeFrequency: "yearly", priority: 0.6 },
    { url: `${BASE}/privacidad`, lastModified: ahora, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/cookies`, lastModified: ahora, changeFrequency: "yearly", priority: 0.3 },
  ];
}
