/* ============================================================
   Web pública (bookmy.es)
   ------------------------------------------------------------
   Marco común de las páginas públicas: fondo, cabecera, pie,
   aviso de cookies, asistente y modal de solicitud.

   La hoja de estilos se carga con un <link> propio en vez de un
   `import` global: así vive solo mientras hay una página pública
   montada y sus variables (que comparten nombre con las del
   panel: --surface, --border…) no se cuelan en /login ni en el
   panel al navegar sin recargar.
============================================================ */
import type { Metadata } from "next";
import WebHeader from "@/components/web/WebHeader";
import WebFooter from "@/components/web/WebFooter";
import CursorGlow from "@/components/web/CursorGlow";
import AiWidget from "@/components/web/AiWidget";
import { CookieBannerProvider } from "@/components/web/CookieBanner";
import { LeadModalProvider } from "@/components/web/LeadModal";

export const metadata: Metadata = {
  metadataBase: new URL("https://bookmy.es"),
  title: "Bookmy · Reserva de citas y servicios online",
  description:
    "Bookmy: la forma más rápida de reservar servicios y citas. Gestiona tu agenda, pagos y clientes desde una sola plataforma.",
  icons: { icon: "/web/img/favicon.svg" },
  openGraph: {
    title: "Bookmy · Reserva de citas y servicios online",
    description:
      "Gestiona agenda, pagos, clientes y equipo desde una sola plataforma. Empieza gratis con Bookmy Free.",
    url: "https://bookmy.es",
    siteName: "Bookmy",
    locale: "es_ES",
    type: "website",
    images: [{ url: "/web/img/dashboard-b.png", width: 1200, height: 630, alt: "Panel de Bookmy" }],
  },
};

export default function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/web/style.css?v=2" />
      <div className="bg-grid" aria-hidden />
      <div className="bg-noise" aria-hidden />
      <CursorGlow />
      <CookieBannerProvider>
        <LeadModalProvider>
          <WebHeader />
          <main>{children}</main>
          <WebFooter />
          <AiWidget />
        </LeadModalProvider>
      </CookieBannerProvider>
    </>
  );
}
