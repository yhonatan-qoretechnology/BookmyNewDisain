"use client";
/* ============================================================
   AppShell — layout con sidebar sticky + topbar + contenido
============================================================ */
import { useEffect, useState } from "react";
import { EmpresasApi } from "@/api/modules";
import { useSession } from "@/context/SessionContext";
import { aplicarTema, temaRecordado } from "@/lib/temaPanel";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={styles.main}>
        <Topbar
          title={meta.title}
          accent={meta.accent}
          breadcrumb={meta.breadcrumb}
          breadcrumbRoot={meta.breadcrumbRoot}
          bellCount={meta.bellCount}
          onMenuToggle={() => setSidebarOpen((o) => !o)}
        />
        <main className={styles.content}>{children}</main>
        {/* Asistente de ayuda en todas las pantallas, esquina inferior derecha */}
        <Chatbot />
      </div>
    </div>
  );
}
