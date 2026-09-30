import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import { SessionProvider } from "@/context/SessionContext";
import { UiProvider } from "@/context/UiContext";
import { I18nProvider } from "@/i18n";
import { ReservaPopupProvider } from "@/components/reservas/ReservaPopupContext";
import { BookingProvider } from "@/context/BookingContext";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
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
              <UiProvider>
                {/* Estado global del asistente de reservas (empresa, sede,
                    cliente, profesional, servicio, fecha, hora, pago) */}
                <BookingProvider>
                  <ReservaPopupProvider>{children}</ReservaPopupProvider>
                </BookingProvider>
              </UiProvider>
            </I18nProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
