"use client";
/* ============================================================
   Calendario del profesional — solo sus propias reservas
   (misma fuente que "Mis Reservas": ReservasController.getByEmpleado)
============================================================ */
import { ReservasController } from "@/controllers/ReservasController";
import { useSession } from "@/context/SessionContext";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/i18n";
import { useReservaPopup } from "@/components/reservas/ReservaPopupContext";
import Panel, { PanelHead } from "@/components/ui/Panel";
import CalendarGrid from "@/components/ui/CalendarGrid";
import { FestivosApi } from "@/api/modules";
import { useMemo } from "react";

export default function EmployeeCalendarioPage() {
  const { session } = useSession();
  const { t, locale } = useI18n();
  const popup = useReservaPopup();

  /* Festivos de la sede del profesional: son un aviso visual, no bloquean
     nada (si ese día no se trabaja, se cierra con los días cerrados). */
  const { data: diasFestivos } = useData(
    () => FestivosApi.findAll({
      anio: new Date().getFullYear(),
      sedeId: session?.sedeId ? Number(session.sedeId) : undefined,
    }).catch(() => []),
    [session?.sedeId],
    [],
  );

  const festivos = useMemo(
    () => Object.fromEntries((diasFestivos || []).map((f) => [f.fecha.slice(0, 10), f.nombre])),
    [diasFestivos],
  );

  const { data: mias, reload } = useData(
    () => ReservasController.getByEmpleado(session, locale),
    [session?.id, session?.sedeId, session?.profesionalId, locale], []
  );

  const map = ReservasController.buildCalendarMap(mias);
  const events = Object.fromEntries(
    Object.entries(map).map(([fecha, rs]) => [
      fecha,
      rs.map((r) => ({ id: r.id, label: `${r.hora} ${r.cliente.split(" ")[0]}`, data: r })),
    ])
  );

  return (
    <Panel>
      <PanelHead
        title={t("employee.myCalendar")}
        sub={`${session?.especialidad || t("roles.employee")} · ${session?.sedeName || ""}`}
      />
      <CalendarGrid
        events={events}
        festivos={festivos}
        maxPerCell={3}
        onEventClick={(id, data) => data ? popup.open(data, reload) : popup.open(id, reload)}
      />
    </Panel>
  );
}
