/* ============================================================
   Web pública (bookmy.es) · rediseño 2.0
   ------------------------------------------------------------
   Marco común de TODAS las páginas públicas: tipografía, hoja de
   estilos, fondo de estrellas, aviso de cookies y asistente. La
   cabecera y el pie NO están aquí: cambian según el mundo (la app
   o el CRM) y el portal de la portada no lleva ninguno, así que
   los pone cada pantalla con <PaginaWeb>.

   LA HOJA DE ESTILOS VA EN UN <link> Y NO EN UN `import`
   Es la misma razón por la que ya se hacía antes del rediseño:
   bookmy.css define variables con nombres que también usa el
   panel (--panel, --line, --text…) y es de tema oscuro fijo. Con
   un `import` global viajaría en el bundle de toda la aplicación y
   se colaría en /login y en el panel al navegar sin recargar. Con
   el <link> vive solo mientras hay una página pública montada.

   La fuente es Google Sans, que es la del diseño. Se pide a Google
   Fonts con preconnect para que no bloquee el primer pintado;
   `display=swap` enseña el texto con la fuente del sistema
   mientras llega, en vez de dejar la página en blanco.
============================================================ */
import type { Metadata } from "next";
import FondoWeb from "@/components/web/FondoWeb";
import AsistenteWeb from "@/components/web/AsistenteWeb";
import { CookieBannerProvider } from "@/components/web/CookieBanner";

export const metadata: Metadata = {
  metadataBase: new URL("https://bookmy.es"),
  title: {
    default: "Bookmy · ¿Qué quieres descubrir?",
    template: "%s · Bookmy",
  },
  description:
    "Bookmy: la app para reservar citas en segundos y el CRM con IA para gestionar y hacer crecer tu negocio de servicios.",
  icons: {
    icon: "/web/v2/img/favicon.png",
    apple: "/web/v2/img/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Bookmy",
    locale: "es_ES",
    url: "https://bookmy.es",
    title: "Bookmy · ¿Qué quieres descubrir?",
    description:
      "Bookmy: la app para reservar citas en segundos y el CRM con IA para gestionar y hacer crecer tu negocio de servicios.",
    /* LA TARJETA SOCIAL, 1200×630 DE VERDAD.
       Es lo que se ve al pegar un enlace de bookmy.es en WhatsApp,
       LinkedIn, Facebook o Slack. Antes aquí se declaraba ese tamaño
       pero el fichero era una captura de móvil de 433×712: las
       plataformas reservaban un hueco horizontal y metían dentro una
       imagen vertical recortada por el centro.
       La imagen la genera scripts/tarjeta-social.py, que reconstruye el
       logo desde las mismas máscaras que usa bookmy.css —el PNG del
       logo está hecho para fondo claro y aquí el fondo es casi negro—.
       Si se cambia la imagen, hay que cambiar estas medidas con ella. */
    images: [{ url: "/web/v2/img/tarjeta-social.png", width: 1200, height: 630, alt: "Bookmy" }],
  },
  twitter: { card: "summary_large_image" },
};

/* El tema de la barra del navegador en móvil: el negro verdoso del
   diseño, para que no aparezca una franja blanca encima de la web. */
export const viewport = {
  themeColor: "#030706",
  colorScheme: "dark" as const,
};

export default function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* eslint-disable @next/next/no-page-custom-font, @next/next/no-css-tags */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400..700&display=swap"
      />
      <link rel="stylesheet" href="/web/v2/bookmy.css" />
      <link rel="stylesheet" href="/web/v2/icons.css" />
      {/* eslint-enable @next/next/no-page-custom-font, @next/next/no-css-tags */}

      <FondoWeb />
      <CookieBannerProvider>
        {children}
        {/* El asistente vendedor, en el marco y no en cada página: así la
            conversación no se corta al navegar. Va DENTRO del proveedor de
            cookies porque solo recuerda el hilo entre visitas si se han
            aceptado las funcionales. No sale en la portada. */}
        <AsistenteWeb />
      </CookieBannerProvider>
    </>
  );
}
