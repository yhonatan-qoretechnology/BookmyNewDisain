/* ============================================================
   /contacto — escribir al equipo
   ------------------------------------------------------------
   El mensaje va a POST /contacto del backend, que comprueba el
   reCAPTCHA v3 y manda el correo a contacto@bookmy.es.
============================================================ */
import type { Metadata } from "next";
import PaginaWeb from "@/components/web/PaginaWeb";
import FormularioContacto from "./FormularioContacto";
import { WEB } from "@/lib/web/rutas";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Escríbenos sobre ventas, soporte técnico o cualquier duda sobre Bookmy. Te respondemos lo antes posible.",
  alternates: { canonical: WEB.contacto },
};

export default function Page() {
  return (
    <PaginaWeb mundo="crm" pagina="contacto">
      <FormularioContacto />
    </PaginaWeb>
  );
}
