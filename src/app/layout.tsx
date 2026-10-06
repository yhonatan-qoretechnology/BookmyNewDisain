import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/context/ThemeContext";
import { SessionProvider } from "@/context/SessionContext";
import { UiProvider } from "@/context/UiContext";
import { I18nProvider } from "@/i18n";
import { RegionProvider } from "@/context/RegionContext";
import { ReservaPopupProvider } from "@/components/reservas/ReservaPopupContext";
import { BookingProvider } from "@/context/BookingContext";
import "@/styles/globals.css";

/* Plus Jakarta para todo, que es la tipografia del producto.

   Vive en el repositorio y no se descarga de Google al compilar.
   `next/font/google` la baja en tiempo de build y, si la red del servidor
   de despliegue falla, Next sigue adelante sin ella: el 6 de octubre de
   2026 paso justo eso en produccion y toda la web salio en Times New
   Roman. Un fichero versionado no se cae.

   Es la version variable, asi que un solo fichero cubre los cinco pesos. */
const jakarta = localFont({
  src: "../../public/fonts/plus-jakarta-sans-variable.woff2",
  weight: "400 800",
  variable: "--font-jakarta",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bookmy.es"),
  title: {
    default: "Bookmy · Reserva de citas y servicios online",
    template: "%s",
  },
  description:
    "Bookmy: la forma más rápida de reservar servicios y citas. Gestiona agenda, pagos, clientes y equipo desde una sola plataforma.",
  icons: { icon: "/web/img/favicon.svg" },
};

/** Aplica el tema antes de pintar para evitar el flash.
    La clave tiene que ser la misma que guarda ThemeContext
    (THEME_STORAGE_KEY = "bookmy-theme"); con "bm_theme" este script nunca
    encontraba nada y cada recarga volvía al tema del sistema. */
const themeInitScript = `
(function () {
  try {
    var t = localStorage.getItem("bookmy-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", t);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={jakarta.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <SessionProvider>
            {/* I18nProvider vive DENTRO de SessionProvider: así puede leer
                el parámetro de idioma que la BD entrega en la sesión. */}
            <I18nProvider>
              {/* También dentro de SessionProvider: el país cuelga de la
                  empresa con la que se ha entrado y de él salen la moneda,
                  la zona horaria y las etiquetas (NIF/CIF o NIT…). */}
              <RegionProvider>
                <UiProvider>
                  {/* Estado global del asistente de reservas (empresa, sede,
                      cliente, profesional, servicio, fecha, hora, pago) */}
                  <BookingProvider>
                    <ReservaPopupProvider>{children}</ReservaPopupProvider>
                  </BookingProvider>
                </UiProvider>
              </RegionProvider>
            </I18nProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
