/* ============================================================
   Acceso de QoreTech — metadatos de la ruta
   ------------------------------------------------------------
   La página es de cliente y no puede exportar `metadata`: el
   título y el icono de la pestaña se declaran aquí para que no
   salgan los de BookMy. El título se queda tal cual, porque la
   plantilla del layout raíz es "%s".
============================================================ */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceso · QoreTech",
  description: "Acceso al panel de gestión del equipo de QORE Technology.",
  icons: { icon: "/qore/qore-marca.png" },
};

export default function LoginQoreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
