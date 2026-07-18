import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import { SessionProvider } from "@/context/SessionContext";
import { UiProvider } from "@/context/UiContext";
import { I18nProvider } from "@/i18n";
import { ReservaPopupProvider } from "@/components/reservas/ReservaPopupContext";
import { BookingProvider } from "@/context/BookingContext";
import "@/styles/globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BookMy — Studio Suite",
  description: "Panel de administración para equipos de belleza y bienestar",
};

/** Aplica el tema antes de pintar para evitar el flash */
const themeInitScript = `
(function () {
  try {
    var t = localStorage.getItem("bm_theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", t);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={jakarta.variable}>
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
