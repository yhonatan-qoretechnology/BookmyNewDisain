/* Esqueleto del dashboard: banner, KPIs, últimas reservas y calendario.
   Sigue el mismo orden y las MISMAS rejillas que la pantalla real, para
   que al llegar los datos nada cambie de sitio. Por eso la fila de KPIs
   no usa SkStatGrid (que es la rejilla de las pantallas con StatCard,
   con otros márgenes) sino .kpiGrid, la de este dashboard. */
import { SkeletonPage, SkPanel, SkTable, SkCalendar, SkForm, Bone } from "@/components/ui/Skeleton";
import dash from "./dashboard.module.css";
import kpi from "@/components/dashboard/KpiCard.module.css";

export default function Loading() {
  return (
    <SkeletonPage>
      {/* 294 px es el alto del hero real, medido en el navegador a 1440
          px: 24+30 de padding más la ilustración 3D, que es la pieza más
          alta de las dos columnas. */}
      <SkPanel head={false} style={{ display: "flex", alignItems: "center", gap: 28, minHeight: 294 }}>
        <Bone w={290} h={218} style={{ borderRadius: "var(--radius-card)", flex: "none" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Bone w={240} h={26} />
          <Bone w={300} h={14} />
          <Bone w={160} h={40} shape="pill" />
        </div>
      </SkPanel>

      <div className={dash.kpiGrid}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`glass-card ${kpi.card}`}>
            <Bone w={42} h={42} style={{ borderRadius: "var(--radius-icon)" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
              <Bone w={96} h={12} />
              <Bone w={76} h={30} />
              <Bone w={120} h={12} />
            </div>
          </div>
        ))}
      </div>

      <div className={dash.bloques}>
        <SkPanel actions={1}>
          <SkTable cols={8} rows={5} person={1} />
        </SkPanel>
        <div className={dash.bottomGrid}>
          <SkPanel><SkForm fields={3} /></SkPanel>
          <SkPanel><SkCalendar /></SkPanel>
        </div>
      </div>
    </SkeletonPage>
  );
}
