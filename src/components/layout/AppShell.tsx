"use client";
/* ============================================================
   AppShell — raíl de iconos + barra flotante + contenido
   ------------------------------------------------------------
   Las dos piezas del armazón flotan sobre el lienzo y ninguna se
   despliega:

     · El raíl de la izquierda es solo iconos. No se abre: el
       nombre de cada sección sale en una burbuja al pasar por
       encima (Rail.tsx).
     · La barra de arriba es una píldora con la marca, las
       secciones más usadas del rol y el usuario.

   El contenido va directamente sobre el lienzo, sin ventana que
   lo enmarque: lo que flota son las tarjetas de cada pantalla.
============================================================ */
import { useEffect } from "react";
import { EmpresasApi } from "@/api/modules";
import { useSession } from "@/context/SessionContext";
import { aplicarTema, temaRecordado } from "@/lib/temaPanel";
import Rail from "./Rail";
import Topbar from "./Topbar";
import PageHeader from "./PageHeader";
import Chatbot from "./Chatbot";
import styles from "./AppShell.module.css";

export interface PageMeta {
  title: string;
  accent?: string;
  breadcrumb?: string;
  breadcrumbRoot?: string;
  bellCount?: number;
}

export default function AppShell({
  meta,
  children,
}: {
  meta: PageMeta;
  children: React.ReactNode;
}) {
  const { session } = useSession();

  /* Colores del negocio: primero el recordado (sin parpadeo) y luego el
     guardado en la empresa. El superadmin ve siempre los de Bookmy. */
  const empresaId = session?.role === "superadmin" ? null : Number(session?.negocioId) || null;
  useEffect(() => {
    if (!empresaId) { aplicarTema(null); return; }
    aplicarTema(temaRecordado());
    let vigente = true;
    EmpresasApi.findOne(empresaId)
      .then((e) => { if (vigente) aplicarTema(e?.temaPanel?.color ?? null); })
      .catch(() => undefined);
    return () => { vigente = false; };
  }, [empresaId]);

  return (
    <div className={styles.appShell}>
      <Rail />

      <div className={styles.main}>
        <Topbar />
        <main className={styles.content}>
          <PageHeader
            title={meta.title}
            accent={meta.accent}
            breadcrumb={meta.breadcrumb}
            breadcrumbRoot={meta.breadcrumbRoot}
          />
          {children}
        </main>
        {/* Asistente de ayuda en todas las pantallas, esquina inferior derecha */}
        <Chatbot />
      </div>
    </div>
  );
}
