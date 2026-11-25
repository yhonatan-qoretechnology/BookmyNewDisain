/* ============================================================
   Acceso de la tienda — metadatos de la ruta
   ------------------------------------------------------------
   La página es de cliente y no puede exportar `metadata`: el
   título y el icono de la pestaña se declaran aquí (diseño
   «Bookmy Store»). La página cambia el título al idioma activo.
============================================================ */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inicia sesión en Bookmy Store",
  description: "Entra al panel de gestión de tu tienda en Bookmy Store.",
  icons: { icon: "/store/bookmy-store.svg" },
};

export default function LoginQoreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
