/* ============================================================
   /planes/pro — la pantalla del Plan Pro
   ------------------------------------------------------------
   Antes era /bookmy-crm-pro (y, en la web estática,
   plan-pro.html). La dirección vieja sigue viva: next.config.mjs
   la redirige aquí con un 301 para no perder el posicionamiento.

   Esta mitad es de servidor y solo pone la cabeza del documento;
   la pantalla es <PlanPro>, que es de cliente porque todo su
   texto sale del hook de traducción.
============================================================ */
import type { Metadata } from "next";
import PlanPro from "@/components/web/PlanPro";
import planProEs from "@/i18n/dictionaries/web/planPro.es";
import { DIAS_DE_PRUEBA, SE_OFRECE_PRUEBA } from "@/lib/web/oferta";
import { WEB } from "@/lib/web/rutas";

/* El <head> se arma en el servidor, donde no hay hook de traducción:
   los textos se leen del diccionario base, que es el idioma en el que
   estaba escrita la cabeza del original. La descripción también
   depende de si se ofrece la prueba, así que aquí se elige la versión
   y se rellenan los días a mano: es el mismo trabajo que hace `w()`
   en el componente. */
const META = planProEs.meta;
const DESCRIPCION = (SE_OFRECE_PRUEBA ? META.descripcionConPrueba : META.descripcionSinPrueba)
  .replace("{dias}", String(DIAS_DE_PRUEBA));

export const metadata: Metadata = {
  /* `absolute` deja el título tal cual lo tenía el original, sin que
     la plantilla del layout le añada otro «· Bookmy» detrás. */
  title: { absolute: META.titulo },
  description: DESCRIPCION,
  alternates: { canonical: WEB.planPro },
  openGraph: {
    type: "website",
    siteName: "Bookmy",
    locale: "es_ES",
    url: WEB.planPro,
    title: META.titulo,
    description: DESCRIPCION,
    images: [{ url: "/web/img/dashboard-b.png", width: 640, height: 640 }],
  },
  twitter: { card: "summary_large_image" },
};

export default function PlanProPage() {
  return <PlanPro />;
}
