/* ============================================================
   /como-funciona · los metadatos
   ------------------------------------------------------------
   Esta pantalla era como-funciona.html. Su <head> traía título,
   descripción, canónica y Open Graph propios, y eso es justo lo
   que se exporta aquí.

   El archivo es de SERVIDOR a propósito, aunque no pinte nada:
   `metadata` solo lo lee Next en componentes de servidor, y el
   cuerpo necesita el navegador (los textos salen del hook de
   traducción y las dos escenas van con el scroll). Por eso el
   marcado vive al lado, en ComoFunciona.tsx, que sí es cliente.

   El título va como `absolute` porque el del original ya nombra
   la marca: sin eso, la plantilla del layout («%s · Bookmy») lo
   dejaría diciendo Bookmy dos veces.

   La imagen social es la misma del original, que sigue estando en
   /public/web/img (es de la web anterior, no del diseño nuevo).
============================================================ */
import type { Metadata } from "next";
import { WEB } from "@/lib/web/rutas";
import ComoFunciona from "./ComoFunciona";

const TITULO = "Cómo funciona el CRM Bookmy · De la primera reserva al piloto automático";
const DESCRIPCION =
  "Crea tu cuenta, configura servicios y equipo, comparte tu perfil y deja que Bookmy automatice reservas, recordatorios, cobros y ventas.";

export const metadata: Metadata = {
  title: { absolute: TITULO },
  description: DESCRIPCION,
  alternates: { canonical: WEB.comoFunciona },
  openGraph: {
    type: "website",
    siteName: "Bookmy",
    locale: "es_ES",
    url: WEB.comoFunciona,
    title: TITULO,
    description: DESCRIPCION,
    /* La tarjeta social de 1200x630 (scripts/tarjeta-social.py). Antes
       apuntaba a dashboard-b.png, que mide 640x640. */
    images: [{ url: "/web/v2/img/tarjeta-social.png", width: 1200, height: 630, alt: "Bookmy" }],
  },
};

export default function ComoFuncionaPage() {
  return <ComoFunciona />;
}
