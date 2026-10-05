"use client";
import { useMemo, useState } from "react";
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

  /* Sincronización del calendario oficial (solo superadmin): se corre una
     vez al año, cuando sale el calendario del siguiente. */
  const [anioSync, setAnioSync] = useState(() => new Date().getFullYear() + 1);
  const [sincronizando, setSincronizando] = useState(false);

  const sincronizarFestivos = async () => {
    setSincronizando(true);
    try {
      const r = await FestivosApi.sincronizar(anioSync);
      toast(
        t("calendario.festivosResultado", {
          autonomicos: r.autonomicosCount,
          nacionales: r.nacionalesCount,
          anio: r.anio,
        }),
        "success",
      );
      if (r.comunidadesFallidas?.length) {
        toast(t("calendario.festivosFallidas", { comunidades: r.comunidadesFallidas.join(", ") }), "error");
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.error"), "error");
    } finally {
      setSincronizando(false);
    }
  };

  const { data: lista, reload } = useData(
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
      {session?.role === "superadmin" && (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700 }}>
            {t("calendario.festivosAnio")}
            <input
              type="number"
              min={2020}
              max={2099}
              value={anioSync}
              onChange={(e) => setAnioSync(e.target.valueAsNumber || new Date().getFullYear())}
              style={{ width: 110, padding: "7px 9px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", color: "inherit" }}
            />
          </label>
          <Button size="sm" disabled={sincronizando} onClick={() => void sincronizarFestivos()}>
            {sincronizando ? t("calendario.festivosSincronizando") : t("calendario.festivosSincronizar")}
          </Button>
        </div>
      )}

      <CalendarGrid
        events={events}
        festivos={festivos}
        onEventClick={(id, data) => data ? popup.open(data, reload) : popup.open(id, reload)}
        onViewChange={(v) => toast(t("common.comingSoon", { view: v }), "default")}
      />

      {/* Atribución exigida por los términos de uso de la fuente de festivos */}
      <p style={{ marginTop: 12, fontSize: 12, color: "var(--slate-500)" }}>
        {t("calendario.festivosCreditos")}{" "}
        <a href="https://calendariosnacionales.com" target="_blank" rel="noopener noreferrer">
          {t("calendario.festivosFuente")}
        </a>
      </p>
    </Panel>
  );
}
