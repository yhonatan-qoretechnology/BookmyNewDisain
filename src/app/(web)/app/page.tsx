/* ============================================================
   /app — la app Bookmy para personas
   ------------------------------------------------------------
   Era app.html en la web estática. Aquí solo viven los metadatos
   y la ficha de schema.org, que tienen que salir del servidor: la
   pantalla entera está en PantallaApp.tsx, que es de cliente
   porque usa el hook de traducción.

   El título va como `absolute` a propósito. El marco común
   (src/app/(web)/layout.tsx) añade « · Bookmy» a todos los
   títulos, y este ya dice «App Bookmy», así que con la plantilla
   normal quedaría la marca dos veces.
============================================================ */
import type { Metadata } from "next";
import { WEB } from "@/lib/web/rutas";
import PantallaApp from "./PantallaApp";

const TITULO = "App Bookmy · Reserva tus citas en segundos";
const DESCRIPCION =
  "Encuentra tu centro, elige servicio, especialista y hora, y paga online o en el local. Confirmación al instante y recordatorios. Gratis en iOS y Android.";

export const metadata: Metadata = {
  title: { absolute: TITULO },
  description: DESCRIPCION,
  alternates: { canonical: WEB.app },
  openGraph: {
    type: "website",
    siteName: "Bookmy",
    locale: "es_ES",
    url: WEB.app,
    title: TITULO,
    description: DESCRIPCION,
    images: [{ url: "/web/img/dashboard-b.png", width: 640, height: 640, alt: "Bookmy" }],
  },
};

/* La ficha que leen los buscadores: una aplicación móvil gratuita
   para iOS y Android. Precio 0, que es lo que cuesta la app (lo que
   se paga es el servicio que se reserva). */
const FICHA = {
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  name: "Bookmy",
  operatingSystem: "iOS, Android",
  applicationCategory: "LifestyleApplication",
  description:
    "Reserva tus citas en segundos: elige centro, servicio, especialista y hora, y paga online o en el local.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
};

export default function PaginaApp() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FICHA) }}
      />
      <PantallaApp />
    </>
  );
}
