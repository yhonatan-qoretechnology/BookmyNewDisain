/* ============================================================
   /app/empresas · la app vista por el negocio
   ------------------------------------------------------------
   Esta pantalla era app-empresas.html. Aquí solo viven los
   metadatos, que Next únicamente acepta en un componente de
   servidor; el marcado y los textos están en AppEmpresas.tsx,
   que es de cliente porque necesita el diccionario y el motor de
   animación.

   El title va en `absolute` a propósito: el layout de la web
   tiene la plantilla "%s · Bookmy" y el título del original ya
   dice Bookmy, así que sin esto saldría dos veces y pasaría de
   los 60 caracteres que enseña Google.
============================================================ */
import type { Metadata } from "next";
import AppEmpresas from "./AppEmpresas";

const TITULO = "App Bookmy para empresas · Recibe reservas desde el móvil";
const DESCRIPCION =
  "Publica tu negocio en la app Bookmy, recibe reservas 24/7 y gestiona tu agenda, tus clientes y tus cobros desde el móvil.";

export const metadata: Metadata = {
  title: { absolute: TITULO },
  description: DESCRIPCION,
  alternates: { canonical: "/app/empresas" },
  openGraph: {
    title: TITULO,
    description: DESCRIPCION,
    url: "/app/empresas",
    /* La misma imagen que compartía el original. Es la única de la
       pantalla: todo lo demás lo dibuja el CSS. */
    images: [{ url: "/web/img/dashboard-b.png", width: 640, height: 640 }],
  },
};

export default function Page() {
  return <AppEmpresas />;
}
