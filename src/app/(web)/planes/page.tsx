/* ============================================================
   /planes — la pantalla que compara Plan Basic y Plan Pro
   ------------------------------------------------------------
   Aquí solo va el <head>. La pantalla entera está en ./Planes.tsx,
   que es de cliente porque el texto se saca con el hook de
   traducción y porque el marco (PaginaWeb) arranca el motor de
   animación. `metadata` tiene que exportarse desde un componente
   de servidor, así que la página se queda con esto y mete dentro
   el componente.

   EL TÍTULO Y LA DESCRIPCIÓN SALEN DEL MISMO DICCIONARIO
   No están escritos aquí: se leen de planes.es.ts, que es donde
   está el resto del texto de la pantalla, para que la promesa de la
   prueba gratuita se decida en un solo sitio (src/lib/web/oferta.ts).
   Se usa la versión española porque `metadata` se resuelve en el
   servidor, donde no hay hook de traducción, y porque la web no
   tiene una dirección distinta por idioma: lo que indexa Google es
   esta.
============================================================ */
import type { Metadata } from "next";
import planes from "@/i18n/dictionaries/web/planes.es";
import { DIAS_DE_PRUEBA, SE_OFRECE_PRUEBA } from "@/lib/web/oferta";
import { WEB } from "@/lib/web/rutas";
import Planes from "./Planes";

/* Los días de prueba viajan como {dias} igual que en los textos de
   la pantalla, así que aquí hay que rellenarlos a mano: el
   interpolador del diccionario vive en el proveedor de idioma, que
   es de cliente. */
const dias = (texto: string) => texto.replace(/\{dias\}/g, String(DIAS_DE_PRUEBA));

const titulo = dias(SE_OFRECE_PRUEBA ? planes.meta.tituloConPrueba : planes.meta.tituloSinPrueba);
const descripcion = dias(
  SE_OFRECE_PRUEBA ? planes.meta.descripcionConPrueba : planes.meta.descripcionSinPrueba,
);

export const metadata: Metadata = {
  /* `absolute` porque el título del original ya viene completo: con
     la plantilla del layout («%s · Bookmy») saldría la marca dos
     veces. */
  title: { absolute: titulo },
  description: descripcion,
  alternates: { canonical: WEB.planes },
  openGraph: {
    type: "website",
    url: WEB.planes,
    title: titulo,
    description: descripcion,
    /* La misma imagen que compartía la web estática. Vive en
       /public/web/img, que es la carpeta de la web anterior: no se
       ha vuelto a exportar y no hace falta. */
    images: [{ url: "/web/img/dashboard-b.png", width: 640, height: 640, alt: planes.meta.imagenAlt }],
  },
};

export default function PlanesPage() {
  return <Planes />;
}
