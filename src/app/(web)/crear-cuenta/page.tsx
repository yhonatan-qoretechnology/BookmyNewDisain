/* ============================================================
   /crear-cuenta — alta de un negocio en bookmy.es
   ------------------------------------------------------------
   Aquí se crea la cuenta de verdad y se entra al panel; no es un
   formulario de contacto. El marcado está en la pantalla cliente,
   que es donde hace falta el idioma.
============================================================ */
import type { Metadata } from "next";
import PaginaWeb from "@/components/web/PaginaWeb";
import PantallaCrearCuenta, { CtaCrearCuenta } from "./PantallaCrearCuenta";
import crearCuentaEs from "@/i18n/dictionaries/web/crearCuenta.es";
import { DIAS_DE_PRUEBA, SE_OFRECE_PRUEBA } from "@/lib/web/oferta";
import { WEB } from "@/lib/web/rutas";

/* Los metadatos los lee el buscador, no el visitante, así que van en
   el idioma de casa: el <head> no cambia con el selector de idioma.
   El {dias} se interpola aquí porque este archivo es de servidor y no
   puede usar el hook de traducción. */
const dias = (s: string) => s.replace("{dias}", String(DIAS_DE_PRUEBA));

const TITULO = dias(
  SE_OFRECE_PRUEBA ? crearCuentaEs.meta.tituloConPrueba : crearCuentaEs.meta.tituloSinPrueba,
);
const DESCRIPCION = dias(
  SE_OFRECE_PRUEBA ? crearCuentaEs.meta.descripcionConPrueba : crearCuentaEs.meta.descripcionSinPrueba,
);

export const metadata: Metadata = {
  title: { absolute: TITULO },
  description: DESCRIPCION,
  alternates: { canonical: WEB.crearCuenta },
  /* Igual que en /contacto: sin `openGraph` propio, Next NO fusiona y
     esta página salía compartida con la tarjeta y el og:url de la
     portada. En el alta importa más que en ninguna otra, porque es la
     que se manda por WhatsApp para que alguien se registre. */
  openGraph: {
    type: "website",
    siteName: "Bookmy",
    locale: "es_ES",
    url: WEB.crearCuenta,
    title: TITULO,
    description: DESCRIPCION,
    /* La tarjeta social de 1200x630 (scripts/tarjeta-social.py). Antes
       apuntaba a dashboard-b.png, que mide 640x640. */
    images: [{ url: "/web/v2/img/tarjeta-social.png", width: 1200, height: 630, alt: "Bookmy" }],
  },
  /* El alta no se indexa como contenido: lo que tiene que posicionar
     son las páginas de plan, que es de donde se llega aquí. */
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <PaginaWeb mundo="crm" pagina="crear-cuenta" cta={<CtaCrearCuenta />}>
      <PantallaCrearCuenta />
    </PaginaWeb>
  );
}
