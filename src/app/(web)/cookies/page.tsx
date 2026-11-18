/* ============================================================
   /cookies · los metadatos
   ------------------------------------------------------------
   Esta pantalla era cookies.html. Su <head> traía título,
   descripción, canónica y Open Graph propios, y eso es justo lo
   que se exporta aquí, sin cambiar una palabra. La canónica ya
   apunta a la ruta: el .html se quedó en la web estática.

   El archivo es de SERVIDOR a propósito, aunque no pinte nada:
   `metadata` solo lo lee Next en componentes de servidor, y el
   cuerpo necesita el navegador (los textos salen del hook de
   traducción y el índice lateral va con el scroll). Por eso el
   marcado vive al lado, en PoliticaCookies.tsx, que sí es cliente.

   El `title` va SIN «· Bookmy»: lo pone la plantilla del layout de
   la web ("%s · Bookmy"), así que escribirlo aquí lo duplicaría.
   El de Open Graph sí lo lleva, porque ese no pasa por plantilla.

   La imagen social es la misma del original, que sigue estando en
   /public/web/img (es de la web anterior, no del diseño nuevo).
============================================================ */
import type { Metadata } from "next";
import { WEB } from "@/lib/web/rutas";
import PoliticaCookies from "./PoliticaCookies";

const TITULO = "Política de cookies";
const DESCRIPCION =
  "Qué cookies usa Bookmy, para qué sirven, cuánto duran y cómo gestionar tus preferencias.";

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRIPCION,
  alternates: { canonical: WEB.cookies },
  openGraph: {
    type: "website",
    siteName: "Bookmy",
    locale: "es_ES",
    url: WEB.cookies,
    title: `${TITULO} · Bookmy`,
    description: DESCRIPCION,
    images: [{ url: "/web/img/dashboard-b.png", width: 1200, height: 630, alt: "Bookmy" }],
  },
};

export default function CookiesPage() {
  return <PoliticaCookies />;
}
