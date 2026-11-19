/* ============================================================
   /crm — la puerta del CRM
   ------------------------------------------------------------
   Este archivo es de SERVIDOR y solo hace dos cosas: exportar los
   metadatos del <head> (que un componente de cliente no puede) y
   montar la pantalla, que sí lo es porque sus textos salen del
   proveedor de idioma. Todo el marcado está en PantallaCrm.tsx.

   Los metadatos van en español, que es el idioma de la ficha del
   sitio, y salen del mismo diccionario que la pantalla para que no
   haya dos versiones del mismo título. La promesa de la prueba
   también manda aquí: la describe oferta.ts y los días llegan de
   DIAS_DE_PRUEBA, nunca escritos a mano.
============================================================ */
import type { Metadata } from "next";
import crmEs from "@/i18n/dictionaries/web/crm.es";
import { DIAS_DE_PRUEBA, SE_OFRECE_PRUEBA } from "@/lib/web/oferta";
import { WEB } from "@/lib/web/rutas";
import PantallaCrm from "./PantallaCrm";

const descripcion = (
  SE_OFRECE_PRUEBA ? crmEs.meta.descripcionConPrueba : crmEs.meta.descripcionSinPrueba
).replace("{dias}", String(DIAS_DE_PRUEBA));

export const metadata: Metadata = {
  /* `absolute` para que la plantilla del layout no le pegue otro
     « · Bookmy»: el título del diseño ya empieza por «CRM Bookmy». */
  title: { absolute: crmEs.meta.titulo },
  description: descripcion,
  alternates: { canonical: WEB.crm },
  openGraph: {
    type: "website",
    siteName: "Bookmy",
    locale: "es_ES",
    url: WEB.crm,
    title: crmEs.meta.titulo,
    description: descripcion,
    /* La captura del panel que ya usaba la web: es la imagen que
       sale al compartir el enlace del CRM. */
    images: [{ url: "/web/img/dashboard-b.png", width: 640, height: 640, alt: crmEs.panel.alt }],
  },
  twitter: { card: "summary_large_image" },
};

export default function CrmPage() {
  return <PantallaCrm />;
}
