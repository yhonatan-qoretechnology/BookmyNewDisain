/* ============================================================
   /planes/basic — el Plan Basic
   ------------------------------------------------------------
   Esta pantalla vivía en /bookmy-free. La dirección vieja la
   tiene indexada Google, así que no desaparece: next.config.mjs
   la redirige aquí con un 301 permanente. El canónico, por tanto,
   es esta ruta y no la antigua.

   Esta página se queda en el servidor para poder exportar
   `metadata`, que un archivo "use client" no puede. Todo el
   contenido —que necesita el hook de traducción— está en
   PlanBasic.tsx, al lado.
============================================================ */
import type { Metadata } from "next";
import planBasicEs from "@/i18n/dictionaries/web/planBasic.es";
import { DIAS_DE_PRUEBA, SE_OFRECE_PRUEBA } from "@/lib/web/oferta";
import { WEB } from "@/lib/web/rutas";
import PlanBasic from "./PlanBasic";

/* La descripción no se escribe otra vez aquí: sale del mismo diccionario
   que la página, en español, que es el idioma con el que Google indexa el
   sitio. Y como también prometía la prueba, obedece al interruptor: con la
   prueba apagada, lo que se anuncia es que empezar no cuesta nada. */
const DESCRIPCION = (
  SE_OFRECE_PRUEBA ? planBasicEs.meta.descripcionConPrueba : planBasicEs.meta.descripcionSinPrueba
).replace(/\{dias\}/g, String(DIAS_DE_PRUEBA));

export const metadata: Metadata = {
  /* El layout le añade " · Bookmy" con su plantilla de títulos. */
  title: planBasicEs.meta.titulo,
  description: DESCRIPCION,
  alternates: { canonical: WEB.planBasic },
  openGraph: {
    type: "website",
    siteName: "Bookmy",
    locale: "es_ES",
    url: WEB.planBasic,
    title: planBasicEs.meta.titulo,
    description: DESCRIPCION,
    images: ["/web/img/dashboard-b.png"],
  },
  twitter: { card: "summary_large_image" },
};

export default function Page() {
  return <PlanBasic />;
}
