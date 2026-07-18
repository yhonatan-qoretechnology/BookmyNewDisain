"use client";
/* ============================================================
   Layout del panel de especialista — guard + AppShell
============================================================ */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { useSession } from "@/context/SessionContext";
import AppShell from "@/components/layout/AppShell";
import { useI18n } from "@/i18n";
import Icon from "@/components/ui/Icon";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession();
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!session) { router.replace(ROUTES.login); return; }
    if (session.role !== "employee") router.replace(ROUTES.dashboard);
  }, [session, loading, router]);

  if (loading || !session || session.role !== "employee") {
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

  return (
    <AppShell
      meta={{
        title: t("pages.employee.title"),
        accent: t("pages.employee.accent"),
        breadcrumb: t("nav.emp-main"),
        breadcrumbRoot: t("topbar.breadcrumbRootEmployee"),
        bellCount: 2,
      }}
    >
      {children}
    </AppShell>
  );
}
