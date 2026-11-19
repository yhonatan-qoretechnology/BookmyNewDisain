/* ============================================================
   /asistente-ia — la pantalla que explica el asistente con IA
   ------------------------------------------------------------
   Aquí solo viven los metadatos, que Next únicamente acepta de un
   componente de servidor. El marcado y el texto están en
   ./Contenido.tsx, que es de cliente porque la traducción sale de
   un hook.

   EL TÍTULO VA EN `absolute` A PROPÓSITO
   El layout de la web pone la plantilla "%s · Bookmy". El título
   del original ya dice "Bookmy" («Asistente IA de Bookmy · …»),
   así que por la plantilla saldría dos veces. Con `absolute` se
   usa tal cual y la pestaña dice exactamente lo que decía la web
   estática.

   La imagen social es la tarjeta de 1200×630 que genera
   scripts/tarjeta-social.py, la misma en todas las páginas. El
   canonical va relativo porque el layout ya fija metadataBase en
   bookmy.es.
============================================================ */
import type { Metadata } from "next";
import { WEB } from "@/lib/web/rutas";
import Contenido from "./Contenido";

const TITULO = "Asistente IA de Bookmy · Atiende, reserva y vende 24/7";
const DESCRIPCION =
  "El asistente IA de Bookmy responde a tus clientes, reserva con tu disponibilidad real, sugiere extras y recupera clientes inactivos.";

export const metadata: Metadata = {
  title: { absolute: TITULO },
  description: DESCRIPCION,
  alternates: { canonical: WEB.asistenteIa },
  openGraph: {
    type: "website",
    siteName: "Bookmy",
    locale: "es_ES",
    title: TITULO,
    description: DESCRIPCION,
    url: WEB.asistenteIa,
    /* La tarjeta social de 1200x630 (scripts/tarjeta-social.py). Antes
       apuntaba a dashboard-b.png, que mide 640x640. */
    images: [{ url: "/web/v2/img/tarjeta-social.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function AsistenteIaPage() {
  return <Contenido />;
}
