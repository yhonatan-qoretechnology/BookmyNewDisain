"use client";
import { useMemo } from "react";
/* ============================================================
   Calendario — vista mensual de todas las reservas (View)
============================================================ */
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { ReservasController } from "@/controllers/ReservasController";
import { useSession } from "@/context/SessionContext";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/i18n";
import { useUi } from "@/context/UiContext";
import { useReservaPopup } from "@/components/reservas/ReservaPopupContext";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import CalendarGrid from "@/components/ui/CalendarGrid";
import { FestivosApi } from "@/api/modules";

export default function CalendarioPage() {
  const router = useRouter();
  const { session } = useSession();
  const { t, locale } = useI18n();
  const { toast } = useUi();
  const popup = useReservaPopup();

  /* Festivos del año en curso, acotados a la sede de la sesión: el backend

     resuelve su comunidad y su municipio. Son informativos — pintan la

     celda en rojo pero NO impiden agendar. */

  const { data: diasFestivos } = useData(

    () => FestivosApi.findAll({

      anio: new Date().getFullYear(),

      sedeId: session?.sedeId ? Number(session.sedeId) : undefined,

    }).catch(() => []),

    [session?.sedeId],

    [],

  );


  const { data: lista } = useData(
    () => ReservasController.getForSession(session, locale),
    [session?.id, session?.negocioId, locale], []
  );
  const map = ReservasController.buildCalendarMap(lista);
  const events = Object.fromEntries(
    Object.entries(map).map(([fecha, rs]) => [
      fecha,
      rs.map((r) => ({ id: r.id, label: `${r.hora} ${r.servicio}`, data: r })),
    ])
  );

  const festivos = useMemo(

    () => Object.fromEntries(

      (diasFestivos || []).map((f) => [f.fecha.slice(0, 10), f.nombre]),

    ),

    [diasFestivos],

  );


  return (
    <Panel>
      <PanelHead
        title={t("calendario.panelTitle")}
        sub={
          session?.role === "admin"
            ? t("calendario.subBranch", { sede: session.sedeName || "" })
            : t("calendario.subAll", { negocio: session?.negocioName || "—" })
        }
        right={
          <Button size="sm" onClick={() => router.push(`${ROUTES.reservas}?nueva=1`)}>
            {t("dashboard.addBooking")}
          </Button>
        }
      />
      <CalendarGrid
        events={events}
        festivos={festivos}
        onEventClick={(id, data) => data ? popup.open(data) : popup.open(id)}
        onViewChange={(v) => toast(t("common.comingSoon", { view: v }), "default")}
      />
    </Panel>
  );
}
