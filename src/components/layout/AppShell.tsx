"use client";
/* ============================================================
   AppShell — layout con sidebar sticky + topbar + contenido
============================================================ */
import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
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
      </div>
    </div>
  );
}
