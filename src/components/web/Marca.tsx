/* ============================================================
   El logotipo de Bookmy
   ------------------------------------------------------------
   No es una imagen: son dos <span> vacíos que bookmy.css dibuja
   con gradientes. Así pesa cero, cambia de color con el mundo
   (app o CRM) sin cargar otro archivo y se ve nítido en cualquier
   pantalla. Por eso van vacíos y marcados aria-hidden: lo que lee
   un lector de pantalla es el aria-label del enlace.
============================================================ */
import Link from "next/link";
import { WEB, type Mundo } from "@/lib/web/rutas";

export default function Marca({
  mundo,
  etiqueta,
  className = "",
}: {
  /** El CRM tiñe el logo de lima; la app lo deja en su verde. */
  mundo?: Mundo;
  etiqueta: string;
  className?: string;
}) {
  const clases = ["brand", mundo === "crm" ? "brand--crm" : "", className].filter(Boolean).join(" ");

  return (
    <Link className={clases} href={WEB.portada} aria-label={etiqueta}>
      <span className="brand__logo" aria-hidden>
        <span className="brand__logo-g" />
        <span className="brand__logo-k" />
      </span>
    </Link>
  );
}
