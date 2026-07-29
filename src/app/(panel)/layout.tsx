"use client";
/* ============================================================
   Layout del panel — guard de sesión + AppShell (títulos i18n)
============================================================ */
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import AppShell from "@/components/layout/AppShell";
import Icon from "@/components/ui/Icon";

/** Ruta → clave del diccionario `pages.*` (título/acento del topbar) */
const PAGE_KEY: Record<string, string> = {
  [ROUTES.dashboard]: "dashboard",
  [ROUTES.empresas]: "empresas",
  [ROUTES.reservas]: "reservas",
  [ROUTES.reservaNueva]: "reservas",
  [ROUTES.clientes]: "clientes",
  [ROUTES.facturacion]: "facturacion",
  [ROUTES.gastos]: "gastos",
  [ROUTES.estadisticas]: "estadisticas",
  [ROUTES.servicios]: "servicios",
  [ROUTES.calendario]: "calendario",
  [ROUTES.personal]: "personal",
  [ROUTES.resenas]: "resenas",
  [ROUTES.sedes]: "sedes",
  [ROUTES.comunicacion]: "comunicacion",
  [ROUTES.configuracion]: "configuracion",
};

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace(ROUTES.login);
      return;
    }
    // Las especialistas usan su propio panel (excepto configuración)
    if (session.role === "employee" && pathname !== ROUTES.configuracion) {
      router.replace(ROUTES.employeeDashboard);
    }
  }, [session, loading, pathname, router]);

  if (loading || !session) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '16px',
        color: '#64748b'
      }}>
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite' }}
        >
          <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" />
        </svg>
        <p>Cargando...</p>
      </div>
    );
  }

  const key = PAGE_KEY[pathname] || "dashboard";
  const title = t(`pages.${key}.title`);
  const accent = t(`pages.${key}.accent`);

  return (
    <AppShell
      meta={{
        title,
        accent: accent || undefined,
        breadcrumb: t(`nav.${key}`),
      }}
    >
      {children}
    </AppShell>
  );
}
