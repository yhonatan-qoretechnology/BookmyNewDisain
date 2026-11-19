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

   La imagen social es la misma que señalaba el <head> original
   (/web/img/dashboard-b.png, que sigue en public). El canonical va
   relativo porque el layout ya fija metadataBase en bookmy.es.
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
    images: [{ url: "/web/img/dashboard-b.png", width: 640, height: 640 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function AsistenteIaPage() {
  return <Contenido />;
}
