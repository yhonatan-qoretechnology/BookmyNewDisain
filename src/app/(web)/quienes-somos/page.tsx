/* ============================================================
   /quienes-somos — la pantalla de «Quiénes somos»
   ------------------------------------------------------------
   Esta mitad es de servidor y solo existe para los metadatos: el
   <head> de quienes-somos.html, con el canonical apuntando ya a la
   ruta (el .html se quedó en la web estática). El contenido vive
   en el componente cliente, que es quien necesita el diccionario.

   El `title` va SIN «· Bookmy»: lo pone la plantilla del layout de
   la web ("%s · Bookmy"), así que escribirlo aquí lo duplicaría.
   El de Open Graph sí lo lleva, porque ese no pasa por plantilla.
============================================================ */
import type { Metadata } from "next";
import QuienesSomos from "@/components/web/QuienesSomos";
import { WEB } from "@/lib/web/rutas";

const DESCRIPCION =
  "Hacemos que los negocios de servicios funcionen solos: tecnología de gran empresa, sin su complejidad. Conoce Bookmy.";

export const metadata: Metadata = {
  title: "Quiénes somos",
  description: DESCRIPCION,
  alternates: { canonical: WEB.quienesSomos },
  openGraph: {
    title: "Quiénes somos · Bookmy",
    description: DESCRIPCION,
    url: WEB.quienesSomos,
    /* 640x640, que es lo que mide el fichero de verdad. Decia 1200x630,
       la tarjeta horizontal de siempre, y eso hace que las redes
       reserven un hueco ancho y metan dentro una imagen cuadrada
       recortada. Mas vale decir la medida real. */
    images: [{ url: "/web/img/dashboard-b.png", width: 640, height: 640, alt: "Bookmy" }],
  },
};

export default function Page() {
  return <QuienesSomos />;
}
