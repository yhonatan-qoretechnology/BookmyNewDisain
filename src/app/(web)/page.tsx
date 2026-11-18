/* ============================================================
   bookmy.es · la portada
   ------------------------------------------------------------
   El portal: dos puertas y una pregunta. Es la única pantalla de
   la web que no lleva ni cabecera ni pie normales, así que no usa
   <PaginaWeb>: se pinta entera desde <Portal>.
============================================================ */
import type { Metadata } from "next";
import Script from "next/script";
import Portal from "@/components/web/Portal";

export const metadata: Metadata = {
  title: "Bookmy · ¿Qué quieres descubrir?",
  description:
    "Bookmy: la app para reservar citas en segundos y el CRM con IA para gestionar y hacer crecer tu negocio de servicios. Elige qué quieres conocer.",
  alternates: { canonical: "/" },
};

/* Lo que Google necesita para saber qué es esto. Va como JSON-LD, que
   es el formato que entienden los buscadores; no se ve en pantalla. */
const DATOS_ESTRUCTURADOS = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Bookmy",
      url: "https://bookmy.es/",
      logo: "https://bookmy.es/web/v2/img/logo-bookmy.png",
      email: "contacto@bookmy.es",
      sameAs: ["https://www.instagram.com/appbookmy/", "https://www.facebook.com/appbookmy"],
    },
    {
      "@type": "SoftwareApplication",
      name: "Bookmy CRM",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, iOS, Android",
      description:
        "CRM con reservas, cobros, equipo, inventario, sedes y asistente IA para negocios de servicios. Plan Basic y Plan Pro.",
    },
  ],
};

export default function Page() {
  return (
    <>
      <Script
        id="datos-bookmy"
        type="application/ld+json"
        /* El objeto es nuestro y no lleva datos de nadie: se serializa
           tal cual. Se escapa el cierre de etiqueta por si algún texto
           futuro trajera un "</script>" dentro. */
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(DATOS_ESTRUCTURADOS).replace(/</g, "\\u003c"),
        }}
      />
      <Portal />
    </>
  );
}
