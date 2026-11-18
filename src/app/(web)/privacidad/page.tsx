/* ============================================================
   /privacidad — la política de privacidad
   ------------------------------------------------------------
   Aquí solo va el <head>. La pantalla entera está en
   ./Privacidad.tsx, que es de cliente porque el texto se saca con
   el hook de traducción y porque el marco (PaginaWeb) arranca el
   motor de animación. `metadata` tiene que exportarse desde un
   componente de servidor, así que la página se queda con esto y
   mete dentro el componente.

   EL TÍTULO Y LA DESCRIPCIÓN SALEN DEL DICCIONARIO
   No están escritos aquí: se leen de privacidad.es.ts, que es
   donde está el resto del texto de la pantalla. Se usa la versión
   española porque `metadata` se resuelve en el servidor, donde no
   hay hook de traducción, y porque la web no tiene una dirección
   distinta por idioma: lo que indexa Google es esta.

   ESTA PÁGINA SUSTITUYE A LA VIEJA, que pintaba el componente
   <LegalPage> con las claves `privacy` del diccionario grande. Ni
   el componente ni esas claves se borran aquí: hasta que la otra
   política legal también esté portada siguen en uso.
============================================================ */
import type { Metadata } from "next";
import privacidad from "@/i18n/dictionaries/web/privacidad.es";
import { WEB } from "@/lib/web/rutas";
import Privacidad from "./Privacidad";

export const metadata: Metadata = {
  /* `absolute` porque el título del original ya viene completo: con
     la plantilla del layout («%s · Bookmy») saldría la marca dos
     veces. */
  title: { absolute: privacidad.meta.titulo },
  description: privacidad.meta.descripcion,
  /* El original era /privacidad.html; la canónica es ya la ruta. */
  alternates: { canonical: WEB.privacidad },
  openGraph: {
    type: "website",
    url: WEB.privacidad,
    title: privacidad.meta.titulo,
    description: privacidad.meta.descripcion,
    /* La misma imagen que compartía la web estática. Vive en
       /public/web/img, que es la carpeta de la web anterior. */
    images: [{ url: "/web/img/dashboard-b.png", width: 640, height: 640, alt: privacidad.meta.imagenAlt }],
  },
};

export default function PrivacidadPage() {
  return <Privacidad />;
}
