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

/* Las dos fuentes viven en el repositorio, no se descargan de Google al
   compilar. `next/font/google` las baja en tiempo de build, y si la red
   del servidor de despliegue falla -aunque sea un segundo- Next sigue
   adelante sin ella: paso en produccion el 6 de octubre de 2026, donde
   Inter no llego a generarse y toda la web salio con la tipografia del
   sistema. Un fichero en el repositorio no se cae.

   Son las variables de las dos familias, asi que un solo fichero cubre
   todos los pesos. */
const inter = localFont({
  src: "../../public/fonts/inter-variable.woff2",
  weight: "400 700",
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

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
    <html lang="es" className={`${jakarta.variable} ${inter.variable}`} suppressHydrationWarning>
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
