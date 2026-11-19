/* ============================================================
   /contacto — escribir al equipo
   ------------------------------------------------------------
   El mensaje va a POST /contacto del backend, que comprueba el
   reCAPTCHA v3 y manda el correo a contacto@bookmy.es.
============================================================ */
import type { Metadata } from "next";
import PaginaWeb from "@/components/web/PaginaWeb";
import FormularioContacto from "./FormularioContacto";
import { WEB } from "@/lib/web/rutas";

const DESCRIPCION =
  "Escríbenos sobre ventas, soporte técnico o cualquier duda sobre Bookmy. Te respondemos lo antes posible.";

export const metadata: Metadata = {
  title: "Contacto",
  description: DESCRIPCION,
  alternates: { canonical: WEB.contacto },
  /* SIN ESTO, NO HEREDA: SE QUEDA CON EL DE LA PORTADA.
     Next no fusiona `openGraph` campo a campo; si una página no lo
     declara, sale TAL CUAL el del layout. Esta página no lo tenía, así
     que al compartirla en WhatsApp o LinkedIn salía el og:url de la
     portada y la tarjeta de «¿Qué quieres descubrir?»: tres páginas
     distintas compartiendo la misma vista previa y apuntando todas a
     la raíz. Por eso se repiten aquí type, siteName y locale. */
  openGraph: {
    type: "website",
    siteName: "Bookmy",
    locale: "es_ES",
    url: WEB.contacto,
    title: "Contacto · Bookmy",
    description: DESCRIPCION,
    /* La tarjeta social de 1200x630 (scripts/tarjeta-social.py). Antes
       apuntaba a dashboard-b.png, que mide 640x640. */
    images: [{ url: "/web/v2/img/tarjeta-social.png", width: 1200, height: 630, alt: "Bookmy" }],
  },
};

export default function Page() {
  return (
    <PaginaWeb mundo="crm" pagina="contacto">
      <FormularioContacto />
    </PaginaWeb>
  );
}
