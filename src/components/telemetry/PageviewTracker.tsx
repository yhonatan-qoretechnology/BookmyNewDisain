"use client";
/* ============================================================
   PageviewTracker — telemetría de pageviews del panel y la web
   ------------------------------------------------------------
   Se monta una sola vez en el layout raíz (cubre `(web)` y `(panel)`,
   que cuelgan de él). Un `sesionId` anónimo en localStorage agrupa
   las visitas de un mismo navegador: en la web pública la mayoría no
   tiene sesión, así que es lo único que identifica "la misma persona".

   Se usa el cliente HTTP normal (no sendBeacon): dispara en cada
   cambio de ruta, no en el cierre de pestaña, así que no hace falta
   garantizar la entrega tras el unload — y de paso se manda el Bearer
   si hay sesión, cosa que sendBeacon no permite.
============================================================ */
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { TelemetriaApi } from "@/api/modules";

const SESION_KEY = "bm_telemetry_sid";

function sesionAnonima(): string {
  try {
    const existente = localStorage.getItem(SESION_KEY);
    if (existente) return existente;
    const nueva = crypto.randomUUID();
    localStorage.setItem(SESION_KEY, nueva);
    return nueva;
  } catch {
    /* localStorage bloqueado (privado, cookies desactivadas…): una
       sesión de usar y tirar para esta carga, mejor que romper la página. */
    return crypto.randomUUID();
  }
}

export default function PageviewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    TelemetriaApi.pageview({ ruta: pathname, sesionId: sesionAnonima() }).catch(() => undefined);
  }, [pathname]);

  return null;
}
